import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import SecurityNavigator from './SecurityNavigator';
import AdminNavigator from './AdminNavigator';
import { COLORS } from '../utils/constants';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getNavigator = () => {
    if (!user) return <AuthNavigator />;
    if (user.role === 'admin') return <AdminNavigator />;
    if (user.role === 'security') return <SecurityNavigator />;
    return <StudentNavigator />;
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
}