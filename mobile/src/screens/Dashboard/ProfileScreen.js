import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateProfileAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ROLE_COLORS = {
  student: '#3498db',
  staff:   '#2ecc71',
  security:'#e67e22',
  admin:   '#e74c3c',
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:         user?.name || '',
    phoneNumber:  user?.phoneNumber || '',
    pushEnabled:  user?.notificationPreferences?.pushEnabled  ?? true,
    alertsEnabled:user?.notificationPreferences?.alertsEnabled ?? true,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfileAPI({
        name: form.name,
        phoneNumber: form.phoneNumber,
        notificationPreferences: {
          pushEnabled:   form.pushEnabled,
          alertsEnabled: form.alertsEnabled,
        },
      });
      Alert.alert('✅ Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={[
          styles.roleBadge,
          { backgroundColor: ROLE_COLORS[user?.role] || '#95a5a6' },
        ]}>
          <Text style={styles.roleText}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* ── Personal Information ── */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Personal Information
          </Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>
              {editing ? 'Cancel' : '✏️ Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Editable fields */}
        {[
          { label: 'Full Name',     key: 'name',        value: form.name },
          { label: 'Phone Number',  key: 'phoneNumber', value: form.phoneNumber, placeholder: 'Add phone number' },
        ].map((field) => (
          <View
            key={field.key}
            style={[styles.fieldRow, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>
              {field.label}
            </Text>
            {editing ? (
              <TextInput
                style={[styles.fieldInput, {
                  color: theme.text,
                  borderBottomColor: theme.primary,
                }]}
                value={field.value}
                onChangeText={(val) =>
                  setForm((prev) => ({ ...prev, [field.key]: val }))
                }
                placeholder={field.placeholder || field.label}
                placeholderTextColor={theme.subText}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.text }]}>
                {field.value || 'Not set'}
              </Text>
            )}
          </View>
        ))}

        {/* Read-only fields */}
        {[
          { label: 'Email',            value: user?.email },
          { label: 'Student/Staff No.', value: user?.studentNumber || 'Not set' },
          { label: 'Role',             value: user?.role?.toUpperCase() },
          {
            label: 'Member Since',
            value: user?.createdAt
              ? new Date(user.createdAt).getFullYear().toString()
              : '-',
          },
        ].map((field) => (
          <View
            key={field.label}
            style={[styles.fieldRow, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>
              {field.label}
            </Text>
            <Text style={[styles.fieldValue, { color: theme.text }]}>
              {field.value}
            </Text>
          </View>
        ))}

        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Appearance ── */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          🎨 Appearance
        </Text>

        <View style={[styles.prefRow, { borderBottomColor: theme.border }]}>
          <View style={styles.prefLeft}>
            <Text style={styles.prefIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={[styles.prefLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.prefDesc, { color: theme.subText }]}>
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: '#CC0000' }}
            thumbColor={isDark ? '#fff' : '#f4f4f4'}
          />
        </View>
      </View>

      {/* ── Notification Preferences ── */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          🔔 Notification Preferences
        </Text>

        {[
          {
            key:   'pushEnabled',
            label: 'Push Notifications',
            desc:  'Receive push notifications',
            icon:  '📲',
          },
          {
            key:   'alertsEnabled',
            label: 'Alert Notifications',
            desc:  'Get notified of nearby alerts',
            icon:  '🚨',
          },
        ].map((pref, index, arr) => (
          <View
            key={pref.key}
            style={[
              styles.prefRow,
              {
                borderBottomColor: theme.border,
                borderBottomWidth: index < arr.length - 1 ? 1 : 0,
              },
            ]}
          >
            <View style={styles.prefLeft}>
              <Text style={styles.prefIcon}>{pref.icon}</Text>
              <View>
                <Text style={[styles.prefLabel, { color: theme.text }]}>
                  {pref.label}
                </Text>
                <Text style={[styles.prefDesc, { color: theme.subText }]}>
                  {pref.desc}
                </Text>
              </View>
            </View>
            <Switch
              value={form[pref.key]}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, [pref.key]: val }))
              }
              trackColor={{ false: theme.border, true: '#CC0000' }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      {/* ── Account Actions ── */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          ⚙️ Account
        </Text>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomColor: theme.border }]}
          onPress={() => {
            Alert.alert(
              '🔐 Change Password',
              'To change your password, logout and use "Forgot Password" on the login screen.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.actionIcon}>🔐</Text>
          <Text style={[styles.actionLabel, { color: theme.text }]}>
            Change Password
          </Text>
          <Text style={[styles.actionArrow, { color: theme.subText }]}>
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionLabel, { color: '#e74c3c' }]}>
            Logout
          </Text>
          <Text style={[styles.actionArrow, { color: theme.subText }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: '#CC0000',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  roleBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginTop: 8,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  userEmail: { color: '#95a5a6', fontSize: 13, marginTop: 6 },

  // Section
  section: {
    margin: 16, marginBottom: 0,
    borderRadius: 16, padding: 18, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  editBtn: { color: '#CC0000', fontWeight: '600', fontSize: 14 },

  // Field Row
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 13,
    borderBottomWidth: 1,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldValue: {
    fontSize: 13, fontWeight: '600',
    maxWidth: '55%', textAlign: 'right',
  },
  fieldInput: {
    fontSize: 13, textAlign: 'right',
    borderBottomWidth: 1.5,
    minWidth: 140, paddingVertical: 2,
  },

  // Save Button
  saveBtn: {
    backgroundColor: '#CC0000', borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },

  // Preference Row
  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1,
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefIcon: { fontSize: 22 },
  prefLabel: { fontSize: 14, fontWeight: '600' },
  prefDesc: { fontSize: 12, marginTop: 2 },

  // Account Action Row
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, gap: 12,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  actionArrow: { fontSize: 22, fontWeight: '300' },
});