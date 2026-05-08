import * as Location from 'expo-location';
import { updateLocationAPI } from './api';
import { emitLocationUpdate } from './socketService';

let locationSubscription = null;

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

    // ✅ Emit location IMMEDIATELY on start
    const currentLoc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const initialCoords = {
      latitude: currentLoc.coords.latitude,
      longitude: currentLoc.coords.longitude,
    };

    // Emit immediately so security sees you right away
    emitLocationUpdate(userId, initialCoords, role);

    // Save to DB immediately
    try {
      await updateLocationAPI(initialCoords);
    } catch {}

    if (onUpdate) onUpdate(initialCoords);

    // Then continue watching
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,   // every 10 seconds
        distanceInterval: 15,  // or every 15 meters
      },
      async (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        emitLocationUpdate(userId, coords, role);
        try {
          await updateLocationAPI(coords);
        } catch {}
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