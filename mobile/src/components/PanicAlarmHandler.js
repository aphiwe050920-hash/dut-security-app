import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socketService';
import {
  loadAlarm, playAlarm, stopAlarm, unloadAlarm,
} from '../services/alarmService';
import { COLORS } from '../utils/constants';

export default function PanicAlarmHandler() {
  const { user } = useAuth();
  const [alarmVisible, setAlarmVisible] = React.useState(false);
  const [alarmData, setAlarmData] = React.useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const isSecurityOrAdmin =
    user?.role === 'security' || user?.role === 'admin';

  useEffect(() => {
    if (!isSecurityOrAdmin) return;

    loadAlarm();

    const socket = getSocket();
    if (!socket) return;

    socket.on('play_alarm', async (data) => {
      setAlarmData(data);
      setAlarmVisible(true);
      await playAlarm();
      startPulse();
    });

    return () => {
      socket?.off('play_alarm');
      stopPulse();
      unloadAlarm();
    };
  }, [isSecurityOrAdmin]);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15, duration: 400, useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const handleDismiss = async () => {
    await stopAlarm();
    stopPulse();
    setAlarmVisible(false);
    setAlarmData(null);
  };

  if (!isSecurityOrAdmin || !alarmVisible) return null;

  return (
    <Modal
      visible={alarmVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.alarmCard, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.alarmIconContainer}>
            <Text style={styles.alarmIcon}>🆘</Text>
          </View>

          <Text style={styles.alarmTitle}>PANIC ALERT!</Text>
          <Text style={styles.alarmSubtitle}>
            EMERGENCY TRIGGERED
          </Text>

          {alarmData && (
            <View style={styles.alarmInfo}>
              <Text style={styles.alarmInfoRow}>
                👤 {alarmData.userName || 'Unknown User'}
              </Text>
              <Text style={styles.alarmInfoRow}>
                📋 {alarmData.type?.toUpperCase() || 'PANIC'}
              </Text>
              {alarmData.location && (
                <Text style={styles.alarmInfoRow}>
                  📍 {alarmData.location.latitude?.toFixed(4)},{' '}
                  {alarmData.location.longitude?.toFixed(4)}
                </Text>
              )}
              <Text style={styles.alarmInfoRow}>
                💬 {alarmData.message || 'Emergency help needed'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissBtnText}>
              ✅ ACKNOWLEDGE & RESPOND
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.silenceBtn}
            onPress={handleDismiss}
          >
            <Text style={styles.silenceBtnText}>🔇 Silence Alarm</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alarmCard: {
    backgroundColor: '#1a0000',
    borderRadius: 20, padding: 28,
    width: '100%', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.danger,
    elevation: 20,
  },
  alarmIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, elevation: 8,
  },
  alarmIcon: { fontSize: 52 },
  alarmTitle: {
    fontSize: 32, fontWeight: 'bold',
    color: COLORS.danger, letterSpacing: 2,
  },
  alarmSubtitle: {
    fontSize: 14, color: COLORS.white,
    letterSpacing: 3, marginTop: 6, marginBottom: 20,
    opacity: 0.7,
  },
  alarmInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 16,
    width: '100%', marginBottom: 20, gap: 8,
  },
  alarmInfoRow: {
    color: COLORS.white, fontSize: 14, lineHeight: 22,
  },
  dismissBtn: {
    backgroundColor: COLORS.danger, borderRadius: 12,
    padding: 16, width: '100%', alignItems: 'center',
    elevation: 4, marginBottom: 10,
  },
  dismissBtnText: {
    color: COLORS.white, fontWeight: 'bold',
    fontSize: 15, letterSpacing: 1,
  },
  silenceBtn: {
    padding: 12, width: '100%', alignItems: 'center',
  },
  silenceBtnText: { color: COLORS.grey, fontSize: 14 },
});