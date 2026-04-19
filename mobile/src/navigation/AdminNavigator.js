import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import AIMonitorScreen from '../screens/Admin/AIMonitorScreen';
import SystemLogsScreen from '../screens/Admin/SystemLogsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
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
            AdminHome: focused ? '⚙️' : '🔧',
            ManageUsers: focused ? '👥' : '👤',
            AIMonitor: focused ? '🤖' : '🧠',
            SystemLogs: focused ? '📜' : '📋',
          };
          return <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminDashboard} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ManageUsers" component={UserManagementScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="AIMonitor" component={AIMonitorScreen} options={{ title: 'AI Monitor' }} />
      <Tab.Screen name="SystemLogs" component={SystemLogsScreen} options={{ title: 'Logs' }} />
    </Tab.Navigator>
  );
}