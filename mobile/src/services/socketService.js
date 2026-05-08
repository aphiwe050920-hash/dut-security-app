import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;
let alertCallback = null;
let locationCallback = null;

export const connectSocket = (userId, role) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    socket.emit('join_room', role);
    socket.emit('join_user', userId);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('reconnect', (attempt) => {
    console.log('🔄 Socket reconnected after', attempt, 'attempts');
    socket.emit('join_room', role);
    socket.emit('join_user', userId);
  });

  socket.on('connect_error', (err) => {
    console.log('⚠️ Socket error:', err.message);
  });

  // Listen for new alerts globally
  socket.on('new_alert', (alert) => {
    console.log('🚨 New alert received:', alert.type);
    if (alertCallback) alertCallback(alert);
  });

  // Listen for location updates (security side)
  socket.on('user_location_update', (data) => {
    if (locationCallback) locationCallback(data);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    alertCallback = null;
    locationCallback = null;
  }
};

export const onNewAlert = (callback) => {
  alertCallback = callback;
  if (socket) {
    socket.off('new_alert');
    socket.on('new_alert', (alert) => {
      if (alertCallback) alertCallback(alert);
    });
  }
};

export const offNewAlert = () => {
  alertCallback = null;
  if (socket) socket.off('new_alert');
};

export const onLocationUpdate = (callback) => {
  locationCallback = callback;
  if (socket) {
    socket.off('user_location_update');
    socket.on('user_location_update', (data) => {
      if (locationCallback) locationCallback(data);
    });
  }
};

export const offLocationUpdate = () => {
  locationCallback = null;
  if (socket) socket.off('user_location_update');
};

export const emitLocationUpdate = (userId, coords, role) => {
  if (socket?.connected) {
    socket.emit('location_update', { userId, coords, role });
  }
};

export const isSocketConnected = () => socket?.connected || false;

export const requestOnlineUsers = () => {
  if (socket?.connected) {
    socket.emit('get_online_users');
  }
};

export const onOnlineUsersList = (callback) => {
  if (!socket) return;
  socket.on('online_users_list', callback);
};

export const onAllLocations = (callback) => {
  if (!socket) return;
  socket.on('all_locations', callback);
};