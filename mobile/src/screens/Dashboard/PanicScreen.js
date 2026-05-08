import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { triggerAlertAPI } from '../../services/api';
import { COLORS, ALERT_TYPES } from '../../utils/constants';
import { analyseTextThreats } from '../../utils/aiAnalytics';
import { getSocket } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import {
  triggerAlertAPI,
  getSecurityUsersAPI,
  sendMessageAPI,
} from '../../services/api';

export default function PanicScreen({ navigation }) {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState('panic');
  const [countdown, setCountdown] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching location...');
  const [threatAnalysis, setThreatAnalysis] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('⚠️ Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      setLocationStatus('✅ Location acquired');
    } catch (error) {
      setLocationStatus('⚠️ Could not get location');
    }
  };

  const handlePanic = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be acquired');
      return;
    }

    Alert.alert(
      '🚨 CONFIRM EMERGENCY',
      'Are you sure you want to trigger an emergency alert? Security will be notified immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'YES, SEND ALERT',
          style: 'destructive',
          onPress: sendAlert,
        },
      ]
    );
  };

  const sendAlert = async () => {
    try {
      setLoading(true);
      const res = await triggerAlertAPI({
        type: selectedType,
        message: message || `${selectedType.toUpperCase()} emergency triggered on campus`,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      const socket = getSocket();
      socket?.emit('panic_alarm', {
        userName: user?.name,
        userId: user?._id,
        type: selectedType,
        message: message || 'Emergency help needed',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        alertId: res.data.alert?._id,
      });

      // Auto-send a chat message to all security officers
      try {
        const secRes = await getSecurityUsersAPI();
        const securityUsers = secRes.data.users.filter(
          (u) => u.role === 'security'
        );

        // Message the first available security officer
        if (securityUsers.length > 0) {
          const officer = securityUsers[0];
          const conversationId = [user._id, officer._id]
            .sort().join('_');

          await sendMessageAPI({
            receiverId: officer._id,
            message: `🆘 PANIC ALERT: ${message || selectedType.toUpperCase() + ' emergency. I need help immediately!'}`,
            messageType: 'alert',
            roomType: 'user_security',
            linkedAlert: res.data.alert?._id,
          });

          socket?.emit('send_message', {
            conversationId,
            sender: { _id: user._id, name: user.name, role: user.role },
            receiver: officer,
            message: `🆘 PANIC ALERT: ${message || selectedType.toUpperCase() + ' emergency. I need help immediately!'}`,
            messageType: 'alert',
          });
        }
      } catch (chatErr) {
        console.log('Auto chat error:', chatErr.message);
      }

      Alert.alert(
        '✅ Alert Sent!',
        'Campus security has been notified and a chat has been opened. Help is on the way.',
        [{
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send alert.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location Status */}
      <View style={styles.locationBanner}>
        <Text style={styles.locationText}>{locationStatus}</Text>
        {location && (
          <Text style={styles.locationCoords}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Alert Type Selector */}
      <Text style={styles.sectionLabel}>Select Emergency Type</Text>
      <View style={styles.typeGrid}>
        {ALERT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.typeCard, selectedType === type.value && styles.typeCardActive]}
            onPress={() => setSelectedType(type.value)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={[styles.typeLabel, selectedType === type.value && styles.typeLabelActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional Message with live AI analysis */}
      <Text style={styles.sectionLabel}>Additional Details (Optional)</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="Describe what's happening..."
        placeholderTextColor={COLORS.grey}
        value={message}
        onChangeText={(text) => {
          setMessage(text);
          if (text.length > 3) {
            const analysis = analyseTextThreats(text);
            setThreatAnalysis(analysis);
          } else {
            setThreatAnalysis(null);
          }
        }}
        multiline
        numberOfLines={3}
      />

      {/* Live threat analysis feedback */}
      {threatAnalysis && message.length > 3 && (
        <View style={[styles.threatBox, {
          backgroundColor:
            threatAnalysis.level === 'critical' ? '#fff0f0' :
            threatAnalysis.level === 'high' ? '#fff8f0' :
            threatAnalysis.level === 'medium' ? '#fffdf0' : '#f0fff4',
          borderColor:
            threatAnalysis.level === 'critical' ? COLORS.danger :
            threatAnalysis.level === 'high' ? COLORS.warning :
            threatAnalysis.level === 'medium' ? '#f39c12' : COLORS.success,
        }]}>
          <Text style={styles.threatBoxTitle}>
            🤖 AI Analysis: {threatAnalysis.level.toUpperCase()} THREAT
          </Text>
          <Text style={styles.threatBoxScore}>
            Priority Score: {threatAnalysis.score}/100
          </Text>
          {threatAnalysis.keywords.length > 0 && (
            <Text style={styles.threatBoxKeywords}>
              Keywords: {threatAnalysis.keywords.map((k) => k.word).join(', ')}
            </Text>
          )}
        </View>
      )}

      {/* PANIC BUTTON */}
      <TouchableOpacity
        style={[styles.panicBtn, loading && styles.btnDisabled]}
        onPress={handlePanic}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.panicIcon}>🆘</Text>
            <Text style={styles.panicText}>SEND EMERGENCY ALERT</Text>
            <Text style={styles.panicSubtext}>Security will be notified instantly</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 30 },
  locationBanner: {
    backgroundColor: COLORS.secondary, borderRadius: 12,
    padding: 14, marginBottom: 20,
  },
  locationText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  locationCoords: { color: COLORS.grey, fontSize: 11, marginTop: 4 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeCard: {
    flexBasis: '18%', padding: 12, borderRadius: 12,
    backgroundColor: COLORS.white, alignItems: 'center',
    elevation: 2, borderWidth: 2, borderColor: 'transparent',
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: '#fff0f0' },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 10, color: COLORS.grey, marginTop: 4, textAlign: 'center' },
  typeLabelActive: { color: COLORS.primary, fontWeight: 'bold' },
  messageInput: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, fontSize: 14, color: COLORS.black,
    borderWidth: 1, borderColor: COLORS.border,
    textAlignVertical: 'top', minHeight: 80, marginBottom: 24,
  },
  panicBtn: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    padding: 30, alignItems: 'center', elevation: 10,
    shadowColor: COLORS.primary, shadowOpacity: 0.6,
    shadowRadius: 15, shadowOffset: { width: 0, height: 6 },
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  panicIcon: { fontSize: 56, marginBottom: 8 },
  panicText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  panicSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 },
  cancelBtn: { alignItems: 'center', padding: 16 },
  cancelText: { color: COLORS.grey, fontSize: 15 },
  threatBox: {
  borderRadius: 10, padding: 12,
  borderWidth: 1.5, marginBottom: 16,
  },
  threatBoxTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.darkGrey },
  threatBoxScore: { fontSize: 12, color: COLORS.grey, marginTop: 3 },
  threatBoxKeywords: { fontSize: 12, color: COLORS.grey, marginTop: 3 },
});