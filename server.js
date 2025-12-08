const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db/connect');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Store online user socket IDs
let onlineUsers = {};

// ✅ Connect to database FIRST before setting up Socket.IO handlers
connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected for Socket.IO');
    
    // ──────────────────────────────────────────────
    // 🟢 SOCKET.IO LOGIC (after DB connection)
    // ──────────────────────────────────────────────
    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

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

      // User disconnected
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        Object.keys(onlineUsers).forEach((userId) => {
          if (onlineUsers[userId] === socket.id) {
            delete onlineUsers[userId];
          }
        });
      });
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Enhanced CORS middleware for Vercel deployment
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001'
  ];

  const origin = req.headers.origin;

  // Allow all origins for now to troubleshoot
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for:', req.url);
    console.log('Origin:', origin);
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Database connection middleware - ensures DB is connected before any route
app.use(async (req, res, next) => {
  try {
    await connectDB(process.env.MONGO_URI);
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      type: "error",
      message: "Database connection failed"
    });
  }
});

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/founders', require('./routes/founders'));

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