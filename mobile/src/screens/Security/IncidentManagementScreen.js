import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { getIncidentsAPI, updateIncidentAPI } from '../../services/api';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

export default function IncidentManagementScreen() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('open');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await getIncidentsAPI({ limit: 50 });
      setIncidents(res.data.incidents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const handleUpdate = (incident, status) => {
    Alert.alert('Update Incident', `Mark as "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdatingId(incident._id);
            await updateIncidentAPI(incident._id, { status });
            await fetchIncidents();
          } catch {
            Alert.alert('Error', 'Failed to update incident');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const filters = ['all', 'open', 'under_review', 'resolved'];
  const filtered = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: getPriorityColor(item.priority) }]}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.badgeText}>{item.category?.toUpperCase().replace('_', ' ')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status?.toUpperCase().replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.cardMeta}>👤 {item.reportedBy?.name || 'Unknown'}</Text>
      <Text style={styles.cardMeta}>🕐 {formatDate(item.createdAt)}</Text>
      <Text style={styles.cardMeta}>🤖 AI Score: {item.aiPriorityScore}/100</Text>

      {item.status !== 'resolved' && item.status !== 'closed' && (
        <View style={styles.actionRow}>
          {item.status === 'open' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.info }]}
              onPress={() => handleUpdate(item, 'under_review')}
              disabled={updatingId === item._id}
            >
              <Text style={styles.actionBtnText}>🔍 Review</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={() => handleUpdate(item, 'resolved')}
            disabled={updatingId === item._id}
          >
            {updatingId === item._id
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.actionBtnText}>✅ Resolve</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Incident Reports</Text>
        <Text style={styles.headerCount}>{filtered.length} reports</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
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
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No incidents found</Text>
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
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
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
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, marginBottom: 12, elevation: 2, borderLeftWidth: 4,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.grey, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: COLORS.grey, marginBottom: 3 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
});