import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Bell, FileDown, Trash2, Info } from 'lucide-react-native';
import { saveSettings, getSettings, clearAllData } from '@/utils/storage';
import { scheduleDailyNotification, cancelNotifications } from '@/utils/notifications';
import { exportMoodData } from '@/utils/export';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setNotificationTime(settings.notificationTime);
    };
    
    loadSettings();
  }, []);

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await saveSettings({ notificationsEnabled: value, notificationTime });
    
    if (value) {
      scheduleDailyNotification(notificationTime);
    } else {
      cancelNotifications();
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportMoodData();
      Alert.alert(
        'Export Successful',
        'Your mood data has been exported successfully.'
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        'There was an error exporting your mood data.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all your mood data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert(
              'Data Reset',
              'All mood data has been reset successfully.'
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Customize your mood tracking experience
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            {isDark ? <Moon size={24} color={colors.text} /> : <Sun size={24} color={colors.text} />}
            <Text style={[styles.settingText, { color: colors.text }]}>Dark Theme</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            <Bell size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Daily Reminder</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
        {notificationsEnabled && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            You'll receive a reminder at 8:00 PM each day to log your mood.
          </Text>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleExport}
          disabled={loading}
        >
          <View style={styles.settingContent}>
            <FileDown size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              {loading ? 'Exporting...' : 'Export Data'}
            </Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Export your mood data as a CSV or JSON file.
        </Text>
        
        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}
          onPress={handleReset}
        >
          <View style={styles.settingContent}>
            <Trash2 size={24} color={colors.errorText} />
            <Text style={[styles.settingText, { color: colors.errorText }]}>Reset All Data</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Delete all your mood tracking data. This cannot be undone.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            <Info size={24} color={colors.text} />
            <View>
              <Text style={[styles.settingText, { color: colors.text }]}>Mood Tracker</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary, marginTop: 2 }]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});