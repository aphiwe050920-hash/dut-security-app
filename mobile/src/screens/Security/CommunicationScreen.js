import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socketService';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function CommunicationScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('broadcast');
  const flatListRef = useRef(null);

  const QUICK_MESSAGES = [
    '🚨 All students report to nearest building immediately',
    '🔒 Campus is on lockdown — do not move',
    '✅ Situation resolved — campus is safe',
    '⚠️ Suspicious activity reported — stay alert',
    '🏥 Medical emergency — clear the area',
    '🔥 Fire alert — evacuate immediately',
  ];

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('campus_announcement', (data) => {
      setMessages((prev) => [...prev, { ...data, incoming: true }]);
    });

    return () => {
      socket?.off('campus_announcement');
    };
  }, []);

  const sendBroadcast = (msg) => {
    const message = msg || broadcastMsg.trim();
    if (!message) {
      Alert.alert('Error', 'Please enter a message to broadcast');
      return;
    }

    const socket = getSocket();
    if (!socket?.connected) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    const data = {
      message,
      sentBy: user?.name,
      role: user?.role,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };

    socket.emit('broadcast_message', data);
    setMessages((prev) => [...prev, { ...data, incoming: false }]);
    setBroadcastMsg('');

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.msgBubble,
      item.incoming ? styles.msgIncoming : styles.msgOutgoing,
    ]}>
      {item.incoming && (
        <Text style={styles.msgSender}>📢 {item.sentBy}</Text>
      )}
      <Text style={[
        styles.msgText,
        item.incoming ? styles.msgTextIncoming : styles.msgTextOutgoing,
      ]}>
        {item.message}
      </Text>
      <Text style={styles.msgTime}>
        {formatDate(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📢 Communications</Text>
        <Text style={styles.headerSub}>Security Officer: {user?.name}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'broadcast', label: '📡 Broadcast' },
          { key: 'log', label: '💬 Message Log' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'broadcast' ? (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View style={styles.broadcastContainer}>
              {/* Live Broadcast Input */}
              <View style={styles.broadcastCard}>
                <Text style={styles.cardTitle}>📡 Send Campus-Wide Alert</Text>
                <Text style={styles.cardSub}>
                  Message will be sent to ALL connected users
                </Text>
                <TextInput
                  style={styles.broadcastInput}
                  placeholder="Type your message to broadcast..."
                  placeholderTextColor={COLORS.grey}
                  value={broadcastMsg}
                  onChangeText={setBroadcastMsg}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.broadcastBtn}
                  onPress={() => sendBroadcast(null)}
                >
                  <Text style={styles.broadcastBtnText}>
                    📡 BROADCAST NOW
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Messages */}
              <Text style={styles.quickTitle}>⚡ Quick Messages</Text>
              {QUICK_MESSAGES.map((msg, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickMsgCard}
                  onPress={() => {
                    Alert.alert(
                      'Send Quick Message',
                      msg,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Send', onPress: () => sendBroadcast(msg) },
                      ]
                    );
                  }}
                >
                  <Text style={styles.quickMsgText}>{msg}</Text>
                  <Text style={styles.quickMsgIcon}>▶</Text>
                </TouchableOpacity>
              ))}
            </View>
          }
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.logContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySub}>
                Broadcasts will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id || item.timestamp}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary,
    padding: 24, paddingTop: 50,
  },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.white,
  },
  headerSub: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.grey, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  broadcastContainer: { padding: 16 },
  broadcastCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, elevation: 3, marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16, fontWeight: 'bold',
    color: COLORS.darkGrey, marginBottom: 4,
  },
  cardSub: { fontSize: 12, color: COLORS.grey, marginBottom: 14 },
  broadcastInput: {
    backgroundColor: COLORS.light, borderRadius: 10,
    padding: 14, fontSize: 14, color: COLORS.black,
    borderWidth: 1, borderColor: COLORS.border,
    minHeight: 80, textAlignVertical: 'top',
    marginBottom: 14,
  },
  broadcastBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    padding: 16, alignItems: 'center', elevation: 3,
  },
  broadcastBtnText: {
    color: COLORS.white, fontWeight: 'bold',
    fontSize: 15, letterSpacing: 1,
  },
  quickTitle: {
    fontSize: 16, fontWeight: 'bold',
    color: COLORS.darkGrey, marginBottom: 10,
  },
  quickMsgCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 2, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  quickMsgText: {
    flex: 1, fontSize: 13,
    color: COLORS.darkGrey, lineHeight: 18,
  },
  quickMsgIcon: {
    color: COLORS.primary, fontSize: 16,
    fontWeight: 'bold', marginLeft: 10,
  },
  logContainer: { flex: 1 },
  messageList: { padding: 16, paddingBottom: 40 },
  msgBubble: {
    maxWidth: '85%', borderRadius: 14,
    padding: 12, marginBottom: 10,
  },
  msgOutgoing: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  msgIncoming: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  msgSender: {
    fontSize: 11, color: COLORS.primary,
    fontWeight: 'bold', marginBottom: 4,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextOutgoing: { color: COLORS.white },
  msgTextIncoming: { color: COLORS.darkGrey },
  msgTime: {
    fontSize: 10, marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', paddingTop: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: COLORS.grey, fontSize: 16,
    fontWeight: '600',
  },
  emptySub: { color: COLORS.grey, fontSize: 13, marginTop: 6 },
});