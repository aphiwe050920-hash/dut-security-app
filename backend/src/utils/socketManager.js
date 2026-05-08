let io;
const connectedUsers = new Map();
// Store last known location per user
const userLocations = new Map();

const initSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    socket.on('join_room', (role) => {
      socket.join(role);
      console.log(`👤 ${socket.id} → room: ${role}`);
    });

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      connectedUsers.set(userId, {
        socketId: socket.id,
        connectedAt: new Date(),
      });

      // Notify security/admin of new user online
      io.to('security').emit('user_connected', { userId });
      io.to('admin').emit('user_connected', { userId });

      console.log(`👤 User ${userId} online. Total: ${connectedUsers.size}`);
    });

    // Security requests list of ALL currently online users
    socket.on('get_online_users', () => {
      const onlineList = Array.from(connectedUsers.keys());
      socket.emit('online_users_list', { userIds: onlineList });

      // Also send last known locations
      const locations = {};
      userLocations.forEach((loc, userId) => {
        locations[userId] = loc;
      });
      socket.emit('all_locations', { locations });
    });

    // Live location updates
    socket.on('location_update', (data) => {
      const { userId, coords, role } = data;

      // Store latest location
      userLocations.set(userId, {
        ...coords,
        role,
        updatedAt: new Date().toISOString(),
      });

      // Broadcast to security and admin
      io.to('security').emit('user_location_update', {
        userId, coords, role,
      });
      io.to('admin').emit('user_location_update', {
        userId, coords, role,
      });
    });

    // Real-time chat
    socket.on('send_message', async (data) => {
      const { conversationId, receiver, roomType } = data;

      if (receiver?._id) {
        io.to(`user_${receiver._id}`).emit('receive_message', data);
      }
      if (roomType === 'user_security') {
        io.to('security').emit('receive_message', data);
      }
      if (roomType === 'security_admin') {
        io.to('admin').emit('receive_message', data);
        io.to('security').emit('receive_message', data);
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('user_typing', data);
      }
    });
    socket.on('stop_typing', (data) => {
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('user_stop_typing', data);
      }
    });

    // Broadcast message from security
    socket.on('broadcast_message', (data) => {
      io.emit('campus_announcement', data);
    });

    // Panic alarm
    socket.on('panic_alarm', (data) => {
      io.to('security').emit('play_alarm', data);
      io.to('admin').emit('play_alarm', data);
      console.log(`🚨 PANIC by: ${data.userName}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, info] of connectedUsers.entries()) {
        if (info.socketId === socket.id) {
          connectedUsers.delete(userId);
          io.to('security').emit('user_disconnected', { userId });
          io.to('admin').emit('user_disconnected', { userId });
          console.log(`❌ User ${userId} offline`);
          break;
        }
      }
      console.log(`❌ Socket ${socket.id} disconnected`);
    });
  });
};

const broadcastAlert = (alert) => {
  if (!io) return;
  io.emit('new_alert', {
    _id: alert._id,
    type: alert.type,
    message: alert.message,
    location: alert.location,
    priority: alert.priority,
    aiPriorityScore: alert.aiPriorityScore,
    triggeredBy: alert.triggeredBy,
    status: alert.status,
    createdAt: alert.createdAt,
  });
  io.to('security').emit('emergency_alert', alert);
  console.log(`📡 Alert broadcast: [${alert.priority?.toUpperCase()}] ${alert.type}`);
};

const sendToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

const sendToRole = (role, event, data) => {
  if (!io) return;
  io.to(role).emit(event, data);
};

const getConnectedUsers = () => connectedUsers;

module.exports = {
  initSocket,
  broadcastAlert,
  sendToUser,
  sendToRole,
  getConnectedUsers,
};