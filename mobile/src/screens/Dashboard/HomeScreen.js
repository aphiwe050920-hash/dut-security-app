import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { COLORS, getPriorityColor } from '../../utils/constants';
import { formatDate, getPriorityColor as getPC } from '../../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { alerts, fetchAlerts, loading } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const recentAlerts = alerts.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()} • DUT Campus</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Safety Status Banner */}
      <View style={styles.safetyBanner}>
        <Text style={styles.safetyIcon}>🟢</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.safetyTitle}>Campus Status: Safe</Text>
          <Text style={styles.safetySubtitle}>No active emergencies nearby</Text>
        </View>
      </View>

      {/* PANIC BUTTON */}
      <TouchableOpacity
        style={styles.panicBtn}
        onPress={() => navigation.navigate('Panic')}
        activeOpacity={0.85}
      >
        <Text style={styles.panicIcon}>🆘</Text>
        <Text style={styles.panicText}>EMERGENCY PANIC BUTTON</Text>
        <Text style={styles.panicSubtext}>Tap to send instant alert</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          { icon: '🗺️', label: 'Live Map', screen: 'Map' },
          { icon: '📋', label: 'Report', screen: 'IncidentReport' },
          { icon: '🔔', label: 'Alerts', screen: 'Alerts' },
          { icon: '📞', label: 'Contacts', screen: 'Contacts' },
        ].map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Alerts */}
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      {recentAlerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recent alerts ✅</Text>
        </View>
      ) : (
        recentAlerts.map((alert) => (
          <TouchableOpacity
            key={alert._id}
            style={styles.alertCard}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={[styles.priorityDot, { backgroundColor: getPC(alert.priority) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertType}>{alert.type?.toUpperCase()} ALERT</Text>
              <Text style={styles.alertMsg} numberOfLines={1}>{alert.message}</Text>
              <Text style={styles.alertTime}>{formatDate(alert.createdAt)}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPC(alert.priority) }]}>
              <Text style={styles.priorityText}>{alert.priority?.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  greeting: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  role: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  safetyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a3a2a', margin: 16,
    borderRadius: 12, padding: 16, elevation: 2,
  },
  safetyIcon: { fontSize: 28 },
  safetyTitle: { color: COLORS.success, fontWeight: 'bold', fontSize: 15 },
  safetySubtitle: { color: COLORS.grey, fontSize: 12, marginTop: 2 },
  panicBtn: {
    backgroundColor: COLORS.primary, margin: 16,
    borderRadius: 16, padding: 28, alignItems: 'center',
    elevation: 8, shadowColor: COLORS.primary, shadowOpacity: 0.5,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  panicIcon: { fontSize: 48, marginBottom: 8 },
  panicText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  panicSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.darkGrey, paddingHorizontal: 16, marginBottom: 10 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 20 },
  actionCard: {
    flex: 1, minWidth: '22%', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.darkGrey, textAlign: 'center' },
  emptyCard: { backgroundColor: COLORS.white, margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.grey, fontSize: 15 },
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, marginHorizontal: 16,
    marginBottom: 8, borderRadius: 12, padding: 14, elevation: 2,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  alertType: { fontSize: 13, fontWeight: 'bold', color: COLORS.darkGrey },
  alertMsg: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  alertTime: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
});