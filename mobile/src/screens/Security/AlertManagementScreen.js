import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useAlerts } from '../../context/AlertContext';
import { updateAlertStatusAPI } from '../../services/api';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

export default function AlertManagementScreen() {
  const { alerts, fetchAlerts } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleStatusUpdate = (alert, newStatus) => {
    Alert.alert(
      'Update Status',
      `Mark this alert as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setUpdatingId(alert._id);
              await updateAlertStatusAPI(alert._id, newStatus);
              await fetchAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to update alert status');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);
  const filters = ['all', 'active', 'pending', 'resolved'];

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: getPriorityColor(item.priority) }]}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.badgeText}>{item.type?.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardMsg}>{item.message}</Text>
      <Text style={styles.cardMeta}>👤 {item.triggeredBy?.name || 'Unknown'} • {formatDate(item.createdAt)}</Text>
      <Text style={styles.cardMeta}>
        📍 {item.location?.latitude?.toFixed(4)}, {item.location?.longitude?.toFixed(4)}
      </Text>
      <Text style={styles.cardMeta}>🤖 AI Score: {item.aiPriorityScore}/100</Text>

      {/* Action Buttons */}
      {item.status !== 'resolved' && item.status !== 'false_alarm' && (
        <View style={styles.actionRow}>
          {item.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
              onPress={() => handleStatusUpdate(item, 'pending')}
              disabled={updatingId === item._id}
            >
              {updatingId === item._id
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.actionBtnText}>⏳ Set Pending</Text>}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={() => handleStatusUpdate(item, 'resolved')}
            disabled={updatingId === item._id}
          >
            {updatingId === item._id
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.actionBtnText}>✅ Resolve</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.grey }]}
            onPress={() => handleStatusUpdate(item, 'false_alarm')}
            disabled={updatingId === item._id}
          >
            <Text style={styles.actionBtnText}>❌ False Alarm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Alert Management</Text>
        <Text style={styles.headerCount}>{filtered.length} alerts</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No alerts in this category</Text>
          </View>
        }
      />
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
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: COLORS.light,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, marginBottom: 12,
    elevation: 2, borderLeftWidth: 4,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  cardMsg: { fontSize: 14, color: COLORS.darkGrey, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: COLORS.grey, marginBottom: 3 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
});