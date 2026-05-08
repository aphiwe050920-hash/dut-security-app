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

  const handleReply = (alert) => {
    if (!alert.triggeredBy?._id) return;
    const conversationId = [alert.triggeredBy._id, user._id]
      .sort().join('_');
    navigation.navigate('ChatRoom', {
      conversationId,
      otherUser: alert.triggeredBy,
      roomType: 'user_security',
    });
  };

  const handleViewMap = (alert) => {
    navigation.navigate('UserTracking');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
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
      <View style={[
        styles.statusBanner,
        activeAlerts.length > 0 && styles.statusBannerAlert,
      ]}>
        <Text style={styles.statusIcon}>
          {activeAlerts.length > 0 ? '🚨' : '🟢'}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>
            {activeAlerts.length > 0
              ? `${activeAlerts.length} ACTIVE EMERGENCY`
              : 'All Clear'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {activeAlerts.length > 0
              ? 'Immediate response required'
              : 'No active emergencies on campus'}
          </Text>
        </View>
        {activeAlerts.length > 0 && (
          <View style={styles.alertPulse}>
            <Text style={styles.alertPulseText}>!</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { borderTopColor: stat.color }]}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statCount, { color: stat.color }]}>
              {stat.count}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          {
            icon: '🗺️',
            label: 'Track Users',
            onPress: () => navigation.navigate('UserTracking'),
            color: COLORS.info,
          },
          {
            icon: '📋',
            label: 'Incidents',
            onPress: () => navigation.navigate('IncidentsTab'),
            color: COLORS.warning,
          },
          {
            icon: '📡',
            label: 'Broadcast',
            onPress: () => navigation.navigate('CommsTab'),
            color: COLORS.primary,
          },
          {
            icon: '💬',
            label: 'Chat',
            onPress: () => navigation.navigate('ChatTab'),
            color: COLORS.success,
          },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.quickActionCard, { borderTopColor: action.color }]}
            onPress={action.onPress}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Alerts */}
      <Text style={styles.sectionTitle}>🚨 Active Alerts</Text>
      {activeAlerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No active alerts</Text>
          <Text style={styles.emptySubText}>Campus is safe</Text>
        </View>
      ) : (
        activeAlerts.map((alert) => (
          <View key={alert._id} style={styles.alertCard}>
            {/* Alert Header */}
            <View style={styles.alertTop}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getPriorityColor(alert.priority) },
              ]}>
                <Text style={styles.badgeText}>
                  {alert.type?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertTime}>
                {formatDate(alert.createdAt)}
              </Text>
            </View>

            {/* Message */}
            <Text style={styles.alertMsg}>{alert.message}</Text>

            {/* Reporter */}
            <View style={styles.alertInfoRow}>
              <Text style={styles.alertUser}>
                👤 {alert.triggeredBy?.name || 'Unknown'}
              </Text>
              <Text style={styles.alertRole}>
                {alert.triggeredBy?.role?.toUpperCase()}
              </Text>
            </View>

            {/* Location */}
            <Text style={styles.alertCoords}>
              📍 {alert.location?.latitude?.toFixed(4)},{' '}
              {alert.location?.longitude?.toFixed(4)}
            </Text>

            {/* AI Score Row */}
            <View style={styles.aiRow}>
              <View style={styles.aiScoreContainer}>
                <Text style={styles.aiLabel}>
                  🤖 AI Score:
                </Text>
                <View style={styles.aiBarBg}>
                  <View style={[
                    styles.aiBarFill,
                    {
                      width: `${alert.aiPriorityScore || 0}%`,
                      backgroundColor: getPriorityColor(alert.priority),
                    },
                  ]} />
                </View>
                <Text style={styles.aiScore}>
                  {alert.aiPriorityScore}/100
                </Text>
              </View>
              <View style={[
                styles.priorityTag,
                { backgroundColor: getPriorityColor(alert.priority) },
              ]}>
                <Text style={styles.priorityTagText}>
                  {alert.priority?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Reply to user */}
              <TouchableOpacity
                style={styles.replyBtn}
                onPress={() => handleReply(alert)}
              >
                <Text style={styles.replyBtnText}>
                  💬 Reply to {alert.triggeredBy?.name?.split(' ')[0] || 'User'}
                </Text>
              </TouchableOpacity>

              {/* View on map */}
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => handleViewMap(alert)}
              >
                <Text style={styles.mapBtnText}>🗺️ Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Recent Resolved */}
      {resolvedToday.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>✅ Resolved Today</Text>
          {resolvedToday.slice(0, 3).map((alert) => (
            <View key={alert._id} style={styles.resolvedCard}>
              <View style={styles.resolvedLeft}>
                <Text style={styles.resolvedType}>
                  {alert.type?.toUpperCase()}
                </Text>
                <Text style={styles.resolvedMsg} numberOfLines={1}>
                  {alert.message}
                </Text>
                <Text style={styles.resolvedTime}>
                  {formatDate(alert.resolvedAt || alert.updatedAt)}
                </Text>
              </View>
              <View style={styles.resolvedBadge}>
                <Text style={styles.resolvedBadgeText}>✅</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
    backgroundColor: COLORS.secondary,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  subGreeting: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  logoutIcon: { fontSize: 24 },

  // Status Banner
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1a3a2a', margin: 16,
    borderRadius: 12, padding: 16, elevation: 2,
  },
  statusBannerAlert: { backgroundColor: '#3a1a1a' },
  statusIcon: { fontSize: 28 },
  statusTitle: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 15,
  },
  statusSubtitle: { color: COLORS.grey, fontSize: 12, marginTop: 2 },
  alertPulse: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center',
  },
  alertPulseText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 16,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 8,
  },
  statCard: {
    flex: 1, minWidth: '22%', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, alignItems: 'center',
    elevation: 2, borderTopWidth: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statCount: { fontSize: 24, fontWeight: 'bold' },
  statLabel: {
    fontSize: 10, color: COLORS.grey,
    marginTop: 2, textAlign: 'center', fontWeight: '600',
  },

  // Section Title
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold', color: COLORS.darkGrey,
    paddingHorizontal: 16, marginBottom: 10, marginTop: 8,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 8, marginBottom: 16,
  },
  quickActionCard: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: 12, padding: 12, alignItems: 'center',
    elevation: 2, borderTopWidth: 3,
  },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionLabel: {
    fontSize: 10, color: COLORS.darkGrey,
    fontWeight: '600', textAlign: 'center',
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.white, margin: 16,
    borderRadius: 12, padding: 30, alignItems: 'center',
    elevation: 2,
  },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: {
    color: COLORS.darkGrey, fontSize: 15, fontWeight: 'bold',
  },
  emptySubText: { color: COLORS.grey, fontSize: 13, marginTop: 4 },

  // Alert Card
  alertCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16,
    marginBottom: 12, borderRadius: 14, padding: 16,
    elevation: 4, borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  alertTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8, alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  alertTime: { fontSize: 11, color: COLORS.grey },
  alertMsg: {
    fontSize: 14, color: COLORS.darkGrey,
    marginBottom: 8, lineHeight: 20,
  },
  alertInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  alertUser: { fontSize: 12, color: COLORS.grey },
  alertRole: {
    fontSize: 10, color: COLORS.primary,
    fontWeight: 'bold', backgroundColor: '#fff0f0',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  alertCoords: { fontSize: 12, color: COLORS.grey, marginBottom: 10 },

  // AI Row
  aiRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  aiScoreContainer: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, flex: 1, marginRight: 8,
  },
  aiLabel: { fontSize: 11, color: COLORS.grey },
  aiBarBg: {
    flex: 1, height: 6,
    backgroundColor: COLORS.light, borderRadius: 3,
  },
  aiBarFill: { height: 6, borderRadius: 3 },
  aiScore: {
    fontSize: 11, fontWeight: 'bold',
    color: COLORS.darkGrey, width: 44,
  },
  priorityTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  priorityTagText: {
    color: COLORS.white, fontSize: 10, fontWeight: 'bold',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row', gap: 8,
  },
  replyBtn: {
    flex: 1, backgroundColor: COLORS.info,
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  replyBtnText: {
    color: COLORS.white, fontSize: 12, fontWeight: 'bold',
  },
  mapBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 10,
    padding: 10, paddingHorizontal: 14, alignItems: 'center',
  },
  mapBtnText: {
    color: COLORS.white, fontSize: 12, fontWeight: 'bold',
  },

  // Resolved Cards
  resolvedCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: COLORS.success,
  },
  resolvedLeft: { flex: 1 },
  resolvedType: {
    fontSize: 11, fontWeight: 'bold',
    color: COLORS.success, marginBottom: 3,
  },
  resolvedMsg: { fontSize: 13, color: COLORS.darkGrey },
  resolvedTime: { fontSize: 11, color: COLORS.grey, marginTop: 3 },
  resolvedBadge: { marginLeft: 12 },
  resolvedBadgeText: { fontSize: 24 },
});