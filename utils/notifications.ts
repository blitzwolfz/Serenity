import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSettings } from './storage';

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'web') {
    // Web doesn't support notifications in the same way
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for notification!');
    return;
  }

  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Check if notifications are enabled and schedule if needed
  const settings = await getSettings();
  if (settings.notificationsEnabled) {
    scheduleDailyNotification(settings.notificationTime);
  }
};

export const scheduleDailyNotification = async (time: string) => {
  if (Platform.OS === 'web') {
    // Web doesn't support notifications in the same way
    return;
  }

  // Cancel any existing notifications first
  await cancelNotifications();

  const [hours, minutes] = time.split(':').map(Number);

  // Schedule new daily notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to log your mood!',
      body: 'How are you feeling today? Take a moment to record your mood.',
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
};

export const cancelNotifications = async () => {
  if (Platform.OS === 'web') {
    // Web doesn't support notifications in the same way
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
};