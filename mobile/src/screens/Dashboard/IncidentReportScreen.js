import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Image, Switch,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { createIncidentAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { INCIDENT_CATEGORIES } from '../../utils/constants';

export default function IncidentReportScreen() {
  const { theme } = useTheme();
  const [form, setForm] = useState({
    title: '', description: '',
    category: 'other', location: null,
    isAnonymous: false,
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState(
    '📍 Tap to get current location'
  );

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const getLocation = async () => {
    try {
      setLocationStatus('⏳ Getting location...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('⚠️ Permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      updateForm('location', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationStatus(
        `✅ ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
      );
    } catch {
      setLocationStatus('⚠️ Failed to get location');
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit', 'Maximum 5 images allowed');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImages((prev) => [...prev, {
          uri: asset.uri,
          base64: `data:image/jpeg;base64,${asset.base64}`,
          name: `incident_${Date.now()}.jpg`,
        }]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit', 'Maximum 5 images allowed');
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImages((prev) => [...prev, {
          uri: asset.uri,
          base64: `data:image/jpeg;base64,${asset.base64}`,
          name: `photo_${Date.now()}.jpg`,
        }]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
    if (!form.location) {
      Alert.alert('Error', 'Please get your current location');
      return;
    }
    try {
      setLoading(true);
      await createIncidentAPI({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location,
        isAnonymous: form.isAnonymous,
        images: images.map((img) => img.base64),
      });

      Alert.alert(
        '✅ Report Submitted',
        form.isAnonymous
          ? 'Your anonymous report has been submitted.'
          : 'Your incident report has been submitted.',
        [{
          text: 'OK',
          onPress: () => {
            setForm({
              title: '', description: '',
              category: 'other', location: null,
              isAnonymous: false,
            });
            setImages([]);
            setLocationStatus('📍 Tap to get current location');
          },
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <Text style={styles.headerTitle}>📋 Report Incident</Text>
        <Text style={styles.headerSub}>Help keep campus safe</Text>
      </View>

      {/* Anonymous Toggle */}
      <View style={[styles.anonymousCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.anonymousLeft}>
          <Text style={styles.anonymousIcon}>🕵️</Text>
          <View>
            <Text style={[styles.anonymousTitle, { color: theme.text }]}>
              Anonymous Report
            </Text>
            <Text style={[styles.anonymousSub, { color: theme.subText }]}>
              Your identity will not be revealed
            </Text>
          </View>
        </View>
        <Switch
          value={form.isAnonymous}
          onValueChange={(val) => updateForm('isAnonymous', val)}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={theme.white}
        />
      </View>

      {form.isAnonymous && (
        <View style={styles.anonBanner}>
          <Text style={styles.anonBannerText}>
            🕵️ This report will be submitted anonymously.
            Security will not see your name.
          </Text>
        </View>
      )}

      {/* Title */}
      <Text style={[styles.label, { color: theme.text }]}>
        Incident Title *
      </Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: theme.inputBg,
          color: theme.text,
          borderColor: theme.border,
        }]}
        placeholder="Brief title of the incident"
        placeholderTextColor={theme.grey}
        value={form.title}
        onChangeText={(v) => updateForm('title', v)}
      />

      {/* Category */}
      <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
      <View style={styles.categoryGrid}>
        {INCIDENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
              form.category === cat.value && styles.categoryBtnActive,
            ]}
            onPress={() => updateForm('category', cat.value)}
          >
            <Text style={[
              styles.categoryText,
              { color: theme.subText },
              form.category === cat.value && styles.categoryTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={[styles.label, { color: theme.text }]}>
        Description *
      </Text>
      <TextInput
        style={[styles.textArea, {
          backgroundColor: theme.inputBg,
          color: theme.text,
          borderColor: theme.border,
        }]}
        placeholder="Describe what happened in detail..."
        placeholderTextColor={theme.grey}
        value={form.description}
        onChangeText={(v) => updateForm('description', v)}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* Location */}
      <Text style={[styles.label, { color: theme.text }]}>Location *</Text>
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: theme.secondary }]}
        onPress={getLocation}
      >
        <Text style={styles.locationBtnText}>{locationStatus}</Text>
      </TouchableOpacity>

      {/* Image Proof Section */}
      <Text style={[styles.label, { color: theme.text }]}>
        📸 Photo Evidence ({images.length}/5)
      </Text>

      {/* Image Buttons */}
      <View style={styles.imageButtonRow}>
        <TouchableOpacity
          style={[styles.imageBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={takePhoto}
        >
          <Text style={styles.imageBtnIcon}>📷</Text>
          <Text style={[styles.imageBtnText, { color: theme.text }]}>
            Take Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={pickImage}
        >
          <Text style={styles.imageBtnIcon}>🖼️</Text>
          <Text style={[styles.imageBtnText, { color: theme.text }]}>
            From Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Previews */}
      {images.length > 0 && (
        <View style={styles.imagePreviewGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: img.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.imageIndexBadge}>
                <Text style={styles.imageIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>
            {form.isAnonymous
              ? '🕵️ SUBMIT ANONYMOUSLY'
              : '📋 SUBMIT REPORT'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    padding: 24, paddingTop: 50,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#fff',
  },
  headerSub: { fontSize: 13, color: '#95a5a6', marginTop: 4 },
  anonymousCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16, borderRadius: 12,
    padding: 14, borderWidth: 1.5, marginBottom: 8,
  },
  anonymousLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  anonymousIcon: { fontSize: 28 },
  anonymousTitle: { fontSize: 14, fontWeight: 'bold' },
  anonymousSub: { fontSize: 12, marginTop: 2 },
  anonBanner: {
    backgroundColor: 'rgba(52,152,219,0.1)',
    marginHorizontal: 16, borderRadius: 8,
    padding: 10, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#3498db',
  },
  anonBannerText: { color: '#3498db', fontSize: 12, lineHeight: 18 },
  label: {
    fontSize: 14, fontWeight: '600',
    paddingHorizontal: 16, marginBottom: 8, marginTop: 12,
  },
  input: {
    marginHorizontal: 16, borderRadius: 12,
    padding: 14, fontSize: 14, borderWidth: 1,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
  },
  categoryBtnActive: {
    borderColor: '#CC0000', backgroundColor: '#fff0f0',
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#CC0000' },
  textArea: {
    marginHorizontal: 16, borderRadius: 12,
    padding: 14, fontSize: 14, borderWidth: 1,
    minHeight: 120,
  },
  locationBtn: {
    marginHorizontal: 16, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  locationBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  imageButtonRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 12,
  },
  imageBtn: {
    flex: 1, borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  imageBtnIcon: { fontSize: 28, marginBottom: 6 },
  imageBtnText: { fontSize: 13, fontWeight: '600' },
  imagePreviewGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative', width: 100, height: 100,
  },
  imagePreview: {
    width: 100, height: 100, borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#e74c3c', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center',
    alignItems: 'center', elevation: 3,
  },
  removeImageText: {
    color: '#fff', fontSize: 12, fontWeight: 'bold',
  },
  imageIndexBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  imageIndexText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  submitBtn: {
    backgroundColor: '#CC0000', marginHorizontal: 16,
    borderRadius: 12, padding: 18, alignItems: 'center',
    marginTop: 24, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: '#fff', fontSize: 16,
    fontWeight: 'bold', letterSpacing: 1,
  },
});