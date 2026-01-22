const express = require('express');

const router = express.Router();
const chatController = require('../controllers/chatController');

// Conversations
router.post('/conversations', chatController.createOrGetConversation);
router.get('/conversations/:conversationId', chatController.getConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.listMessages);
router.post('/conversations/:conversationId/messages', chatController.postMessage);

module.exports = router;
