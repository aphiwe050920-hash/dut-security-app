import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isExpoGo = process.env.EXPO_PUBLIC_APP_ENV !== 'production';

// Only set handler if supported
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('Notification handler not available');
}

export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Notification permission denied');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#CC0000',
        sound: 'default',
      }).catch(() => {});

      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      }).catch(() => {});
    }

    console.log('✅ Local notifications ready');
    return 'local-only';
  } catch (error) {
    console.log('Notifications not fully supported in this environment');
    return null;
  }
};

export const sendLocalNotification = async ({
  title, body, data = {}, urgent = false,
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: urgent ? 'emergency' : 'general',
        }),
      },
      trigger: null,
    });
  } catch (error) {
    // Silently fail in Expo Go - alert banner still shows via socket
    console.log('Local notification skipped:', error.message);
  }
};

export const sendEmergencyNotification = (alert) => {
  const icons = {
    panic: '🆘', fire: '🔥',
    medical: '🏥', suspicious: '👁️', general: '⚠️',
  };
  return sendLocalNotification({
    title: `${icons[alert.type] || '🚨'} ${alert.type?.toUpperCase()} EMERGENCY`,
    body: alert.message || 'Emergency alert triggered nearby',
    data: { alertId: alert._id },
    urgent: true,
  });
};

export const addNotificationListener = (handler) => {
  try {
    return Notifications.addNotificationReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
};

export const addNotificationResponseListener = (handler) => {
  try {
    return Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
};