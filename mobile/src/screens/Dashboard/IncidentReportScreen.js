import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { createIncidentAPI } from '../../services/api';
import { COLORS, INCIDENT_CATEGORIES } from '../../utils/constants';

export default function IncidentReportScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '',
    category: 'other', location: null,
  });
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('📍 Tap to get current location');

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const getLocation = async () => {
    try {
      setLocationStatus('⏳ Getting location...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('⚠️ Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateForm('location', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationStatus(`✅ ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    } catch {
      setLocationStatus('⚠️ Failed to get location');
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
    if (!form.location) {
      Alert.alert('Error', 'Please get your current location first');
      return;
    }
    try {
      setLoading(true);
      await createIncidentAPI({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location,
      });
      Alert.alert(
        '✅ Report Submitted',
        'Your incident report has been submitted successfully.',
        [{ text: 'OK', onPress: () => {
          setForm({ title: '', description: '', category: 'other', location: null });
          setLocationStatus('📍 Tap to get current location');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Report Incident</Text>
        <Text style={styles.headerSubtitle}>Help keep campus safe</Text>
      </View>

      {/* Title */}
      <Text style={styles.label}>Incident Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief title of the incident"
        placeholderTextColor={COLORS.grey}
        value={form.title}
        onChangeText={(val) => updateForm('title', val)}
      />

      {/* Category */}
      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryGrid}>
        {INCIDENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.categoryBtn, form.category === cat.value && styles.categoryBtnActive]}
            onPress={() => updateForm('category', cat.value)}
          >
            <Text style={[styles.categoryText, form.category === cat.value && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe the incident in detail..."
        placeholderTextColor={COLORS.grey}
        value={form.description}
        onChangeText={(val) => updateForm('description', val)}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* Location */}
      <Text style={styles.label}>Location *</Text>
      <TouchableOpacity style={styles.locationBtn} onPress={getLocation}>
        <Text style={styles.locationBtnText}>{locationStatus}</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitBtnText}>SUBMIT REPORT</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    backgroundColor: COLORS.secondary, margin: -20,
    padding: 24, paddingTop: 50, marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, fontSize: 14, color: COLORS.black,
    borderWidth: 1, borderColor: COLORS.border, elevation: 1,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  categoryBtnActive: { borderColor: COLORS.primary, backgroundColor: '#fff0f0' },
  categoryText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  categoryTextActive: { color: COLORS.primary },
  textArea: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, fontSize: 14, color: COLORS.black,
    borderWidth: 1, borderColor: COLORS.border,
    minHeight: 120, elevation: 1,
  },
  locationBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  locationBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 28, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});