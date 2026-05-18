const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db/connect');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// 1. IMPORT MEDIASOUP
const mediasoup = require('mediasoup');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Store online user socket IDs (Chat)
let onlineUsers = {};

// ─────────────────────────────────────────────────────────────
// 🎥 MEDIASOUP GLOBAL VARIABLES
// ─────────────────────────────────────────────────────────────
let worker;
let router; // We will use one global router (room) for this workshop
let producers = []; // Track active video producers
let consumers = []; // Track active video consumers
let transports = []; // Track active transports (connections)

// Media Codecs Configuration (Video/Audio formats)
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  },
];

// ─────────────────────────────────────────────────────────────
// 🛠️ MEDIASOUP STARTUP FUNCTION
// ─────────────────────────────────────────────────────────────
async function startMediasoup() {
  try {
    // A. Create the Worker (The C++ Process)
    worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 2000, // ⚠️ YOU MUST OPEN UDP PORTS 2000-2100 ON FIREWALL
      rtcMaxPort: 2100,
    });

    worker.on('died', () => {
      console.error('❌ Mediasoup worker died, exiting...');
      process.exit(1);
    });

    // B. Create the Router (The Room)
    router = await worker.createRouter({ mediaCodecs });
    console.log('✅ Mediasoup Worker & Router started');
  } catch (err) {
    console.error('❌ Failed to start Mediasoup:', err);
  }
}

// Initialize Mediasoup immediately
startMediasoup();


// ✅ Connect to database FIRST before setting up Socket.IO handlers
connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected for Socket.IO');

    // ──────────────────────────────────────────────
    // 🟢 SOCKET.IO LOGIC (Chat + Mediasoup)
    // ──────────────────────────────────────────────
    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      // ============================================
      // 💬 YOUR EXISTING CHAT LOGIC
      // ============================================

      // When user logs in, frontend sends: socket.emit("register", userId)
      socket.on("register", (userId) => {
        onlineUsers[userId] = socket.id;
        console.log("User registered:", userId, "→", socket.id);
      });

      // 📨 SEND MESSAGE
      socket.on("send_message", async (data) => {
        const { senderId, receiverId, content } = data;
        console.log(`Message from ${senderId} to ${receiverId}: ${content}`);

        try {
          // Find or create conversation
          let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId], $size: 2 }
          });

          if (!conversation) {
            conversation = await Conversation.create({
              participants: [senderId, receiverId],
              lastMessage: content,
              lastMessageAt: new Date()
            });
          } else {
            // Update existing conversation
            conversation.lastMessage = content;
            conversation.lastMessageAt = new Date();
            await conversation.save();
          }

          // Create message
          const message = await Message.create({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
          });

          // Send message to receiver if online
          const receiverSocketId = onlineUsers[receiverId];

          const payload = {
            _id: message._id,
            senderId,
            receiverId,
            content,
            createdAt: message.createdAt,
          };

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", payload);

            // Send notification
            io.to(receiverSocketId).emit("message_notification", {
              from: senderId,
              message: content,
            });

            console.log(`✅ Message delivered to ${receiverId}`);
          } else {
            console.log(`⚠️ Receiver ${receiverId} is offline`);
          }

          // Also send back to sender for chat UI consistency
          io.to(onlineUsers[senderId]).emit("message_sent", payload);

        } catch (error) {
          console.error('❌ Error in send_message:', error);
          socket.emit("message_error", {
            error: "Failed to send message",
            details: error.message
          });
        }
      });

      // ============================================
      // 🎥 NEW MEDIASOUP VIDEO/AUDIO LOGIC
      // ============================================

      // 1. Client asks capabilities
      socket.on('getRouterRtpCapabilities', (callback) => {
        if (!router) return;
        callback(router.rtpCapabilities);
      });

      // 2. Client asks to create Transport (Connection)
      socket.on('createWebRtcTransport', async ({ sender }, callback) => {
        try {
          const transport = await router.createWebRtcTransport({
            listenIps: [
              {
                ip: '0.0.0.0',
                // ⚠️ IMPORTANT: CHANGE TO PUBLIC IP IF ON VPS
                announcedIp: '127.0.0.1'
              }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
          });

          // Save transport info
          transports.push({ socketId: socket.id, transport, consumer: !sender });

          callback({
            params: {
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            }
          });
        } catch (error) {
          console.error(error);
          callback({ error: error.message });
        }
      });

      // 3. Connect Transport (DTLS)
      socket.on('transport-connect', async ({ dtlsParameters }) => {
        const item = transports.find(t => t.socketId === socket.id && !t.transport.dtlsParameters);
        if (item) {
          await item.transport.connect({ dtlsParameters });
        }
      });

      // 4. Client Sends Video (Produce)
      socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
    try {
        console.log('📤 Produce request:', { kind, socketId: socket.id });

        const producerTransportObj = transports.find(
            t => t.socketId === socket.id && t.producer === true
        );

        if (!producerTransportObj) {
            console.error('❌ No producer transport found');
            callback({ error: 'No producer transport found' });
            return;
        }

        const producer = await producerTransportObj.transport.produce({
            kind,
            rtpParameters,
        });

        producers.push({ 
            socketId: socket.id, 
            producer, 
            producerId: producer.id 
        });

        console.log('✅ Producer created:', {
            producerId: producer.id,
            kind: producer.kind,
            type: producer.type,
            paused: producer.paused
        });

        callback({ id: producer.id });

        // ✅ Notify OTHER clients about new producer
        socket.broadcast.emit('new-producer', { 
            producerId: producer.id,
            socketId: socket.id 
        });

        console.log('📢 Notified other clients about producer:', producer.id);

    } catch (error) {
        console.error('❌ Produce error:', error);
        callback({ error: error.message });
    }
});
      // 5. Client Receives Video (Consume)
     socket.on('transport-consume', async ({ producerId, rtpCapabilities }, callback) => {
    try {
        console.log('📥 Consume request:', { producerId, socketId: socket.id });

        // ✅ Check if router can consume
        if (!router.canConsume({ producerId, rtpCapabilities })) {
            console.error('❌ Cannot consume - incompatible codecs');
            callback({ error: 'Cannot consume - incompatible codecs' });
            return;
        }

        // ✅ Find consumer transport for this socket
        const consumerTransportObj = transports.find(
            t => t.socketId === socket.id && t.consumer === true
        );

        if (!consumerTransportObj) {
            console.error('❌ No consumer transport found for socket:', socket.id);
            callback({ error: 'No consumer transport found' });
            return;
        }

        console.log('✅ Found consumer transport:', consumerTransportObj.transport.id);

        // ✅ Create consumer - START PAUSED
        const consumer = await consumerTransportObj.transport.consume({
            producerId,
            rtpCapabilities,
            paused: true, // ✅ Start paused, client will resume
        });

        // ✅ Store consumer
        consumers.push({ 
            socketId: socket.id, 
            consumer, 
            consumerId: consumer.id,
            producerId 
        });

        console.log('✅ Consumer created:', {
            consumerId: consumer.id,
            producerId,
            kind: consumer.kind,
            paused: consumer.paused,
            type: consumer.type,
            rtpParameters: consumer.rtpParameters
        });

        // After creating consumer, add these event listeners
        consumer.on('transportclose', () => {
            console.log('🚪 Consumer transport closed:', consumer.id);
        });

        consumer.on('producerclose', () => {
            console.log('🚪 Producer closed for consumer:', consumer.id);
        });

        consumer.on('producerpause', () => {
            console.log('⏸️ Producer paused for consumer:', consumer.id);
        });

        consumer.on('producerresume', () => {
            console.log('▶️ Producer resumed for consumer:', consumer.id);
        });

        consumer.observer.on('close', () => {
            console.log('👁️ Consumer observer: closed');
        });

        consumer.observer.on('pause', () => {
            console.log('👁️ Consumer observer: paused');
        });

        consumer.observer.on('resume', () => {
            console.log('👁️ Consumer observer: resumed');
        });

        // ✅ Send consumer params to client
        callback({
            params: {
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            }
        });

    } catch (error) {
        console.error('❌ Consume error:', error);
        callback({ error: error.message });
    }
});




     socket.on('consumer-resume', async ({ consumerId }, callback) => {
    console.log('🔄 Resume request for consumer:', consumerId);
    
    try {
        const consumerObj = consumers.find(c => c.consumerId === consumerId);
        
        if (!consumerObj) {
            console.error('❌ Consumer not found:', consumerId);
            if (callback) callback({ error: 'Consumer not found' });
            return;
        }

        if (consumerObj.consumer.paused) {
            await consumerObj.consumer.resume();
            console.log('✅ Consumer resumed on server:', {
                consumerId,
                paused: consumerObj.consumer.paused
            });
        } else {
            console.log('ℹ️ Consumer already active:', consumerId);
        }
        
        if (callback) callback({ success: true });
        
    } catch (error) {
        console.error('❌ Error resuming consumer:', error);
        if (callback) callback({ error: error.message });
    }
});

      // 🆕 7. Get Existing Producers (THIS IS THE NEW CODE)
      socket.on('getProducers', (callback) => {
        // Return a list of all producer IDs currently in the room
        const producerList = producers.map(p => p.producer.id);
        callback(producerList);
      });

      // ============================================
      // 🔌 DISCONNECT CLEANUP
      // ============================================
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // 1. Chat Cleanup
        Object.keys(onlineUsers).forEach((userId) => {
          if (onlineUsers[userId] === socket.id) {
            delete onlineUsers[userId];
          }
        });

        // 2. Mediasoup Cleanup (Close producers/consumers for this socket)
        consumers = consumers.filter(c => {
          if (c.socketId === socket.id) {
            c.consumer.close();
            return false;
          }
          return true;
        });

        producers = producers.filter(p => {
          if (p.socketId === socket.id) {
            p.producer.close();
            return false;
          }
          return true;
        });

        transports = transports.filter(t => {
          if (t.socketId === socket.id) {
            t.transport.close();
            return false;
          }
          return true;
        });
      });
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// CORS: allow all origins for now (reflect origin when sent, for credential support)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Database connection middleware - ensures DB is connected before any route
// app.use(async (req, res, next) => {
//   try {
//     await connectDB(process.env.MONGO_URI);
//     next();
//   } catch (error) {
//     console.error('Database connection error:', error);
//     return res.status(500).json({
//       type: "error",
//       message: "Database connection failed"
//     });
//   }
// });

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/founders', require('./routes/founders'));
app.use('/api/v1/chatbot', require('./routes/chatbot'));
app.use('/api/v1/posts', require('./routes/posts'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/embeddings', require('./routes/embeddings'));
app.use('/api/v1/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  console.log("Hello world");
  return res.status(200).json({ success: true });
});

const port = process.env.PORT || 8080;

// For local development
const start = async () => {
  try {
    server.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`🔌 Socket.IO is ready`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// Export the app for Vercel
module.exports = app;

// Start server locally if needed
if (require.main === module) {
  start();
}