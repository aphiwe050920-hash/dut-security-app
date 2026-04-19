import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { Linking } from 'react-native';

const DEFAULT_CONTACTS = [
  { id: '1', name: 'Control Room', number: '0315732000', icon: '🎛️' },
  { id: '2', name: 'Gate 1 Security', number: '0315732001', icon: '🚪' },
  { id: '3', name: 'Gate 2 Security', number: '0315732002', icon: '🚪' },
  { id: '4', name: 'Campus Medical', number: '0315733927', icon: '🏥' },
  { id: '5', name: 'Fire Warden', number: '0315732010', icon: '🔥' },
  { id: '6', name: 'SAPS Berea', number: '0313097700', icon: '👮' },
];

export default function SecurityContactsScreen() {
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [adding, setAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', number: '' });

  const handleCall = (contact) => {
    Alert.alert(`Call ${contact.name}`, contact.number, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '📞 Call',
        onPress: () => Linking.openURL(`tel:${contact.number}`),
      },
    ]);
  };

  const handleAdd = () => {
    if (!newContact.name || !newContact.number) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }
    setContacts((prev) => [
      ...prev,
      { ...newContact, id: Date.now().toString(), icon: '📞' },
    ]);
    setNewContact({ name: '', number: '' });
    setAdding(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setContacts((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📞 Security Contacts</Text>
        <Text style={styles.headerSub}>Manage internal contact directory</Text>
      </View>

      {/* Add Contact Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setAdding(!adding)}
      >
        <Text style={styles.addBtnText}>
          {adding ? '✕ Cancel' : '+ Add Contact'}
        </Text>
      </TouchableOpacity>

      {/* Add Contact Form */}
      {adding && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            placeholderTextColor={COLORS.grey}
            value={newContact.name}
            onChangeText={(v) => setNewContact((p) => ({ ...p, name: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={COLORS.grey}
            value={newContact.number}
            onChangeText={(v) => setNewContact((p) => ({ ...p, number: v }))}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contacts List */}
      <View style={styles.list}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <Text style={styles.contactIcon}>{contact.icon}</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.number}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCall(contact)}
            >
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(contact.id)}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary,
    padding: 24, paddingTop: 50,
  },
  headerTitle: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.white,
  },
  headerSub: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
  addBtn: {
    backgroundColor: COLORS.primary, margin: 16,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  addForm: {
    backgroundColor: COLORS.white, marginHorizontal: 16,
    borderRadius: 12, padding: 16, elevation: 2, marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.light, borderRadius: 10,
    padding: 12, fontSize: 14, color: COLORS.black,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.success, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, gap: 8 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, elevation: 2,
  },
  contactIcon: { fontSize: 28, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.darkGrey,
  },
  contactNumber: {
    fontSize: 13, color: COLORS.primary,
    fontWeight: '600', marginTop: 2,
  },
  callBtn: { padding: 8, marginRight: 4 },
  callBtnText: { fontSize: 22 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
});