import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { forgotPasswordAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      const res = await forgotPasswordAPI({ email: email.trim() });
      Alert.alert(
        '✅ OTP Sent',
        `Your OTP is: ${res.data.otp}\n\n(In production this would be sent to your email)`,
        [{
          text: 'Continue',
          onPress: () => navigation.navigate('ResetPassword', {
            userId: res.data.userId,
            otp: res.data.otp,
          }),
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
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
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.secondary }]}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a reset OTP
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Email Address
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="Enter your registered email"
            placeholderTextColor={theme.grey}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>SEND OTP</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>
              ← Back to Login
            </Text>
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
    padding: 40, paddingTop: 80,
    alignItems: 'center',
  },
  icon: { fontSize: 52, marginBottom: 12 },
  title: {
    fontSize: 26, fontWeight: 'bold',
    color: '#fff', textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: '#95a5a6',
    marginTop: 8, textAlign: 'center',
  },
  form: {
    flex: 1, margin: 20, borderRadius: 16,
    padding: 24, elevation: 4,
  },
  label: {
    fontSize: 13, fontWeight: '600',
    marginBottom: 8, marginTop: 8,
  },
  input: {
    borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, marginBottom: 8,
  },
  btn: {
    backgroundColor: '#CC0000', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff', fontWeight: 'bold',
    fontSize: 16, letterSpacing: 1,
  },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backText: { fontSize: 15, fontWeight: '600' },
});