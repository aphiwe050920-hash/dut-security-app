import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socketService';
import {
  sendMessageAPI, getMessagesAPI, markAsReadAPI,
} from '../../services/api';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function ChatRoomScreen({ route, navigation }) {
  const { conversationId, otherUser, roomType } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimer = useRef(null);

  const ROLE_COLORS = {
    student: '#3498db', staff: '#2ecc71',
    security: '#e74c3c', admin: '#9b59b6',
  };

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.name || 'Chat',
      headerShown: true,
      headerStyle: { backgroundColor: COLORS.secondary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: 'bold' },
    });

    loadMessages();
    setupSocketListeners();
    markAsReadAPI(conversationId).catch(() => {});

    return () => cleanupSocket();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await getMessagesAPI(conversationId);
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (err) {
      console.error('Message load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('receive_message', (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
        scrollToBottom();
        markAsReadAPI(conversationId).catch(() => {});
      }
    });

    socket.on('user_typing', (data) => {
      if (data.conversationId === conversationId &&
          data.senderId !== user._id) {
        setOtherTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.conversationId === conversationId) {
        setOtherTyping(false);
      }
    });
  };

  const cleanupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('receive_message');
    socket.off('user_typing');
    socket.off('user_stop_typing');
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTyping = (text) => {
    setInput(text);
    const socket = getSocket();

    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId,
        senderId: user._id,
        receiverId: otherUser?._id,
      });
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('stop_typing', {
        conversationId,
        receiverId: otherUser?._id,
      });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);

    const msgText = input.trim();
    setInput('');

    try {
      const res = await sendMessageAPI({
        receiverId: otherUser?._id,
        message: msgText,
        roomType,
      });

      const newMsg = res.data.message;
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      // Emit via socket for real-time delivery
      const socket = getSocket();
      socket?.emit('send_message', {
        ...newMsg,
        conversationId,
      });

    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
      setInput(msgText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender?._id === user._id ||
                   item.sender === user._id;

    return (
      <View style={[
        styles.msgRow,
        isMine ? styles.msgRowRight : styles.msgRowLeft,
      ]}>
        {!isMine && (
          <View style={[
            styles.msgAvatar,
            {
              backgroundColor:
                ROLE_COLORS[item.sender?.role] || COLORS.grey,
            },
          ]}>
            <Text style={styles.msgAvatarText}>
              {item.sender?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[
          styles.msgBubble,
          isMine ? styles.msgBubbleMine : styles.msgBubbleOther,
        ]}>
          {!isMine && (
            <Text style={styles.msgSenderName}>
              {item.sender?.name}
            </Text>
          )}
          {item.messageType === 'alert' && (
            <View style={styles.alertTag}>
              <Text style={styles.alertTagText}>
                🚨 LINKED TO ALERT
              </Text>
            </View>
          )}
          <Text style={[
            styles.msgText,
            isMine ? styles.msgTextMine : styles.msgTextOther,
          ]}>
            {item.message}
          </Text>
          <View style={styles.msgMeta}>
            <Text style={[
              styles.msgTime,
              isMine ? styles.msgTimeMine : styles.msgTimeOther,
            ]}>
              {formatDate(item.createdAt)}
            </Text>
            {isMine && (
              <Text style={styles.msgRead}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Chat header info */}
      <View style={styles.chatHeader}>
        <View style={[
          styles.headerAvatar,
          {
            backgroundColor:
              ROLE_COLORS[otherUser?.role] || COLORS.grey,
          },
        ]}>
          <Text style={styles.headerAvatarText}>
            {otherUser?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.headerName}>{otherUser?.name}</Text>
          <Text style={styles.headerRole}>
            {otherUser?.role?.toUpperCase()} •{' '}
            <Text style={styles.headerOnline}>● Online</Text>
          </Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>💬</Text>
              <Text style={styles.emptyChatText}>
                Start the conversation
              </Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {otherTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {otherUser?.name} is typing...
          </Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.grey}
          value={input}
          onChangeText={handleTyping}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.sendBtnText}>▶</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: {
    color: COLORS.white, fontSize: 16, fontWeight: 'bold',
  },
  headerName: {
    fontSize: 15, fontWeight: 'bold', color: COLORS.white,
  },
  headerRole: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  headerOnline: { color: COLORS.success },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '80%' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, alignSelf: 'flex-end',
  },
  msgAvatarText: {
    color: COLORS.white, fontSize: 12, fontWeight: 'bold',
  },
  msgBubble: {
    borderRadius: 18, padding: 12,
    maxWidth: '100%', elevation: 1,
  },
  msgBubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  msgSenderName: {
    fontSize: 11, fontWeight: 'bold',
    color: COLORS.primary, marginBottom: 4,
  },
  alertTag: {
    backgroundColor: 'rgba(204,0,0,0.15)',
    borderRadius: 6, padding: 4, marginBottom: 6,
  },
  alertTagText: { fontSize: 10, color: COLORS.danger, fontWeight: 'bold' },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMine: { color: COLORS.white },
  msgTextOther: { color: COLORS.darkGrey },
  msgMeta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 4, marginTop: 4,
  },
  msgTime: { fontSize: 10 },
  msgTimeMine: { color: 'rgba(255,255,255,0.6)' },
  msgTimeOther: { color: COLORS.grey },
  msgRead: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  typingContainer: {
    paddingHorizontal: 20, paddingVertical: 6,
  },
  typingText: {
    fontSize: 12, color: COLORS.grey, fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.white, padding: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: COLORS.light,
    borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14,
    color: COLORS.black, maxHeight: 100,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: COLORS.grey, elevation: 0 },
  sendBtnText: {
    color: COLORS.white, fontSize: 18, fontWeight: 'bold',
  },
  emptyChat: { alignItems: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { color: COLORS.grey, fontSize: 15 },
});