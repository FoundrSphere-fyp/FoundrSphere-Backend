const express = require('express');
const router = express.Router();

const getOrCreateConversation = require('../controllers/messages/get-or-create-conversation');
const getConversations = require('../controllers/messages/get-conversations');
const getMessages = require('../controllers/messages/get-messages');
const markAsRead = require('../controllers/messages/mark-as-read');

router.post('/get-or-create', getOrCreateConversation);
router.get('/get-conversations', getConversations);
router.post('/get-messages', getMessages);
router.post('/mark-read', markAsRead);

module.exports = router;