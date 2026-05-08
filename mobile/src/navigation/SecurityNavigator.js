import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import SecurityDashboard from '../screens/Security/SecurityDashboard';
import AlertManagementScreen from '../screens/Security/AlertManagementScreen';
import IncidentManagementScreen from '../screens/Security/IncidentManagementScreen';
import CommunicationScreen from '../screens/Security/CommunicationScreen';
import UserTrackingScreen from '../screens/Security/UserTrackingScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatRoomScreen from '../screens/Chat/ChatRoomScreen';
import { COLORS } from '../utils/constants';
import { getSocket } from '../services/socketService';

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

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}

export default function SecurityNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('receive_message', () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket?.off('receive_message');
  }, []);

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
            AlertsTab:    focused ? '🚨' : '⚠️',
            IncidentsTab: focused ? '📋' : '📝',
            CommsTab:     focused ? '📡' : '📢',
            TrackingTab:  focused ? '📍' : '🗺️',
          };

          // Chat tab with unread badge
          if (route.name === 'ChatTab') {
            return (
              <View>
                <Text style={{ fontSize: 22 }}>
                  {focused ? '💬' : '🗨️'}
                </Text>
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -4, right: -6,
                    backgroundColor: COLORS.danger,
                    borderRadius: 8, minWidth: 16, height: 16,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 2,
                  }}>
                    <Text style={{
                      color: 'white', fontSize: 9, fontWeight: 'bold',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          }

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
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{ title: 'Chat' }}
        listeners={{ tabPress: () => setUnreadCount(0) }}
      />
    </Tab.Navigator>
  );
}