import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
const lightTheme = {
  background: '#F9F9FB',
  backgroundAccent: '#F0F0F5',
  cardBackground: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#7c83fd',
  primaryLight: '#a5a8ff',
  secondary: '#96baff',
  accent: '#7eebc3',
  border: '#E5E5E5',
  error: '#E76F51',
  success: '#2A9D8F',
};

const darkTheme = {
  background: '#121212',
  backgroundAccent: '#1E1E1E',
  cardBackground: '#242424',
  text: '#F0F0F0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  primary: '#7c83fd',
  primaryLight: '#a5a8ff',
  secondary: '#96baff',
  accent: '#7eebc3',
  border: '#333333',
  error: '#E76F51',
  success: '#2A9D8F',
};

// Types
type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof lightTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const THEME_STORAGE_KEY = 'moodtrack_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme() as ThemeType;
  
  // State to track the current theme
  const [theme, setTheme] = useState<ThemeType>(deviceTheme || 'light');

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        } else {
          // Use device theme if no preference is saved
          setTheme(deviceTheme || 'light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, [deviceTheme]);

  // Toggle between light and dark mode
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Get current theme colors
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};