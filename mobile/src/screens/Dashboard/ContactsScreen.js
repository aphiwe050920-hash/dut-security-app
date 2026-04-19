import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const EMERGENCY_CONTACTS = [
  {
    id: '1', name: 'DUT Campus Security', number: '0315732000',
    description: 'Main security control room', icon: '🛡️', priority: 'primary',
  },
  {
    id: '2', name: 'DUT Emergency Line', number: '0315734444',
    description: '24/7 emergency response', icon: '🚨', priority: 'danger',
  },
  {
    id: '3', name: 'South African Police (SAPS)', number: '10111',
    description: 'National emergency police line', icon: '👮', priority: 'danger',
  },
  {
    id: '4', name: 'Ambulance / Medical', number: '10177',
    description: 'Medical emergency services', icon: '🏥', priority: 'warning',
  },
  {
    id: '5', name: 'Fire Department', number: '0313614800',
    description: 'Durban fire services', icon: '🔥', priority: 'warning',
  },
  {
    id: '6', name: 'DUT Student Counselling', number: '0315733927',
    description: 'Mental health & student support', icon: '💙', priority: 'info',
  },
  {
    id: '7', name: 'Netcare 911', number: '082911',
    description: 'Private emergency medical', icon: '🚑', priority: 'warning',
  },
  {
    id: '8', name: 'LifeLine SA', number: '0861322322',
    description: 'Crisis counselling support', icon: '🤝', priority: 'info',
  },
];

const PRIORITY_STYLES = {
  primary: { bg: '#1a1a2e', border: COLORS.primary },
  danger: { bg: '#2d0a0a', border: COLORS.danger },
  warning: { bg: '#2d1f0a', border: COLORS.warning },
  info: { bg: '#0a1f2d', border: COLORS.info },
};

export default function ContactsScreen() {
  const handleCall = (contact) => {
    Alert.alert(
      `Call ${contact.name}`,
      `Calling ${contact.number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '📞 Call Now',
          onPress: () => Linking.openURL(`tel:${contact.number}`),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📞 Emergency Contacts</Text>
        <Text style={styles.headerSubtitle}>Tap any contact to call immediately</Text>
      </View>

      {/* SOS Banner */}
      <TouchableOpacity
        style={styles.sosBanner}
        onPress={() => Linking.openURL('tel:10111')}
      >
        <Text style={styles.sosIcon}>🆘</Text>
        <View>
          <Text style={styles.sosTitle}>NATIONAL EMERGENCY: 10111</Text>
          <Text style={styles.sosSubtitle}>Tap to call SAPS immediately</Text>
        </View>
      </TouchableOpacity>

      {/* Contacts List */}
      <View style={styles.contactsList}>
        {EMERGENCY_CONTACTS.map((contact) => {
          const pStyle = PRIORITY_STYLES[contact.priority];
          return (
            <TouchableOpacity
              key={contact.id}
              style={[styles.contactCard, { backgroundColor: pStyle.bg, borderLeftColor: pStyle.border }]}
              onPress={() => handleCall(contact)}
            >
              <Text style={styles.contactIcon}>{contact.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDesc}>{contact.description}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
              </View>
              <View style={[styles.callBtn, { borderColor: pStyle.border }]}>
                <Text style={styles.callBtnText}>📞</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>
        ⚠️ In life-threatening emergencies, always call emergency services directly.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary, padding: 24,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
  sosBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.danger, margin: 16,
    borderRadius: 14, padding: 18, elevation: 6,
  },
  sosIcon: { fontSize: 36 },
  sosTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  sosSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  contactsList: { paddingHorizontal: 16, gap: 10 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 16,
    borderLeftWidth: 4, elevation: 2,
  },
  contactIcon: { fontSize: 32, marginRight: 14 },
  contactInfo: { flex: 1 },
  contactName: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  contactDesc: { color: COLORS.grey, fontSize: 12, marginTop: 2 },
  contactNumber: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  callBtnText: { fontSize: 20 },
  disclaimer: {
    textAlign: 'center', color: COLORS.grey,
    fontSize: 12, padding: 20, lineHeight: 18,
  },
});