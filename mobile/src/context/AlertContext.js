import React, {
  createContext, useState, useEffect,
  useContext, useRef, useCallback,
} from 'react';
import { AppState } from 'react-native';
import { getAlertsAPI } from '../services/api';
import { onNewAlert, offNewAlert, isSocketConnected } from '../services/socketService';
import { sendEmergencyNotification } from '../services/notificationService';
import { useAuth } from './AuthContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [newAlertBanner, setNewAlertBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const appState = useRef(AppState.currentState);
  const bannerTimer = useRef(null);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      setupSocketListener();
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchAlerts(); // Refresh when app comes to foreground
      }
      appState.current = nextState;
    });

    return () => {
      offNewAlert();
      subscription.remove();
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [user]);

  const setupSocketListener = () => {
    onNewAlert(handleNewAlert);
  };

  const handleNewAlert = useCallback(async (alert) => {
    setAlerts((prev) => {
      // Strictly prevent duplicates by _id
      const exists = prev.some((a) => a._id === alert._id);
      if (exists) return prev;
      return [alert, ...prev];
    });

    setActiveAlert(alert);
    setNewAlertBanner(alert);
    await sendEmergencyNotification(alert);

    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      setNewAlertBanner(null);
    }, 6000);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getAlertsAPI({ limit: 50 });
      // Deduplicate by _id just in case
      const unique = res.data.alerts.filter(
        (alert, index, self) =>
          index === self.findIndex((a) => a._id === alert._id)
      );
      setAlerts(unique);
    } catch (error) {
      console.error('Error fetching alerts:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearActiveAlert = () => setActiveAlert(null);
  const clearBanner = () => setNewAlertBanner(null);

  return (
    <AlertContext.Provider value={{
      alerts,
      activeAlert,
      newAlertBanner,
      loading,
      fetchAlerts,
      clearActiveAlert,
      clearBanner,
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);