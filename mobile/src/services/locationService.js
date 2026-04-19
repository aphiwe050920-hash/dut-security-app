import * as Location from 'expo-location';
import { updateLocationAPI } from './api';
import { emitLocationUpdate } from './socketService';

let locationSubscription = null;
let watchInterval = null;

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async () => {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  } catch (error) {
    console.error('Location error:', error);
    return null;
  }
};

export const startLocationTracking = async (userId, role, onUpdate) => {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return false;

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,   // every 15 seconds
        distanceInterval: 20,  // or every 20 meters
      },
      async (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        // Emit via socket for real-time tracking
        emitLocationUpdate(userId, coords, role);
        // Update in database
        try {
          await updateLocationAPI(coords);
        } catch (err) {
          console.error('Location update error:', err.message);
        }
        if (onUpdate) onUpdate(coords);
      }
    );
    return true;
  } catch (error) {
    console.error('Tracking error:', error);
    return false;
  }
};

export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};