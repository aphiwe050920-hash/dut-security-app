import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  ActivityIndicator, TouchableOpacity, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getUsersAPI } from '../../services/api';
import {
  onLocationUpdate, offLocationUpdate,
  requestOnlineUsers, onOnlineUsersList,
  onAllLocations, getSocket,
} from '../../services/socketService';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const DUT_COORDS = { latitude: -29.8579, longitude: 31.0292 };

export default function UserTrackingScreen() {
  const [users, setUsers] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    loadUsers();
    setupListeners();
    // Request online users and their locations immediately
    setTimeout(() => {
      requestOnlineUsers();
    }, 500);

    return () => cleanupListeners();
  }, []);

  const setupListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    // Receive list of all currently online users
    onOnlineUsersList(({ userIds }) => {
      setOnlineUserIds(new Set(userIds));
      console.log(`👥 Online users: ${userIds.length}`);
    });

    // Receive all last known locations
    onAllLocations(({ locations }) => {
      if (locations && Object.keys(locations).length > 0) {
        setLiveLocations((prev) => ({ ...prev, ...locations }));
        setMapKey((k) => k + 1); // Force map refresh
        console.log(`📍 Got ${Object.keys(locations).length} locations`);
      }
    });

    // User comes online
    socket.on('user_connected', ({ userId }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });

    // User goes offline
    socket.on('user_disconnected', ({ userId }) => {
      setOnlineUserIds((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Live location update
    onLocationUpdate(({ userId, coords, role }) => {
      setLiveLocations((prev) => ({
        ...prev,
        [userId]: {
          ...coords,
          role,
          updatedAt: new Date().toISOString(),
        },
      }));
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });
  };

  const cleanupListeners = () => {
    offLocationUpdate();
    const socket = getSocket();
    if (!socket) return;
    socket.off('user_connected');
    socket.off('user_disconnected');
    socket.off('online_users_list');
    socket.off('all_locations');
  };

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

  const handleRefresh = () => {
    requestOnlineUsers();
    setMapKey((k) => k + 1);
    loadUsers();
  };

  // Build markers from live locations
  const liveMarkers = Object.entries(liveLocations).map(([userId, data]) => {
    const user = users.find((u) => u._id === userId);
    return {
      lat: data.latitude,
      lng: data.longitude,
      role: data.role || user?.role || 'student',
      name: user?.name || 'Unknown User',
      updatedAt: data.updatedAt,
      isOnline: onlineUserIds.has(userId),
    };
  }).filter((m) => m.lat && m.lng);

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; }
        .marker {
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: 2px solid white;
          font-size: 14px; width: 36px; height: 36px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .popup-name { font-weight: bold; font-size: 13px; }
        .popup-role { font-size: 11px; color: #666; margin-top: 2px; }
        .popup-time { font-size: 10px; color: #999; margin-top: 2px; }
        .online-ring {
          border: 3px solid #2ecc71 !important;
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
          { attribution: '© OpenStreetMap' }
        ).addTo(map);

        var roleColors = {
          student: '#3498db', staff: '#2ecc71',
          security: '#e74c3c', admin: '#9b59b6',
        };
        var roleIcons = {
          student: '🎓', staff: '👔',
          security: '🛡️', admin: '⚙️',
        };

        var markers = ${JSON.stringify(liveMarkers)};

        markers.forEach(function(m) {
          var color = roleColors[m.role] || '#95a5a6';
          var icon = roleIcons[m.role] || '👤';
          var ringClass = m.isOnline ? 'marker online-ring' : 'marker';

          var divIcon = L.divIcon({
            html: '<div class="' + ringClass + '" style="background:' +
              color + ';">' + icon + '</div>',
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          var time = m.updatedAt
            ? new Date(m.updatedAt).toLocaleTimeString()
            : 'Unknown';

          L.marker([m.lat, m.lng], { icon: divIcon })
            .addTo(map)
            .bindPopup(
              '<div class="popup-name">' + m.name + '</div>' +
              '<div class="popup-role">' + m.role.toUpperCase() + '</div>' +
              '<div class="popup-time">Updated: ' + time + '</div>'
            );
        });

        // DUT campus boundary
        L.circle(
          [${DUT_COORDS.latitude}, ${DUT_COORDS.longitude}],
          {
            color: '#CC0000', fillColor: '#CC0000',
            fillOpacity: 0.04, radius: 400, dashArray: '6',
          }
        ).addTo(map)
         .bindTooltip('DUT Campus Boundary');

        // If no markers, show message
        if (markers.length === 0) {
          map.setView([${DUT_COORDS.latitude}, ${DUT_COORDS.longitude}], 16);
        } else if (markers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], 17);
        } else {
          // Fit map to show all markers
          var bounds = markers.map(function(m) { return [m.lat, m.lng]; });
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      </script>
    </body>
    </html>
  `;

  const liveCount = onlineUserIds.size;
  const locationsCount = Object.keys(liveLocations).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📍 User Tracking</Text>
          <Text style={styles.headerSubtitle}>
            {locationsCount} location{locationsCount !== 1 ? 's' : ''} tracked
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{liveCount} LIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'map', label: '🗺️ Live Map' },
          { key: 'list', label: `👥 Users (${users.length})` },
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
          {liveMarkers.length === 0 ? (
            <View style={styles.noMarkersContainer}>
              <View style={{ flex: 1 }}>
                <WebView
                  key={mapKey}
                  source={{ html: mapHTML }}
                  style={{ flex: 1 }}
                  javaScriptEnabled
                  domStorageEnabled
                />
              </View>
              <View style={styles.noMarkersOverlay}>
                <Text style={styles.noMarkersText}>
                  📍 Waiting for user locations...
                </Text>
                <Text style={styles.noMarkersSubText}>
                  Locations appear when users open the app
                </Text>
                <TouchableOpacity
                  style={styles.refreshOverlayBtn}
                  onPress={handleRefresh}
                >
                  <Text style={styles.refreshOverlayBtnText}>
                    🔄 Refresh
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <WebView
              key={mapKey}
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
          )}

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: '#3498db', icon: '🎓', label: 'Student' },
              { color: '#2ecc71', icon: '👔', label: 'Staff' },
              { color: '#e74c3c', icon: '🛡️', label: 'Security' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <Text style={styles.legendIcon}>{item.icon}</Text>
                <Text style={styles.legendText}>{item.label}</Text>
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
                {liveCount} online now • {locationsCount} locations tracked
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOnline = onlineUserIds.has(item._id);
            const hasLocation = !!liveLocations[item._id];
            const loc = liveLocations[item._id] || item.lastLocation;

            const ROLE_COLORS = {
              student: '#3498db', staff: '#2ecc71',
              security: '#e74c3c', admin: '#9b59b6',
            };

            return (
              <View style={styles.userCard}>
                <View style={styles.userLeft}>
                  <View style={[
                    styles.avatar,
                    { backgroundColor: ROLE_COLORS[item.role] || COLORS.grey },
                  ]}>
                    <Text style={styles.avatarText}>
                      {item.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {isOnline && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {isOnline && (
                      <View style={styles.onlineBadge}>
                        <Text style={styles.onlineBadgeText}>● LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userLocation}>
                    {hasLocation
                      ? `📍 Live: ${liveLocations[item._id].latitude?.toFixed(5)}, ${liveLocations[item._id].longitude?.toFixed(5)}`
                      : loc?.latitude
                      ? `📍 Last: ${loc.latitude?.toFixed(5)}, ${loc.longitude?.toFixed(5)}`
                      : '📍 No location data'}
                  </Text>
                  {loc?.updatedAt && (
                    <Text style={styles.userTime}>
                      🕐 {formatDate(loc.updatedAt)}
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

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 50,
    backgroundColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 20, fontWeight: 'bold', color: COLORS.white,
  },
  headerSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(46,204,113,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success, fontSize: 12, fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8, borderRadius: 8,
  },
  refreshBtnText: { fontSize: 18 },

  // Tabs
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

  // No markers overlay
  noMarkersContainer: { flex: 1, position: 'relative' },
  noMarkersOverlay: {
    position: 'absolute', bottom: 60, left: 16, right: 16,
    backgroundColor: 'rgba(26,26,46,0.92)',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  noMarkersText: {
    color: COLORS.white, fontSize: 14,
    fontWeight: 'bold', marginBottom: 4,
  },
  noMarkersSubText: {
    color: COLORS.grey, fontSize: 12,
    textAlign: 'center', marginBottom: 12,
  },
  refreshOverlayBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  refreshOverlayBtnText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 13,
  },

  // Legend
  legend: {
    position: 'absolute', bottom: 10, left: 12,
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10, padding: 8, elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendIcon: { fontSize: 14 },
  legendText: { fontSize: 11, color: COLORS.darkGrey, fontWeight: '600' },

  // List
  listContent: { padding: 16, paddingBottom: 80 },
  listHeader: {
    backgroundColor: COLORS.secondary, borderRadius: 10,
    padding: 12, marginBottom: 12,
  },
  listHeaderText: {
    color: COLORS.white, fontSize: 13, fontWeight: '600',
  },

  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 2,
  },
  userLeft: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2, borderColor: COLORS.white,
  },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  userName: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.darkGrey,
  },
  onlineBadge: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  onlineBadgeText: {
    color: COLORS.success, fontSize: 9, fontWeight: 'bold',
  },
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