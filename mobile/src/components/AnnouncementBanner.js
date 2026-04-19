import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getSocket } from '../services/socketService';
import { COLORS } from '../utils/constants';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('campus_announcement', (data) => {
      setAnnouncement(data);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        tension: 60, friction: 10,
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, 8000);
    });

    return () => {
      socket?.off('campus_announcement');
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100, duration: 400, useNativeDriver: true,
    }).start(() => setAnnouncement(null));
  };

  if (!announcement) return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.icon}>📢</Text>
      <View style={styles.content}>
        <Text style={styles.title}>Campus Announcement</Text>
        <Text style={styles.message} numberOfLines={2}>
          {announcement.message}
        </Text>
        <Text style={styles.sender}>— {announcement.sentBy}</Text>
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 9998, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a3a4a', padding: 14,
    borderBottomWidth: 3, borderBottomColor: COLORS.info,
    elevation: 18,
  },
  icon: { fontSize: 26, marginRight: 12 },
  content: { flex: 1 },
  title: {
    color: COLORS.info, fontWeight: 'bold',
    fontSize: 12, letterSpacing: 0.5,
  },
  message: {
    color: COLORS.white, fontSize: 13,
    marginTop: 2, lineHeight: 18,
  },
  sender: { color: COLORS.grey, fontSize: 11, marginTop: 3 },
  closeBtn: { padding: 8 },
  closeText: { color: COLORS.grey, fontSize: 16 },
});