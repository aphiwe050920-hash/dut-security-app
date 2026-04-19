import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push',
  '`expo-notifications` functionality',
]);

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import AlertBanner from './src/components/AlertBanner';
import AnnouncementBanner from './src/components/AnnouncementBanner';
import SocketStatusBar from './src/components/SocketStatusBar';
import {
  addNotificationListener,
  addNotificationResponseListener,
} from './src/services/notificationService';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    notificationListener.current = addNotificationListener((n) => {
      console.log('📩 Notification:', n.request.content.title);
    });
    responseListener.current = addNotificationResponseListener((r) => {
      console.log('👆 Tapped:', r.notification.request.content.data);
    });
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <AlertProvider>
        <View style={styles.container}>
          <StatusBar style="light" backgroundColor="#1a1a2e" />
          <AppNavigator />
          <AlertBanner />
          <AnnouncementBanner />
          <SocketStatusBar />
        </View>
      </AlertProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});