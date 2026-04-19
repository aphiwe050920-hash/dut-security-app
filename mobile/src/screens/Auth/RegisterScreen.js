import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    confirmPassword: '', studentNumber: '',
    phoneNumber: '', role: 'student',
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        studentNumber: form.studentNumber.trim(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
      });
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const roles = ['student', 'staff', 'security'];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the DUT Security Network</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name *', key: 'name', placeholder: 'e.g. John Dube' },
            { label: 'Email Address *', key: 'email', placeholder: 'student@dut.ac.za', keyboard: 'email-address' },
            { label: 'Student/Staff Number', key: 'studentNumber', placeholder: 'e.g. 21234567' },
            { label: 'Phone Number', key: 'phoneNumber', placeholder: 'e.g. 0812345678', keyboard: 'phone-pad' },
            { label: 'Password *', key: 'password', placeholder: 'Min 6 characters', secure: true },
            { label: 'Confirm Password *', key: 'confirmPassword', placeholder: 'Repeat password', secure: true },
          ].map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.grey}
                value={form[field.key]}
                onChangeText={(val) => updateForm(field.key, val)}
                keyboardType={field.keyboard || 'default'}
                secureTextEntry={field.secure || false}
                autoCapitalize={field.key === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}

          {/* Role Selector */}
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}
                onPress={() => updateForm('role', role)}
              >
                <Text style={[styles.roleBtnText, form.role === role && styles.roleBtnTextActive]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.grey, marginTop: 4 },
  form: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, elevation: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.light, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.black, borderWidth: 1, borderColor: COLORS.border,
  },
  roleContainer: { flexDirection: 'row', gap: 10, marginTop: 6 },
  roleBtn: {
    flex: 1, padding: 12, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
  },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: '#fff0f0' },
  roleBtnText: { color: COLORS.grey, fontWeight: '600', fontSize: 13 },
  roleBtnTextActive: { color: COLORS.primary },
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 24, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  loginLink: { textAlign: 'center', marginTop: 20, color: COLORS.grey, fontSize: 14 },
  loginLinkBold: { color: COLORS.primary, fontWeight: 'bold' },
});