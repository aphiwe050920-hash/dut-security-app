let io;
const connectedUsers = new Map();

const initSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // Join role room
    socket.on('join_room', (role) => {
      socket.join(role);
      console.log(`👤 ${socket.id} → room: ${role}`);
    });

    // Join user-specific room
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      connectedUsers.set(userId, socket.id);
      // Notify security of new user online
      io.to('security').emit('user_connected', { userId, socketId: socket.id });
    });

    // Live location updates from users
    socket.on('location_update', (data) => {
      const { userId, coords, role } = data;
      // Forward to security and admin
      io.to('security').emit('user_location_update', { userId, coords, role });
      io.to('admin').emit('user_location_update', { userId, coords, role });
    });

    // Security officer status
    socket.on('security_online', (data) => {
      io.emit('security_status', { ...data, online: true });
    });

    // Broadcast message from security
    socket.on('broadcast_message', (data) => {
      io.emit('campus_announcement', data);
      console.log(`📢 Broadcast: ${data.message}`);
    });

    socket.on('disconnect', () => {
      // Remove from connected users map
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          io.to('security').emit('user_disconnected', { userId });
          break;
        }
      }
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });
};

const broadcastAlert = (alert) => {
  if (!io) return;

  // Broadcast to ALL connected clients
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

  // Extra emit specifically to security room
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