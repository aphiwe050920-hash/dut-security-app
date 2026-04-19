import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginAPI, registerAPI, getMeAPI } from '../services/api';
import { storeToken, removeToken, storeUserData, getToken } from '../utils/helpers';
import { connectSocket, disconnectSocket } from '../services/socketService';
import { registerForPushNotifications } from '../services/notificationService';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        const res = await getMeAPI();
        const userData = res.data.user;
        setUser(userData);
        await initServices(userData);
      }
    } catch (error) {
      console.error('Load user error:', error.message);
      await removeToken();
    } finally {
      setLoading(false);
    }
  };

  const initServices = async (userData) => {
  try {
    // Connect socket
    connectSocket(userData._id, userData.role);
    // Register for local notifications only (Expo Go compatible)
    await registerForPushNotifications();
    // Start location tracking
    await startLocationTracking(userData._id, userData.role, null);
  } catch (error) {
    console.error('Init services error:', error.message);
  }
  };

  const login = async (email, password) => {
    const res = await loginAPI({ email, password });
    const { token: newToken, user: userData } = res.data;
    await storeToken(newToken);
    await storeUserData(userData);
    setToken(newToken);
    setUser(userData);
    await initServices(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await registerAPI(formData);
    const { token: newToken, user: userData } = res.data;
    await storeToken(newToken);
    await storeUserData(userData);
    setToken(newToken);
    setUser(userData);
    await initServices(userData);
    return userData;
  };

  const logout = async () => {
    stopLocationTracking();
    disconnectSocket();
    await removeToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);