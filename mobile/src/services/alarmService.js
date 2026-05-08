import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let alarmSound = null;
let alarmInterval = null;
let isPlaying = false;

export const loadAlarm = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/alarm.mp3'),
      { shouldPlay: false, isLooping: false, volume: 1.0 }
    );
    alarmSound = sound;
    console.log('🔊 Alarm sound loaded');
  } catch (error) {
    console.log('Alarm load error:', error.message);
  }
};

export const playAlarm = async () => {
  if (isPlaying) return;
  isPlaying = true;

  try {
    // Strong haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    if (alarmSound) {
      await alarmSound.setPositionAsync(0);
      await alarmSound.setVolumeAsync(1.0);
      await alarmSound.playAsync();

      // Repeat alarm every 3 seconds for 15 seconds
      let count = 0;
      alarmInterval = setInterval(async () => {
        count++;
        if (count >= 5) {
          clearInterval(alarmInterval);
          alarmInterval = null;
          return;
        }
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          await alarmSound.setPositionAsync(0);
          await alarmSound.playAsync();
        } catch {}
      }, 3000);
    }
  } catch (error) {
    console.log('Alarm play error:', error.message);
  }
};

export const stopAlarm = async () => {
  isPlaying = false;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  try {
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.setPositionAsync(0);
    }
  } catch {}
};

export const unloadAlarm = async () => {
  await stopAlarm();
  try {
    if (alarmSound) {
      await alarmSound.unloadAsync();
      alarmSound = null;
    }
  } catch {}
};