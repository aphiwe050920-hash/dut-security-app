import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useAlerts } from '../../context/AlertContext';
import { getIncidentsAPI } from '../../services/api';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

export default function SystemLogsScreen() {
  const { alerts, fetchAlerts } = useAlerts();
  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => { loadIncidents(); }, []);

  const loadIncidents = async () => {
    try {
      const res = await getIncidentsAPI({ limit: 50 });
      setIncidents(res.data.incidents);
    } catch (err) {
      console.error('Log load error:', err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAlerts(), loadIncidents()]);
    setRefreshing(false);
  };

  const renderAlertLog = ({ item }) => (
    <View style={styles.logRow}>
      <View style={[styles.logDot, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.logContent}>
        <Text style={styles.logTitle}>
          [{item.type?.toUpperCase()}] {item.message?.slice(0, 50)}
        </Text>
        <Text style={styles.logMeta}>
          👤 {item.triggeredBy?.name || 'Unknown'} •{' '}
          <Text style={{ color: getStatusColor(item.status) }}>{item.status}</Text>
        </Text>
        <Text style={styles.logTime}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={[styles.logBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
        <Text style={styles.logBadgeText}>{item.priority?.slice(0, 4).toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderIncidentLog = ({ item }) => (
    <View style={styles.logRow}>
      <View style={[styles.logDot, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.logContent}>
        <Text style={styles.logTitle}>{item.title?.slice(0, 50)}</Text>
        <Text style={styles.logMeta}>
          👤 {item.reportedBy?.name || 'Unknown'} •{' '}
          <Text style={{ color: getStatusColor(item.status) }}>{item.status}</Text>
        </Text>
        <Text style={styles.logMeta}>
          📂 {item.category?.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.logTime}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={[styles.logBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
        <Text style={styles.logBadgeText}>{item.priority?.slice(0, 4).toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📜 System Logs</Text>
        <Text style={styles.headerSub}>
          {activeTab === 'alerts' ? alerts.length : incidents.length} records
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'alerts', label: '🚨 Alert Logs', count: alerts.length },
          { key: 'incidents', label: '📋 Incident Logs', count: incidents.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeTab === 'alerts' ? alerts : incidents}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === 'alerts' ? renderAlertLog : renderIncidentLog}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary, padding: 24, paddingTop: 50,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.grey },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 14, gap: 8,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: COLORS.light, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10,
  },
  tabBadgeActive: { backgroundColor: COLORS.primary },
  tabBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  logRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  logDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  logContent: { flex: 1 },
  logTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 3 },
  logMeta: { fontSize: 12, color: COLORS.grey, marginBottom: 2 },
  logTime: { fontSize: 11, color: COLORS.grey, marginTop: 3 },
  logBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  logBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
});