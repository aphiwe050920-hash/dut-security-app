import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from '../screens/Dashboard/HomeScreen';
import PanicScreen from '../screens/Dashboard/PanicScreen';
import AlertsScreen from '../screens/Dashboard/AlertsScreen';
import IncidentReportScreen from '../screens/Dashboard/IncidentReportScreen';
import ContactsScreen from '../screens/Dashboard/ContactsScreen';
import ProfileScreen from '../screens/Dashboard/ProfileScreen';
import MapScreen from '../screens/Dashboard/MapScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Panic" component={PanicScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
    </Stack.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 6,
          height: 62,
        },
        tabBarIcon: ({ focused }) => {
          const icons = {
            HomeTab: focused ? '🏠' : '🏡',
            AlertsTab: focused ? '🔔' : '🔕',
            ReportTab: focused ? '📋' : '📝',
          };
          return <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="AlertsTab" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="ReportTab" component={IncidentReportScreen} options={{ title: 'Report' }} />
    </Tab.Navigator>
  );
}