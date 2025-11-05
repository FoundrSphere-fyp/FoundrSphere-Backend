const express = require('express');

const connectDB = require('./db/connect');

require('dotenv').config();

const app = express();

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


app.get('/', (req, res) => {
  console.log("Hello world");
  return res.status(200).json({ success: true });
});

const port = process.env.PORT || 8080;

// For local development
const start = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

// Export the app for Vercel
module.exports = app;

// Start server locally if needed
if (require.main === module) {
  start();
}