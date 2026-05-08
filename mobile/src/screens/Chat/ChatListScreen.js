import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getSocket } from '../../services/socketService';
import {
  getConversationsAPI,
  getSecurityUsersAPI,
} from '../../services/api';
import { formatDate } from '../../utils/helpers';

const ROLE_COLORS = {
  student: '#3498db', staff: '#2ecc71',
  security: '#e74c3c', admin: '#9b59b6',
};

const ROLE_ICONS = {
  student: '🎓', staff: '👔',
  security: '🛡️', admin: '⚙️',
};

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [securityUsers, setSecurityUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadData();
    setupSocketListeners();
    return () => cleanupSocket();
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    // Track online users
    socket.on('user_connected', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on('user_disconnected', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // New message — update unread count
    socket.on('receive_message', (data) => {
      const senderId = data.sender?._id;
      if (senderId && senderId !== user._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }));
        // Refresh conversations to show latest message
        loadData();
      }
    });
  };

  const cleanupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('user_connected');
    socket.off('user_disconnected');
    socket.off('receive_message');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [convRes, secRes] = await Promise.all([
        getConversationsAPI(),
        getSecurityUsersAPI(),
      ]);
      setConversations(convRes.data.conversations);
      setSecurityUsers(
        secRes.data.users.filter((u) => u._id !== user._id)
      );
    } catch (err) {
      console.error('Chat load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const startChat = (otherUser) => {
    const conversationId = [user._id, otherUser._id].sort().join('_');
    // Clear unread count for this conversation
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
    navigation.navigate('ChatRoom', {
      conversationId,
      otherUser,
      roomType: 'user_security',
    });
  };

  const openConversation = (conv) => {
    const otherUser =
      conv.sender?._id === user._id ? conv.receiver : conv.sender;
    if (!otherUser) return;
    // Clear unread count
    setUnreadCounts((prev) => ({ ...prev, [conv._id]: 0 }));
    navigation.navigate('ChatRoom', {
      conversationId: conv._id,
      otherUser,
      roomType: conv.roomType || 'user_security',
    });
  };

  // ── Filtered data based on search query ──
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const otherUser =
      conv.sender?._id === user._id ? conv.receiver : conv.sender;
    const name = otherUser?.name?.toLowerCase() || '';
    const msg = conv.lastMessage?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || msg.includes(q);
  });

  const filteredContacts = securityUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // ── Render Conversation Card ──
  const renderConversation = ({ item }) => {
    const otherUser =
      item.sender?._id === user._id ? item.receiver : item.sender;
    if (!otherUser) return null;

    const isOnline = onlineUsers.has(otherUser._id);
    const unread = unreadCounts[item._id] || 0;
    const hasUnread = unread > 0 ||
      (!item.isRead && item.receiver?._id === user._id);

    return (
      <TouchableOpacity
        style={[styles.convCard, { backgroundColor: theme.card }]}
        onPress={() => openConversation(item)}
        activeOpacity={0.7}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            { backgroundColor: ROLE_COLORS[otherUser.role] || '#95a5a6' },
          ]}>
            <Text style={styles.avatarText}>
              {otherUser.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Conversation Info */}
        <View style={styles.convInfo}>
          <View style={styles.convTop}>
            <View style={styles.convNameRow}>
              <Text style={[styles.convName, { color: theme.text }]}>
                {otherUser.name}
              </Text>
              <View style={[
                styles.rolePill,
                { backgroundColor: ROLE_COLORS[otherUser.role] + '22' },
              ]}>
                <Text style={[
                  styles.rolePillText,
                  { color: ROLE_COLORS[otherUser.role] },
                ]}>
                  {ROLE_ICONS[otherUser.role]} {otherUser.role}
                </Text>
              </View>
            </View>
            <Text style={[styles.convTime, { color: theme.subText }]}>
              {item.lastMessageTime
                ? formatDate(item.lastMessageTime)
                : ''}
            </Text>
          </View>
          <View style={styles.convBottom}>
            <Text
              style={[
                styles.convLast,
                { color: hasUnread ? theme.text : theme.subText },
                hasUnread && styles.convLastUnread,
              ]}
              numberOfLines={1}
            >
              {item.messageType === 'alert'
                ? '🚨 ' + item.lastMessage
                : item.lastMessage || 'Start a conversation'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unread > 9 ? '9+' : unread || '●'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Contact Card ──
  const renderContact = ({ item }) => {
    const isOnline = onlineUsers.has(item._id);

    return (
      <TouchableOpacity
        style={[styles.contactCard, { backgroundColor: theme.card }]}
        onPress={() => startChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            { backgroundColor: ROLE_COLORS[item.role] || '#95a5a6' },
          ]}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: theme.text }]}>
            {item.name}
          </Text>
          <View style={styles.contactMeta}>
            <Text style={[
              styles.contactRole,
              { color: ROLE_COLORS[item.role] },
            ]}>
              {ROLE_ICONS[item.role]} {item.role?.toUpperCase()}
            </Text>
            {isOnline && (
              <Text style={styles.onlineLabel}>● Online</Text>
            )}
          </View>
          <Text
            style={[styles.contactEmail, { color: theme.subText }]}
            numberOfLines={1}
          >
            {item.email}
          </Text>
        </View>

        {/* Chat Button */}
        <View style={[
          styles.chatBtn,
          { backgroundColor: ROLE_COLORS[item.role] + '22' },
        ]}>
          <Text style={styles.chatBtnText}>💬</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>💬 Messages</Text>
          <View style={styles.headerBadge}>
            <View style={styles.onlineDotSmall} />
            <Text style={styles.headerBadgeText}>
              {onlineUsers.size} online
            </Text>
          </View>
        </View>
        <Text style={[styles.headerSub, { color: '#95a5a6' }]}>
          Secure campus communications
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={
            activeTab === 'chats'
              ? 'Search conversations...'
              : 'Search contacts by name or role...'
          }
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[
        styles.tabs,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}>
        {[
          {
            key: 'chats',
            label: '🗨️ Conversations',
            count: filteredConversations.length,
          },
          {
            key: 'contacts',
            label: '👥 Contacts',
            count: filteredContacts.length,
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
          >
            <Text style={[
              styles.tabText,
              { color: theme.subText },
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabCountBadge,
              activeTab === tab.key && styles.tabCountBadgeActive,
            ]}>
              <Text style={[
                styles.tabCountText,
                activeTab === tab.key && styles.tabCountTextActive,
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View style={[
          styles.searchResultsBanner,
          { backgroundColor: theme.inputBg },
        ]}>
          <Text style={[styles.searchResultsText, { color: theme.subText }]}>
            🔍 {activeTab === 'chats'
              ? filteredConversations.length
              : filteredContacts.length} result
            {(activeTab === 'chats'
              ? filteredConversations.length
              : filteredContacts.length) !== 1
              ? 's'
              : ''} for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={[styles.loadingText, { color: theme.subText }]}>
            Loading messages...
          </Text>
        </View>
      ) : activeTab === 'chats' ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#CC0000"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '💬'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No conversations yet'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.subText }]}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Go to Contacts tab to start chatting'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setActiveTab('contacts')}
                >
                  <Text style={styles.emptyActionText}>
                    👥 Browse Contacts
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderContact}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#CC0000"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery && (
              <View style={[
                styles.contactsHeaderCard,
                { backgroundColor: theme.secondary },
              ]}>
                <Text style={styles.contactsHeaderText}>
                  {user?.role === 'security'
                    ? '👮 You can message all campus users'
                    : user?.role === 'admin'
                    ? '⚙️ You can message security officers'
                    : '🛡️ Contact security for assistance'}
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '👥'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery
                  ? `No contacts matching "${searchQuery}"`
                  : 'No contacts available'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.subText }]}>
                {searchQuery
                  ? 'Try searching by name, role or email'
                  : 'No security personnel registered yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { padding: 20, paddingTop: 50, paddingBottom: 16 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#ffffff',
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  onlineDotSmall: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
  headerBadgeText: {
    color: '#2ecc71', fontSize: 12, fontWeight: '600',
  },
  headerSub: { fontSize: 12, marginTop: 2 },

  // Search Bar
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginVertical: 10,
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, elevation: 1,
    borderWidth: 1, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn: {
    padding: 4, backgroundColor: '#e0e0e0',
    borderRadius: 10, width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  clearBtnText: { fontSize: 10, color: '#666', fontWeight: 'bold' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, paddingHorizontal: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 12, gap: 6,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#CC0000' },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#CC0000' },
  tabCountBadge: {
    backgroundColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 20, alignItems: 'center',
  },
  tabCountBadgeActive: { backgroundColor: '#CC0000' },
  tabCountText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  tabCountTextActive: { color: '#fff' },

  // Search Results Banner
  searchResultsBanner: {
    paddingHorizontal: 16, paddingVertical: 8,
  },
  searchResultsText: { fontSize: 12 },

  // Loading
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  loadingText: { fontSize: 14 },

  // List
  listContent: { padding: 14, paddingBottom: 90 },

  // Conversation Card
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#2ecc71',
    borderWidth: 2, borderColor: '#fff',
  },
  convInfo: { flex: 1 },
  convTop: { marginBottom: 4 },
  convNameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 2,
  },
  convName: { fontSize: 15, fontWeight: 'bold' },
  rolePill: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  rolePillText: { fontSize: 10, fontWeight: '600' },
  convTime: { fontSize: 10 },
  convBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  convLast: { fontSize: 13, flex: 1 },
  convLastUnread: { fontWeight: '600' },
  unreadBadge: {
    backgroundColor: '#CC0000', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff', fontSize: 10, fontWeight: 'bold',
  },

  // Contact Card
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  contactMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  contactRole: { fontSize: 12, fontWeight: '700' },
  onlineLabel: {
    fontSize: 11, color: '#2ecc71', fontWeight: '600',
  },
  contactEmail: { fontSize: 12, marginTop: 2 },
  chatBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  chatBtnText: { fontSize: 22 },

  // Contacts Header
  contactsHeaderCard: {
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  contactsHeaderText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center', paddingTop: 60, paddingHorizontal: 30,
  },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  emptySub: {
    fontSize: 13, marginTop: 6,
    textAlign: 'center', lineHeight: 18,
  },
  emptyAction: {
    backgroundColor: '#CC0000', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 20,
  },
  emptyActionText: {
    color: '#fff', fontWeight: 'bold', fontSize: 14,
  },
});