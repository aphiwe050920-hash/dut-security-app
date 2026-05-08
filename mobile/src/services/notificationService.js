// Notifications disabled — not supported in Expo Go SDK 54
// Real-time alerts handled by Socket.IO + AlertBanner

export const registerForPushNotifications = async () => {
  console.log('📱 Notifications disabled in Expo Go');
  return null;
};

export const sendLocalNotification = async ({ title, body }) => {
  console.log(`🔔 [Notification] ${title}: ${body}`);
};

export const sendEmergencyNotification = (alert) => {
  console.log(`🚨 [Alert] ${alert?.type}: ${alert?.message}`);
};

export const addNotificationListener = () => {
  return { remove: () => {} };
};

export const addNotificationResponseListener = () => {
  return { remove: () => {} };
};

export const cancelAllNotifications = async () => {};