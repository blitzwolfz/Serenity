import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry, AppSettings } from '@/types';
import { format, startOfDay } from 'date-fns';

const MOOD_ENTRIES_KEY = '@mood_tracker_entries';
const APP_SETTINGS_KEY = '@mood_tracker_settings';

// Helper function to get local date string
const getLocalDateString = (date: Date = new Date()): string => {
  return format(startOfDay(date), 'yyyy-MM-dd');
};

// Mood Entries
export const saveMoodEntry = async (entry: MoodEntry): Promise<void> => {
  try {
    const entries = await getMoodEntries();
    const existingEntryIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingEntryIndex !== -1) {
      // Update existing entry
      entries[existingEntryIndex] = {
        ...entry,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Add new entry
      entries.push({
        ...entry,
        timestamp: new Date().toISOString(),
      });
    }
    
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving mood entry:', error);
    throw error;
  }
};

export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const entriesString = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    return entriesString ? JSON.parse(entriesString) : [];
  } catch (error) {
    console.error('Error getting mood entries:', error);
    return [];
  }
};

export const getMoodEntry = async (date: string): Promise<MoodEntry | null> => {
  try {
    const entries = await getMoodEntries();
    return entries.find(entry => entry.date === date) || null;
  } catch (error) {
    console.error('Error getting mood entry:', error);
    return null;
  }
};

export const deleteMoodEntry = async (date: string): Promise<void> => {
  try {
    const entries = await getMoodEntries();
    const updatedEntries = entries.filter(entry => entry.date !== date);
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    throw error;
  }
};

export const getMoodColorForDay = (date: string): Promise<string | null> => {
  return getMoodEntry(date).then(entry => entry?.color || null);
};

// App Settings
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settingsString = await AsyncStorage.getItem(APP_SETTINGS_KEY);
    const defaultSettings: AppSettings = {
      theme: 'system',
      notificationsEnabled: false,
      notificationTime: '20:00',
    };
    
    return settingsString
      ? { ...defaultSettings, ...JSON.parse(settingsString) }
      : defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      theme: 'system',
      notificationsEnabled: false,
      notificationTime: '20:00',
    };
  }
};

type PartialSettings = Partial<AppSettings>;

export const saveSettings = async (settings: PartialSettings): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MOOD_ENTRIES_KEY);
    // Preserve settings
    console.log('All mood data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};