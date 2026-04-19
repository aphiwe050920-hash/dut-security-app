import React, { useEffect, useRef } from 'react';
import {
  Animated, Text, StyleSheet,
  TouchableOpacity, View,
} from 'react-native';
import { useAlerts } from '../context/AlertContext';
import { getPriorityColor } from '../utils/helpers';
import { COLORS } from '../utils/constants';

export default function AlertBanner() {
  const { newAlertBanner, clearBanner } = useAlerts();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newAlertBanner) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [newAlertBanner]);

  if (!newAlertBanner) return null;

  const alertIcons = {
    panic: '🆘', fire: '🔥',
    medical: '🏥', suspicious: '👁️', general: '⚠️',
  };

  const priorityColor = getPriorityColor(newAlertBanner.priority);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: priorityColor,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: priorityColor }]}>
        <Text style={styles.icon}>
          {alertIcons[newAlertBanner.type] || '🚨'}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          {newAlertBanner.type?.toUpperCase()} ALERT —{' '}
          <Text style={[styles.priority, { color: priorityColor }]}>
            {newAlertBanner.priority?.toUpperCase()}
          </Text>
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {newAlertBanner.message}
        </Text>
        <Text style={styles.user}>
          👤 {newAlertBanner.triggeredBy?.name || 'Unknown'}
        </Text>
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={clearBanner}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderLeftWidth: 5,
    paddingRight: 12,
    paddingVertical: 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconContainer: {
    width: 52, height: '100%',
    justifyContent: 'center', alignItems: 'center',
    minHeight: 60,
  },
  icon: { fontSize: 26 },
  content: { flex: 1, paddingHorizontal: 12 },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  priority: { fontWeight: 'bold' },
  message: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  user: { color: COLORS.grey, fontSize: 11, marginTop: 3 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: COLORS.grey, fontSize: 16 },
});