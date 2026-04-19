import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';
import { COLORS } from '../../utils/constants';

export default function SecurityDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { alerts, fetchAlerts } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const resolvedToday = alerts.filter((a) => {
    if (a.status !== 'resolved') return false;
    const today = new Date();
    const alertDate = new Date(a.resolvedAt || a.updatedAt);
    return alertDate.toDateString() === today.toDateString();
  });

  const stats = [
    { label: 'Active', count: activeAlerts.length, color: COLORS.danger, icon: '🚨' },
    { label: 'Pending', count: pendingAlerts.length, color: COLORS.warning, icon: '⏳' },
    { label: 'Resolved Today', count: resolvedToday.length, color: COLORS.success, icon: '✅' },
    { label: 'Total', count: alerts.length, color: COLORS.info, icon: '📊' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Security Dashboard</Text>
          <Text style={styles.subGreeting}>Officer: {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, activeAlerts.length > 0 && styles.statusBannerAlert]}>
        <Text style={styles.statusIcon}>{activeAlerts.length > 0 ? '🚨' : '🟢'}</Text>
        <View>
          <Text style={styles.statusTitle}>
            {activeAlerts.length > 0 ? `${activeAlerts.length} ACTIVE EMERGENCY` : 'All Clear'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {activeAlerts.length > 0 ? 'Immediate response required' : 'No active emergencies'}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { borderTopColor: stat.color }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Alerts */}
      <Text style={styles.sectionTitle}>🚨 Active Alerts</Text>
      {activeAlerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active alerts ✅</Text>
        </View>
      ) : (
        activeAlerts.map((alert) => (
          <View key={alert._id} style={styles.alertCard}>
            <View style={styles.alertTop}>
              <View style={[styles.typeBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                <Text style={styles.badgeText}>{alert.type?.toUpperCase()}</Text>
              </View>
              <Text style={styles.alertTime}>{formatDate(alert.createdAt)}</Text>
            </View>
            <Text style={styles.alertMsg}>{alert.message}</Text>
            <Text style={styles.alertUser}>👤 {alert.triggeredBy?.name || 'Unknown'}</Text>
            <Text style={styles.alertCoords}>
              📍 {alert.location?.latitude?.toFixed(4)}, {alert.location?.longitude?.toFixed(4)}
            </Text>
            <View style={styles.aiRow}>
              <Text style={styles.aiLabel}>AI Score: {alert.aiPriorityScore}/100</Text>
              <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(alert.priority) }]}>
                <Text style={styles.priorityTagText}>{alert.priority?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
    backgroundColor: COLORS.secondary,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  subGreeting: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  logoutIcon: { fontSize: 24 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1a3a2a', margin: 16,
    borderRadius: 12, padding: 16, elevation: 2,
  },
  statusBannerAlert: { backgroundColor: '#3a1a1a' },
  statusIcon: { fontSize: 28 },
  statusTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  statusSubtitle: { color: COLORS.grey, fontSize: 12, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '22%', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, alignItems: 'center',
    elevation: 2, borderTopWidth: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statCount: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: COLORS.grey, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.darkGrey, paddingHorizontal: 16, marginBottom: 10 },
  emptyCard: { backgroundColor: COLORS.white, margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.grey, fontSize: 15 },
  alertCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16,
    marginBottom: 10, borderRadius: 12, padding: 16,
    elevation: 3, borderLeftWidth: 4, borderLeftColor: COLORS.danger,
  },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  alertTime: { fontSize: 11, color: COLORS.grey },
  alertMsg: { fontSize: 14, color: COLORS.darkGrey, marginBottom: 6 },
  alertUser: { fontSize: 12, color: COLORS.grey, marginBottom: 4 },
  alertCoords: { fontSize: 12, color: COLORS.grey, marginBottom: 8 },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiLabel: { fontSize: 12, color: COLORS.grey },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityTagText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
});