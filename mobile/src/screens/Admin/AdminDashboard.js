import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { getIncidentsAPI, getUsersAPI } from '../../services/api';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { alerts, fetchAlerts } = useAlerts();
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [incRes, userRes] = await Promise.all([getIncidentsAPI(), getUsersAPI()]);
      setIncidents(incRes.data.incidents);
      setUsers(userRes.data.users);
    } catch (error) {
      console.error('Admin load error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAlerts(), loadData()]);
    setRefreshing(false);
  };

  const stats = [
    { label: 'Total Users', count: users.length, icon: '👥', color: COLORS.info },
    { label: 'Total Alerts', count: alerts.length, icon: '🚨', color: COLORS.danger },
    { label: 'Total Incidents', count: incidents.length, icon: '📋', color: COLORS.warning },
    { label: 'Active Alerts', count: alerts.filter((a) => a.status === 'active').length, icon: '🔴', color: COLORS.primary },
    { label: 'Open Incidents', count: incidents.filter((i) => i.status === 'open').length, icon: '📂', color: COLORS.accent },
    { label: 'Resolved', count: alerts.filter((a) => a.status === 'resolved').length, icon: '✅', color: COLORS.success },
  ];

  const roleBreakdown = ['student', 'staff', 'security', 'admin'].map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚙️ Admin Dashboard</Text>
          <Text style={styles.headerSub}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>System Overview</Text>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { borderTopColor: stat.color }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* User Roles Breakdown */}
      <Text style={styles.sectionTitle}>Users by Role</Text>
      <View style={styles.rolesCard}>
        {roleBreakdown.map((item) => (
          <View key={item.role} style={styles.roleRow}>
            <Text style={styles.roleLabel}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}</Text>
            <View style={styles.roleBarBg}>
              <View style={[styles.roleBarFill, {
                width: users.length > 0 ? `${(item.count / users.length) * 100}%` : '0%',
                backgroundColor: COLORS.primary,
              }]} />
            </View>
            <Text style={styles.roleCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      <View style={styles.activityCard}>
        {alerts.slice(0, 5).map((alert) => (
          <View key={alert._id} style={styles.activityRow}>
            <Text style={styles.activityIcon}>
              {alert.type === 'panic' ? '🆘' : alert.type === 'fire' ? '🔥' : '⚠️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{alert.type?.toUpperCase()} — {alert.priority?.toUpperCase()}</Text>
              <Text style={styles.activityTime}>{formatDate(alert.createdAt)}</Text>
            </View>
            <Text style={styles.activityStatus}>{alert.status}</Text>
          </View>
        ))}
        {alerts.length === 0 && <Text style={styles.emptyText}>No alerts yet</Text>}
      </View>

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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  logoutIcon: { fontSize: 24 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.darkGrey, padding: 16, paddingBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: {
    flexBasis: '30%', flex: 1, backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, alignItems: 'center',
    elevation: 2, borderTopWidth: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statCount: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: COLORS.grey, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  rolesCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14, padding: 16, elevation: 2 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  roleLabel: { fontSize: 13, color: COLORS.darkGrey, fontWeight: '600', width: 70 },
  roleBarBg: { flex: 1, height: 8, backgroundColor: COLORS.light, borderRadius: 4 },
  roleBarFill: { height: 8, borderRadius: 4 },
  roleCount: { fontSize: 13, fontWeight: 'bold', color: COLORS.darkGrey, width: 24, textAlign: 'right' },
  activityCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14, padding: 16, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activityIcon: { fontSize: 24 },
  activityTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.darkGrey },
  activityTime: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
  activityStatus: { fontSize: 11, color: COLORS.grey, fontWeight: '600' },
  emptyText: { color: COLORS.grey, textAlign: 'center', padding: 16 },
});