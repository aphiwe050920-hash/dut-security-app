import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { isSocketConnected, getSocket } from '../services/socketService';
import { COLORS } from '../utils/constants';

export default function SocketStatusBar() {
  const [connected, setConnected] = useState(isSocketConnected());
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
      // Show briefly then hide
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    };

    const onDisconnect = () => {
      setConnected(false);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }).start();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.bar,
        { opacity: fadeAnim, backgroundColor: connected ? COLORS.success : COLORS.danger },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>
        {connected ? '🟢 Connected to live alerts' : '🔴 Reconnecting...'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  text: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
});