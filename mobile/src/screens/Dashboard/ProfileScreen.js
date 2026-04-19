import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateProfileAPI } from '../../services/api';
import { COLORS } from '../../utils/constants';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    pushEnabled: user?.notificationPreferences?.pushEnabled ?? true,
    alertsEnabled: user?.notificationPreferences?.alertsEnabled ?? true,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfileAPI({
        name: form.name,
        phoneNumber: form.phoneNumber,
        notificationPreferences: {
          pushEnabled: form.pushEnabled,
          alertsEnabled: form.alertsEnabled,
        },
      });
      Alert.alert('✅ Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const ROLE_COLORS = {
    student: COLORS.info,
    staff: COLORS.success,
    security: COLORS.warning,
    admin: COLORS.danger,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[user?.role] || COLORS.grey }]}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? 'Cancel' : '✏️ Edit'}</Text>
          </TouchableOpacity>
        </View>

        {[
          { label: 'Full Name', key: 'name', value: form.name },
          { label: 'Phone Number', key: 'phoneNumber', value: form.phoneNumber, placeholder: 'Add phone number' },
        ].map((field) => (
          <View key={field.key} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={field.value}
                onChangeText={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
                placeholder={field.placeholder || field.label}
                placeholderTextColor={COLORS.grey}
              />
            ) : (
              <Text style={styles.fieldValue}>{field.value || 'Not set'}</Text>
            )}
          </View>
        ))}

        {/* Read-only fields */}
        {[
          { label: 'Email', value: user?.email },
          { label: 'Student/Staff No.', value: user?.studentNumber || 'Not set' },
          { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '-' },
        ].map((field) => (
          <View key={field.label} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}

        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        {[
          { label: 'Push Notifications', key: 'pushEnabled', desc: 'Receive push notifications' },
          { label: 'Alert Notifications', key: 'alertsEnabled', desc: 'Get notified of nearby alerts' },
        ].map((pref) => (
          <View key={pref.key} style={styles.prefRow}>
            <View>
              <Text style={styles.prefLabel}>{pref.label}</Text>
              <Text style={styles.prefDesc}>{pref.desc}</Text>
            </View>
            <Switch
              value={form[pref.key]}
              onValueChange={(val) => setForm((prev) => ({ ...prev, [pref.key]: val }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary, alignItems: 'center',
    paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginBottom: 12, elevation: 6,
  },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  roleText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  userEmail: { color: COLORS.grey, fontSize: 13, marginTop: 6 },
  section: {
    backgroundColor: COLORS.white, margin: 16,
    borderRadius: 14, padding: 18, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkGrey },
  editBtn: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  fieldLabel: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  fieldValue: { fontSize: 13, color: COLORS.darkGrey, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  fieldInput: {
    fontSize: 13, color: COLORS.black, textAlign: 'right',
    borderBottomWidth: 1, borderBottomColor: COLORS.primary,
    minWidth: 140, paddingVertical: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold', letterSpacing: 1 },
  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  prefLabel: { fontSize: 14, color: COLORS.darkGrey, fontWeight: '600' },
  prefDesc: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#fff0f0', marginHorizontal: 16,
    borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger,
  },
  logoutText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15 },
});