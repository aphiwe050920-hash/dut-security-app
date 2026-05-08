const Message = require('../models/Message');
const User = require('../models/User');

// @desc  Get or create conversation between two users
const getConversationId = (id1, id2) => {
  return [id1, id2].sort().join('_');
};

// @desc  Send a message
// @route POST /api/messages/send
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, messageType, roomType, linkedAlert } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const conversationId = receiverId
      ? getConversationId(req.user._id.toString(), receiverId)
      : `security_admin_room`;

    const newMessage = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId || null,
      message,
      messageType: messageType || 'text',
      roomType: roomType || 'user_security',
      linkedAlert: linkedAlert || null,
    });

    await newMessage.populate('sender', 'name email role');
    await newMessage.populate('receiver', 'name email role');

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get messages for a conversation
// @route GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all conversations for a user
// @route GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          sender: { $first: '$sender' },
          receiver: { $first: '$receiver' },
          isRead: { $first: '$isRead' },
          messageType: { $first: '$messageType' },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    // Populate sender/receiver
    const populated = await User.populate(conversations, [
      { path: 'sender', select: 'name email role' },
      { path: 'receiver', select: 'name email role' },
    ]);

    res.status(200).json({ success: true, conversations: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get chattable users based on role
// @route GET /api/messages/security-users
const getSecurityUsers = async (req, res) => {
  try {
    let users = [];

    if (req.user.role === 'student' || req.user.role === 'staff') {
      // Students/staff see security and admin only
      users = await User.find({
        role: { $in: ['security', 'admin'] },
        _id: { $ne: req.user._id },
      }).select('name email role');

    } else if (req.user.role === 'security') {
      // Security sees ALL users (students, staff, admin)
      users = await User.find({
        _id: { $ne: req.user._id },
      }).select('name email role');

    } else if (req.user.role === 'admin') {
      // Admin sees security officers
      users = await User.find({
        role: { $in: ['security', 'admin'] },
        _id: { $ne: req.user._id },
      }).select('name email role');
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc  Mark messages as read
// @route PUT /api/messages/:conversationId/read
const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        receiver: req.user._id,
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getSecurityUsers,
  markAsRead,
};