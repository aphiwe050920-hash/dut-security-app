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
    // Add to top of list
    setAlerts((prev) => {
      const exists = prev.find((a) => a._id === alert._id);
      if (exists) return prev;
      return [alert, ...prev];
    });

    // Set active alert for banner
    setActiveAlert(alert);
    setNewAlertBanner(alert);

    // Send push notification
    await sendEmergencyNotification(alert);

    // Auto-dismiss banner after 6 seconds
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      setNewAlertBanner(null);
    }, 6000);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getAlertsAPI({ limit: 50 });
      setAlerts(res.data.alerts);
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