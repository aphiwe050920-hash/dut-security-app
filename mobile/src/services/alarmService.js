import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

let alarmInterval = null;
let isPlaying = false;
let audioPlayer = null;

export const loadAlarm = () => {
  console.log('🔊 Alarm service ready');
};

export const playAlarm = async () => {
  if (isPlaying) return;
  isPlaying = true;

  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );

    let count = 0;
    alarmInterval = setInterval(async () => {
      count++;
      if (count >= 5) {
        clearInterval(alarmInterval);
        alarmInterval = null;
        isPlaying = false;
        return;
      }
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      } catch {}
    }, 1500);

  } catch (error) {
    console.log('Alarm error:', error.message);
    isPlaying = false;
  }
};

export const stopAlarm = async () => {
  isPlaying = false;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
};

export const unloadAlarm = async () => {
  await stopAlarm();
};