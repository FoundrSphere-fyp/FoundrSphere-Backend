const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        type: 'error',
        message: 'No token provided' 
      });
    }

    // Verify JWT token
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Attach userId to request
    req.userId = verification.userId;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      type: 'error',
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = authMiddleware;
