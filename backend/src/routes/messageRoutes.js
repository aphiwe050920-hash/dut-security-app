const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  getSecurityUsers,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/security-users', protect, getSecurityUsers);
router.get('/:conversationId', protect, getMessages);
router.put('/:conversationId/read', protect, markAsRead);

module.exports = router;