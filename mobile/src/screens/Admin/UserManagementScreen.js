import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { getUsersAPI, deleteUserAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

const ROLE_COLORS = {
  student: COLORS.info,
  staff: COLORS.success,
  security: COLORS.warning,
  admin: COLORS.danger,
};

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsersAPI();
      setUsers(res.data.users);
    } catch {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleDelete = (user) => {
    if (user._id === currentUser._id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }
    Alert.alert('Delete User', `Remove ${user.name} from the system?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(user._id);
            await deleteUserAPI(user._id);
            await fetchUsers();
          } catch {
            Alert.alert('Error', 'Failed to delete user');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const roles = ['all', 'student', 'staff', 'security', 'admin'];
  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userLeft}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] || COLORS.grey }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userMeta}>
            {item.studentNumber || 'No ID'} • {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.userRight}>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] || COLORS.grey }]}>
          <Text style={styles.roleBadgeText}>{item.role?.toUpperCase()}</Text>
        </View>
        {item._id !== currentUser._id && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            disabled={deletingId === item._id}
          >
            {deletingId === item._id
              ? <ActivityIndicator size="small" color={COLORS.danger} />
              : <Text style={styles.deleteBtnText}>🗑️</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 User Management</Text>
        <Text style={styles.headerCount}>{filtered.length} users</Text>
      </View>

      <View style={styles.filterRow}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterBtn, filter === r && styles.filterActive]}
            onPress={() => setFilter(r)}
          >
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
    backgroundColor: COLORS.secondary,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerCount: { fontSize: 13, color: COLORS.grey },
  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: 8, paddingVertical: 10, gap: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: COLORS.light,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  userName: { fontSize: 14, fontWeight: 'bold', color: COLORS.darkGrey },
  userEmail: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  userMeta: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
  userRight: { alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 20 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
});