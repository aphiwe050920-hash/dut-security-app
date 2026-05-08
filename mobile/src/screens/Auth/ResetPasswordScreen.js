import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { resetPasswordAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ResetPasswordScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userId, otp: autoOtp } = route.params || {};
  const [otp, setOtp] = useState(autoOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleReset = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await resetPasswordAPI({ userId, otp, newPassword });
      Alert.alert(
        '✅ Password Reset',
        'Your password has been reset successfully.',
        [{
          text: 'Login Now',
          onPress: () => navigation.navigate('Login'),
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { backgroundColor: theme.secondary }]}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your OTP and new password</Text>
        </View>

        <View style={[styles.form, { backgroundColor: theme.card }]}>
          {[
            {
              label: 'OTP Code',
              key: 'otp',
              value: otp,
              set: setOtp,
              placeholder: '6-digit OTP',
              keyboard: 'numeric',
            },
            {
              label: 'New Password',
              key: 'pass',
              value: newPassword,
              set: setNewPassword,
              placeholder: 'Min 6 characters',
              secure: !showPass,
            },
            {
              label: 'Confirm New Password',
              key: 'confirm',
              value: confirmPassword,
              set: setConfirmPassword,
              placeholder: 'Repeat new password',
              secure: !showPass,
            },
          ].map((field) => (
            <View key={field.key}>
              <Text style={[styles.label, { color: theme.text }]}>
                {field.label}
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                }]}
                placeholder={field.placeholder}
                placeholderTextColor={theme.grey}
                value={field.value}
                onChangeText={field.set}
                secureTextEntry={field.secure}
                keyboardType={field.keyboard || 'default'}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
          >
            <Text style={[styles.showPassText, { color: theme.primary }]}>
              {showPass ? '🙈 Hide passwords' : '👁️ Show passwords'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>RESET PASSWORD</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    padding: 40, paddingTop: 80, alignItems: 'center',
  },
  icon: { fontSize: 52, marginBottom: 12 },
  title: {
    fontSize: 26, fontWeight: 'bold',
    color: '#fff', textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: '#95a5a6', marginTop: 8 },
  form: {
    flex: 1, margin: 20, borderRadius: 16,
    padding: 24, elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1,
  },
  showPassText: { marginTop: 12, fontSize: 13, fontWeight: '600' },
  btn: {
    backgroundColor: '#CC0000', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff', fontWeight: 'bold',
    fontSize: 16, letterSpacing: 1,
  },
});