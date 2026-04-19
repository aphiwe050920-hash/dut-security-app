import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import SecurityDashboard from '../screens/Security/SecurityDashboard';
import AlertManagementScreen from '../screens/Security/AlertManagementScreen';
import IncidentManagementScreen from '../screens/Security/IncidentManagementScreen';
import CommunicationScreen from '../screens/Security/CommunicationScreen';
import UserTrackingScreen from '../screens/Security/UserTrackingScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function SecurityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SecurityHome" component={SecurityDashboard} />
      <Stack.Screen name="UserTracking" component={UserTrackingScreen} />
    </Stack.Navigator>
  );
}

export default function SecurityNavigator() {
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
            DashboardTab: focused ? '🛡️' : '🔰',
            AlertsTab: focused ? '🚨' : '⚠️',
            IncidentsTab: focused ? '📋' : '📝',
            CommsTab: focused ? '📡' : '📢',
            TrackingTab: focused ? '📍' : '🗺️',
          };
          return (
            <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={SecurityStack}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertManagementScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen
        name="IncidentsTab"
        component={IncidentManagementScreen}
        options={{ title: 'Incidents' }}
      />
      <Tab.Screen
        name="CommsTab"
        component={CommunicationScreen}
        options={{ title: 'Comms' }}
      />
      <Tab.Screen
        name="TrackingTab"
        component={UserTrackingScreen}
        options={{ title: 'Tracking' }}
      />
    </Tab.Navigator>
  );
}