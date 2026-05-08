import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push',
  '`expo-notifications` functionality',
]);

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import AlertBanner from './src/components/AlertBanner';
import AnnouncementBanner from './src/components/AnnouncementBanner';
import SocketStatusBar from './src/components/SocketStatusBar';
import PanicAlarmHandler from './src/components/PanicAlarmHandler';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'light'} backgroundColor="#1a1a2e" />
      <AppNavigator />
      <AlertBanner />
      <AnnouncementBanner />
      <SocketStatusBar />
      <PanicAlarmHandler />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});