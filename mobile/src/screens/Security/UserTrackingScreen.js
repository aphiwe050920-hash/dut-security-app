import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  ActivityIndicator, TouchableOpacity, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getUsersAPI } from '../../services/api';
import {
  onLocationUpdate,
  offLocationUpdate,
} from '../../services/socketService';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const DUT_COORDS = { latitude: -29.8579, longitude: 31.0292 };

export default function UserTrackingScreen() {
  const [users, setUsers] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    loadUsers();
    onLocationUpdate(handleLocationUpdate);
    return () => offLocationUpdate();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsersAPI();
      setUsers(res.data.users);
    } catch (err) {
      console.error('User load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = ({ userId, coords, role }) => {
    setLiveLocations((prev) => ({
      ...prev,
      [userId]: { ...coords, role, updatedAt: new Date().toISOString() },
    }));
  };

  // Build markers from live locations
  const liveMarkers = Object.entries(liveLocations).map(([userId, data]) => {
    const user = users.find((u) => u._id === userId);
    return {
      lat: data.latitude,
      lng: data.longitude,
      role: data.role,
      name: user?.name || 'Unknown',
      updatedAt: data.updatedAt,
    };
  });

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
      </script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; }
        .marker {
          display: flex; align-items: center;
          justify-content: center; border-radius: 50%;
          border: 2px solid white; font-size: 14px;
          width: 34px; height: 34px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .popup-name {
          font-weight: bold; font-size: 13px;
        }
        .popup-role {
          font-size: 11px; color: #666; margin-top: 2px;
        }
        .popup-time {
          font-size: 10px; color: #999; margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView(
          [${DUT_COORDS.latitude}, ${DUT_COORDS.longitude}], 16
        );

        L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '© OpenStreetMap contributors' }
        ).addTo(map);

        var markers = ${JSON.stringify(liveMarkers)};

        var roleColors = {
          student: '#3498db',
          staff: '#2ecc71',
          security: '#e74c3c',
          admin: '#9b59b6',
        };

        var roleIcons = {
          student: '🎓',
          staff: '👔',
          security: '🛡️',
          admin: '⚙️',
        };

        markers.forEach(function(m) {
          var color = roleColors[m.role] || '#95a5a6';
          var icon = roleIcons[m.role] || '👤';

          var divIcon = L.divIcon({
            html: '<div class="marker" style="background:' +
              color + ';">' + icon + '</div>',
            className: '',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          L.marker([m.lat, m.lng], { icon: divIcon })
            .addTo(map)
            .bindPopup(
              '<div class="popup-name">' + m.name + '</div>' +
              '<div class="popup-role">' +
                m.role.toUpperCase() +
              '</div>' +
              '<div class="popup-time">Updated: ' +
                new Date(m.updatedAt).toLocaleTimeString() +
              '</div>'
            );
        });

        // DUT campus boundary circle
        L.circle(
          [${DUT_COORDS.latitude}, ${DUT_COORDS.longitude}],
          {
            color: '#CC0000', fillColor: '#CC0000',
            fillOpacity: 0.04, radius: 400,
            dashArray: '6',
          }
        ).addTo(map)
         .bindTooltip('DUT Campus Boundary');
      </script>
    </body>
    </html>
  `;

  const usersWithLocation = users.filter(
    (u) => u.lastLocation?.latitude
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading user locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 User Tracking</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {Object.keys(liveLocations).length} LIVE
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'map', label: '🗺️ Live Map' },
          { key: 'list', label: '👥 User List' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'map' ? (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ html: mapHTML }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          />

          {/* Role legend */}
          <View style={styles.legend}>
            {[
              { role: 'Student', color: '#3498db', icon: '🎓' },
              { role: 'Staff', color: '#2ecc71', icon: '👔' },
              { role: 'Security', color: '#e74c3c', icon: '🛡️' },
            ].map((item) => (
              <View key={item.role} style={styles.legendItem}>
                <Text style={styles.legendIcon}>{item.icon}</Text>
                <Text style={styles.legendText}>{item.role}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {users.length} registered users •{' '}
                {Object.keys(liveLocations).length} online now
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLive = !!liveLocations[item._id];
            const ROLE_COLORS = {
              student: '#3498db', staff: '#2ecc71',
              security: '#e74c3c', admin: '#9b59b6',
            };
            return (
              <View style={styles.userCard}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: ROLE_COLORS[item.role] || COLORS.grey },
                ]}>
                  <Text style={styles.avatarText}>
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {isLive && (
                      <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userLocation}>
                    {isLive
                      ? `📍 Live: ${liveLocations[item._id].latitude.toFixed(4)}, ${liveLocations[item._id].longitude.toFixed(4)}`
                      : item.lastLocation?.latitude
                      ? `📍 Last: ${item.lastLocation.latitude.toFixed(4)}, ${item.lastLocation.longitude.toFixed(4)}`
                      : '📍 No location data'}
                  </Text>
                  {item.lastLocation?.updatedAt && (
                    <Text style={styles.userTime}>
                      🕐 {formatDate(item.lastLocation.updatedAt)}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: ROLE_COLORS[item.role] || COLORS.grey },
                ]}>
                  <Text style={styles.roleBadgeText}>
                    {item.role?.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
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
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.grey, marginTop: 12, fontSize: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
    backgroundColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 20, fontWeight: 'bold', color: COLORS.white,
  },
  livebadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.2)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, gap: 6,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.2)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, gap: 6,
  },
  liveDot: {
    width: 8, height: 8,
    borderRadius: 4, backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success, fontSize: 12, fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.grey, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  legend: {
    position: 'absolute', bottom: 10, left: 12,
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10, padding: 8, elevation: 4,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  legendIcon: { fontSize: 14 },
  legendText: {
    fontSize: 11, color: COLORS.darkGrey, fontWeight: '600',
  },
  listContent: { padding: 16, paddingBottom: 80 },
  listHeader: {
    backgroundColor: COLORS.secondary, borderRadius: 10,
    padding: 12, marginBottom: 12,
  },
  listHeaderText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 2,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  userName: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.darkGrey,
  },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  onlineDot: {
    width: 6, height: 6,
    borderRadius: 3, backgroundColor: COLORS.success,
  },
  onlineText: { color: COLORS.success, fontSize: 9, fontWeight: 'bold' },
  userEmail: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  userLocation: { fontSize: 11, color: COLORS.grey, marginTop: 3 },
  userTime: { fontSize: 10, color: COLORS.grey, marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginLeft: 8,
  },
  roleBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.grey, fontSize: 16 },
});