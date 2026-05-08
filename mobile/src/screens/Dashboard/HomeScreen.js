import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, getPriorityColor } from '../../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { alerts, fetchAlerts } = useAlerts();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  // Deduplicate and take 5 most recent
  const recentAlerts = Array.from(
    new Map(alerts.map((a) => [a._id, a])).values()
  ).slice(0, 5);

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  const QUICK_ACTIONS = [
    { icon: '🗺️', label: 'Live Map',  screen: 'Map' },
    { icon: '📋', label: 'Report',    screen: 'IncidentReport' },
    { icon: '🔔', label: 'Alerts',    screen: 'Alerts' },
    { icon: '📞', label: 'Contacts',  screen: 'Contacts' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#CC0000"
        />
      }
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.role}>
            {user?.role?.toUpperCase()} • DUT Campus
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Safety Status Banner ── */}
      <View style={[
        styles.safetyBanner,
        { backgroundColor: activeCount > 0 ? '#3a1a1a' : '#1a3a2a' },
      ]}>
        <Text style={styles.safetyIcon}>
          {activeCount > 0 ? '🔴' : '🟢'}
        </Text>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[
            styles.safetyTitle,
            { color: activeCount > 0 ? '#e74c3c' : '#2ecc71' },
          ]}>
            {activeCount > 0
              ? `${activeCount} Active Emergency`
              : 'Campus Status: Safe'}
          </Text>
          <Text style={styles.safetySubtitle}>
            {activeCount > 0
              ? 'Security has been notified'
              : 'No active emergencies nearby'}
          </Text>
        </View>
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.viewAlertsBtn}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text style={styles.viewAlertsBtnText}>View</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── PANIC BUTTON ── */}
      <TouchableOpacity
        style={styles.panicBtn}
        onPress={() => navigation.navigate('Panic')}
        activeOpacity={0.85}
      >
        <Text style={styles.panicIcon}>🆘</Text>
        <Text style={styles.panicText}>EMERGENCY PANIC BUTTON</Text>
        <Text style={styles.panicSubtext}>Tap to send instant alert</Text>
      </TouchableOpacity>

      {/* ── Quick Actions ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Quick Actions
      </Text>
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={[styles.actionCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Recent Alerts ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Alerts
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {recentAlerts.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No recent alerts
          </Text>
        </View>
      ) : (
        recentAlerts.map((alert) => (
          <TouchableOpacity
            key={alert._id}
            style={[styles.alertCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(alert.priority) },
            ]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertType, { color: theme.text }]}>
                {alert.type?.toUpperCase()} ALERT
              </Text>
              <Text
                style={[styles.alertMsg, { color: theme.subText }]}
                numberOfLines={1}
              >
                {alert.message}
              </Text>
              <Text style={[styles.alertTime, { color: theme.subText }]}>
                {formatDate(alert.createdAt)}
              </Text>
            </View>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(alert.priority) },
            ]}>
              <Text style={styles.priorityText}>
                {alert.priority?.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
  },
  greeting: {
    fontSize: 22, fontWeight: 'bold', color: '#ffffff',
  },
  role: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#CC0000',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

  // Safety Banner
  safetyBanner: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, borderRadius: 12,
    padding: 16, elevation: 2,
  },
  safetyIcon: { fontSize: 28 },
  safetyTitle: { fontWeight: 'bold', fontSize: 15 },
  safetySubtitle: { color: '#95a5a6', fontSize: 12, marginTop: 2 },
  viewAlertsBtn: {
    backgroundColor: '#e74c3c', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  viewAlertsBtnText: {
    color: '#fff', fontWeight: 'bold', fontSize: 12,
  },

  // Panic Button
  panicBtn: {
    backgroundColor: '#CC0000', margin: 16,
    borderRadius: 16, padding: 28, alignItems: 'center',
    elevation: 8,
    shadowColor: '#CC0000', shadowOpacity: 0.5,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  panicIcon: { fontSize: 48, marginBottom: 8 },
  panicText: {
    color: '#ffffff', fontSize: 20,
    fontWeight: 'bold', letterSpacing: 1,
  },
  panicSubtext: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4,
  },

  // Section
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold',
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 16,
  },
  seeAll: {
    fontSize: 13, color: '#CC0000',
    fontWeight: '600', marginBottom: 10,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 20,
  },
  actionCard: {
    flex: 1, minWidth: '22%',
    borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: {
    fontSize: 11, fontWeight: '600', textAlign: 'center',
  },

  // Empty State
  emptyCard: {
    margin: 16, borderRadius: 12,
    padding: 28, alignItems: 'center', elevation: 1,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15 },

  // Alert Card
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, elevation: 2,
  },
  priorityDot: {
    width: 10, height: 10, borderRadius: 5, marginRight: 12,
  },
  alertType: { fontSize: 13, fontWeight: 'bold' },
  alertMsg: { fontSize: 12, marginTop: 2 },
  alertTime: { fontSize: 11, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  priorityText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
});