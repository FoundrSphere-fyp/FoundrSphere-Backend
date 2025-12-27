const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Import controllers
const getChatbotConversations = require('../controllers/chatbot/get-conversations');
const getChatbotConversation = require('../controllers/chatbot/get-conversation');
const createChatbotConversation = require('../controllers/chatbot/create-conversation');
const sendChatbotMessage = require('../controllers/chatbot/send-message');
const deleteChatbotConversation = require('../controllers/chatbot/delete-conversation');

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get('/conversations', getChatbotConversations);
router.get('/conversation/:conversationId', getChatbotConversation);
router.post('/conversation', createChatbotConversation);
router.post('/message', sendChatbotMessage);
router.delete('/conversation/:conversationId', deleteChatbotConversation);

module.exports = router;
