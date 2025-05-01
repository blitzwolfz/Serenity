import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useMoodContext } from '@/context/AppContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Moon,
  Sun,
  Bell,
  Download,
  Trash2,
  ChevronRight,
  Info
} from 'lucide-react-native';

// Keys for storage
const NOTIFICATION_TIME_KEY = 'moodtrack_notification_time';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const { exportData, clearAllData, notificationsEnabled, toggleNotifications } = useMoodContext();

  const [notificationTime, setNotificationTime] = useState('20:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load saved time from AsyncStorage
  useEffect(() => {
    const loadNotificationTime = async () => {
      const savedTime = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
      if (savedTime) {
        setNotificationTime(savedTime);
      }
    };
    loadNotificationTime();
  }, []);

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const scheduleNotification = async (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    const firstTrigger = new Date(now);
    firstTrigger.setHours(hour);
    firstTrigger.setMinutes(minute);
    firstTrigger.setSeconds(0);

    if (firstTrigger <= now) {
      firstTrigger.setDate(firstTrigger.getDate() + 1);
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "How are you feeling today?",
        body: "Take a moment to log your mood in MoodTrack",
      },
      trigger: {
        hour: firstTrigger.getHours(),
        minute: firstTrigger.getMinutes(),
        repeats: true,
      },
    });
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        if (Platform.OS !== 'web') {
          Alert.alert('Permission Required', 'Notifications permission is required to enable reminders.', [{ text: 'OK' }]);
        }
        return;
      }
      await scheduleNotification(notificationTime);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    toggleNotifications(value);
  };

  const handleExportData = async () => {
    try {
      await exportData();
      if (Platform.OS !== 'web') {
        Alert.alert('Export Successful', 'Your mood data has been exported successfully.', [{ text: 'OK' }]);
      }
    } catch (error) {
      if (Platform.OS !== 'web') {
        Alert.alert('Export Failed', 'There was an error exporting your mood data.', [{ text: 'OK' }]);
      }
    }
  };

  const handleClearData = () => {
    const confirmClear = () => {
      clearAllData();
      if (Platform.OS !== 'web') {
        Alert.alert('Data Cleared', 'All your mood data has been deleted.', [{ text: 'OK' }]);
      }
    };

    if (Platform.OS !== 'web') {
      Alert.alert('Clear All Data', 'Are you sure you want to delete all your mood data? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: confirmClear, style: 'destructive' }
      ]);
    } else {
      if (confirm('Are you sure you want to delete all your mood data? This action cannot be undone.')) {
        confirmClear();
      }
    }
  };

  const handleTimePicked = async (event: any, date: Date | undefined) => {
    setShowTimePicker(false);
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      setNotificationTime(formattedTime);
      await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, formattedTime);

      if (notificationsEnabled) {
        await scheduleNotification(formattedTime);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <View style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.settingInfo}>
              {theme === 'dark' ? <Moon size={22} color={colors.text} /> : <Sun size={22} color={colors.text} />}
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primaryLight }}
              thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Notifications</Text>

          <View style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.settingInfo}>
              <Bell size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Reminder</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>

          {Platform.OS !== 'web' && notificationsEnabled && (
            <>
              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Reminder Time</Text>
                </View>
                <View style={styles.settingAction}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{notificationTime}</Text>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  mode="time"
                  value={new Date(`1970-01-01T${notificationTime}:00`)}
                  onChange={handleTimePicked}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.settingsGroup}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Data Management</Text>

          <TouchableOpacity
            style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}
            onPress={handleExportData}
          >
            <View style={styles.settingInfo}>
              <Download size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Export Data</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}
            onPress={handleClearData}
          >
            <View style={styles.settingInfo}>
              <Trash2 size={22} color="#E76F51" />
              <Text style={[styles.settingLabel, { color: '#E76F51' }]}>Clear All Data</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>About</Text>
          <View style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.settingInfo}>
              <Info size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
            </View>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          All data is stored locally on your device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 24 },
  settingsGroup: { marginBottom: 32 },
  groupTitle: { fontFamily: 'Inter-Medium', fontSize: 14, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontFamily: 'Inter-Medium', fontSize: 16, marginLeft: 12 },
  settingAction: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: 'Inter-Regular', fontSize: 14, marginRight: 8 },
  versionText: { fontFamily: 'Inter-Regular', fontSize: 14 },
  footerText: { fontFamily: 'Inter-Regular', fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 32 },
});
