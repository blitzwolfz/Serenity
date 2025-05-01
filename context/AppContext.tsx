import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export interface MoodEntry {
  date: string;
  mood: number;
  note?: string;
}

interface AppContextType {
  moods: MoodEntry[];
  addMoodEntry: (entry: MoodEntry) => Promise<void>;
  getTodayMood: () => Promise<MoodEntry | null>;
  exportData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  notificationsEnabled: boolean;
  toggleNotifications: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage Keys
const MOODS_STORAGE_KEY = 'moodtrack_moods';
const NOTIFICATIONS_ENABLED_KEY = 'moodtrack_notifications_enabled';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load saved moods from storage
  useEffect(() => {
    const loadMoods = async () => {
      try {
        const savedMoods = await AsyncStorage.getItem(MOODS_STORAGE_KEY);
        if (savedMoods) {
          setMoods(JSON.parse(savedMoods));
        }
        
        const notificationsStatus = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        setNotificationsEnabled(notificationsStatus === 'true');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadMoods();
  }, []);

  // Add or update a mood entry
  const addMoodEntry = async (entry: MoodEntry) => {
    try {
      // Check if there's already an entry for the same day
      const today = new Date(entry.date).toDateString();
      
      const updatedMoods = [...moods];
      const existingEntryIndex = updatedMoods.findIndex(
        mood => new Date(mood.date).toDateString() === today
      );
      
      if (existingEntryIndex !== -1) {
        // Update existing entry
        updatedMoods[existingEntryIndex] = entry;
      } else {
        // Add new entry
        updatedMoods.push(entry);
      }
      
      setMoods(updatedMoods);
      await AsyncStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(updatedMoods));
    } catch (error) {
      console.error('Error saving mood:', error);
      throw error;
    }
  };

  // Get today's mood entry if it exists
  const getTodayMood = async (): Promise<MoodEntry | null> => {
    try {
      const today = new Date().toDateString();
      
      const todayEntry = moods.find(
        mood => new Date(mood.date).toDateString() === today
      );
      
      return todayEntry || null;
    } catch (error) {
      console.error('Error getting today mood:', error);
      return null;
    }
  };

  // Export data as JSON
  const exportData = async () => {
    try {
      if (moods.length === 0) {
        throw new Error('No mood data to export');
      }
      
      const dataStr = JSON.stringify(moods, null, 2);
      
      if (Platform.OS === 'web') {
        // Web export (download file)
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moodtrack_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For mobile, we'd normally use expo-file-system and expo-sharing
        // But for this MVP, we'll just return the data for future implementation
        console.log('Export data:', dataStr);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  // Clear all mood data
  const clearAllData = async () => {
    try {
      setMoods([]);
      await AsyncStorage.removeItem(MOODS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  };

  // Toggle notifications
  const toggleNotifications = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.error('Error toggling notifications:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        moods,
        addMoodEntry,
        getTodayMood,
        exportData,
        clearAllData,
        notificationsEnabled,
        toggleNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useMoodContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useMoodContext must be used within an AppProvider');
  }
  return context;
};