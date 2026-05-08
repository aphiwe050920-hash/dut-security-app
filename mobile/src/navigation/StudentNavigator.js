import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/Dashboard/HomeScreen';
import PanicScreen from '../screens/Dashboard/PanicScreen';
import AlertsScreen from '../screens/Dashboard/AlertsScreen';
import IncidentReportScreen from '../screens/Dashboard/IncidentReportScreen';
import ContactsScreen from '../screens/Dashboard/ContactsScreen';
import ProfileScreen from '../screens/Dashboard/ProfileScreen';
import MapScreen from '../screens/Dashboard/MapScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatRoomScreen from '../screens/Chat/ChatRoomScreen';
import { COLORS } from '../utils/constants';
import { getSocket } from '../services/socketService';

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

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}

export default function StudentNavigator() {
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
            HomeTab: focused ? '🏠' : '🏡',
            AlertsTab: focused ? '🔔' : '🔕',
            ReportTab: focused ? '📋' : '📝',
            ChatTab: focused ? '💬' : '🗨️',
          };

          if (route.name === 'ChatTab' && unreadCount > 0) {
            return (
              <View>
                <Text style={{ fontSize: 22 }}>
                  {focused ? '💬' : '🗨️'}
                </Text>
                <View style={{
                  position: 'absolute', top: -4, right: -6,
                  backgroundColor: COLORS.danger,
                  borderRadius: 8, minWidth: 16,
                  height: 16, justifyContent: 'center',
                  alignItems: 'center', paddingHorizontal: 2,
                }}>
                  <Text style={{
                    color: 'white', fontSize: 9, fontWeight: 'bold',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
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
        name="HomeTab"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen
        name="ReportTab"
        component={IncidentReportScreen}
        options={{ title: 'Report' }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{ title: 'Chat' }}
        listeners={{
          tabPress: () => setUnreadCount(0),
        }}
      />
    </Tab.Navigator>
  );
}