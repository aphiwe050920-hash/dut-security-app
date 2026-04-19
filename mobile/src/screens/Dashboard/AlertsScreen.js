import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Modal,
} from 'react-native';
import { useAlerts } from '../../context/AlertContext';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

export default function AlertsScreen() {
  const { alerts, fetchAlerts, loading } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const filters = ['all', 'active', 'pending', 'resolved'];

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter((a) => a.status === filter);

  const renderAlert = ({ item }) => (
    <TouchableOpacity style={styles.alertCard} onPress={() => setSelectedAlert(item)}>
      <View style={styles.alertHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.typeBadgeText}>{item.type?.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.alertMsg}>{item.message}</Text>
      <View style={styles.alertFooter}>
        <Text style={styles.alertMeta}>
          👤 {item.triggeredBy?.name || 'Unknown'}
        </Text>
        <Text style={styles.alertMeta}>🕐 {formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.aiRow}>
        <Text style={styles.aiLabel}>AI Priority Score:</Text>
        <View style={styles.aiBarBg}>
          <View style={[styles.aiBarFill, {
            width: `${item.aiPriorityScore || 0}%`,
            backgroundColor: getPriorityColor(item.priority),
          }]} />
        </View>
        <Text style={styles.aiScore}>{item.aiPriorityScore || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Alerts</Text>
        <Text style={styles.headerCount}>{alerts.length} total</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item._id}
        renderItem={renderAlert}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        }
      />

      {/* Alert Detail Modal */}
      <Modal visible={!!selectedAlert} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alert Details</Text>
            {selectedAlert && (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Type:</Text>
                  <Text style={styles.modalValue}>{selectedAlert.type?.toUpperCase()}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text style={[styles.modalValue, { color: getStatusColor(selectedAlert.status) }]}>
                    {selectedAlert.status?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Priority:</Text>
                  <Text style={[styles.modalValue, { color: getPriorityColor(selectedAlert.priority) }]}>
                    {selectedAlert.priority?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Message:</Text>
                  <Text style={styles.modalValue}>{selectedAlert.message}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Reported By:</Text>
                  <Text style={styles.modalValue}>{selectedAlert.triggeredBy?.name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Location:</Text>
                  <Text style={styles.modalValue}>
                    {selectedAlert.location?.latitude?.toFixed(4)},{' '}
                    {selectedAlert.location?.longitude?.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Time:</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedAlert.createdAt)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>AI Score:</Text>
                  <Text style={styles.modalValue}>{selectedAlert.aiPriorityScore}/100</Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedAlert(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
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
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  alertCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, marginBottom: 12, elevation: 2,
  },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  alertMsg: { fontSize: 14, color: COLORS.darkGrey, marginBottom: 8 },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  alertMeta: { fontSize: 12, color: COLORS.grey },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLabel: { fontSize: 11, color: COLORS.grey, width: 100 },
  aiBarBg: { flex: 1, height: 6, backgroundColor: COLORS.light, borderRadius: 3 },
  aiBarFill: { height: 6, borderRadius: 3 },
  aiScore: { fontSize: 11, fontWeight: 'bold', color: COLORS.darkGrey, width: 28 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalLabel: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  modalValue: { fontSize: 13, color: COLORS.darkGrey, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  closeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 16,
  },
  closeBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});