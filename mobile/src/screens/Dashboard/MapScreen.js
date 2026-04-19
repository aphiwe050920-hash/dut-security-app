import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAlerts } from '../../context/AlertContext';
import { COLORS } from '../../utils/constants';
import { getPriorityColor } from '../../utils/helpers';

export default function MapScreen() {
  const { alerts } = useAlerts();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // DUT Durban coordinates
  const DUT_COORDS = { latitude: -29.8579, longitude: 31.0292 };

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(DUT_COORDS);
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      setLocation(DUT_COORDS);
    } finally {
      setLoading(false);
    }
  };

  const activeAlerts = alerts.filter(
    (a) => a.status === 'active' && a.location?.latitude
  );

  // Build alert markers JSON for injection into map
  const alertMarkersJS = activeAlerts.map((alert) => ({
    lat: alert.location.latitude,
    lng: alert.location.longitude,
    type: alert.type,
    priority: alert.priority,
    message: alert.message,
    user: alert.triggeredBy?.name || 'Unknown',
    color: getPriorityColor(alert.priority),
  }));

  const userLat = location?.latitude || DUT_COORDS.latitude;
  const userLng = location?.longitude || DUT_COORDS.longitude;

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; }
        .custom-marker {
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: 2px solid white;
          font-size: 16px; width: 36px; height: 36px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .popup-title { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
        .popup-msg { font-size: 12px; color: #555; margin-bottom: 2px; }
        .popup-user { font-size: 11px; color: #888; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${userLat}, ${userLng}], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // User location marker
        var userIcon = L.divIcon({
          html: '<div class="custom-marker" style="background:#3498db;">📍</div>',
          className: '', iconSize: [36, 36], iconAnchor: [18, 18]
        });
        L.marker([${userLat}, ${userLng}], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Your Location</b>');

        // User location circle
        L.circle([${userLat}, ${userLng}], {
          color: '#3498db', fillColor: '#3498db',
          fillOpacity: 0.1, radius: 80
        }).addTo(map);

        // Alert markers
        var alertsData = ${JSON.stringify(alertMarkersJS)};

        var alertIcons = {
          panic: '🆘', fire: '🔥', medical: '🏥',
          suspicious: '👁️', general: '⚠️'
        };

        alertsData.forEach(function(alert) {
          var icon = L.divIcon({
            html: '<div class="custom-marker" style="background:' + alert.color + ';">'
              + (alertIcons[alert.type] || '⚠️') + '</div>',
            className: '', iconSize: [36, 36], iconAnchor: [18, 18]
          });

          L.marker([alert.lat, alert.lng], { icon: icon })
            .addTo(map)
            .bindPopup(
              '<div class="popup-title">' + alert.type.toUpperCase() + ' ALERT</div>' +
              '<div class="popup-msg">' + alert.message + '</div>' +
              '<div class="popup-user">👤 ' + alert.user + '</div>'
            );
        });
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Live Campus Map</Text>
        <View style={styles.alertCountBadge}>
          <Text style={styles.alertCountText}>{activeAlerts.length} active</Text>
        </View>
      </View>

      {/* OpenStreetMap via WebView */}
      <WebView
        source={{ html: mapHTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      />

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: '#e74c3c', label: 'Critical' },
          { color: '#e67e22', label: 'High' },
          { color: '#f39c12', label: 'Medium' },
          { color: '#2ecc71', label: 'Low' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  alertCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  alertCountText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  map: { flex: 1 },
  legend: {
    position: 'absolute', bottom: 16, left: 16,
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10, padding: 8, gap: 10, elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.darkGrey, fontWeight: '600' },
});