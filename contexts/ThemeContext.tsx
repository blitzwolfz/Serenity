import React, { createContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { saveSettings, getSettings } from '@/utils/storage';
import { ThemeColors } from '@/types';

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: {} as ThemeColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

const lightColors: ThemeColors = {
  primary: '#4a56e2',
  accent: '#f97316',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  inputBackground: '#f1f5f9',
  errorText: '#ef4444',
};

const darkColors: ThemeColors = {
  primary: '#6366f1',
  accent: '#f97316',
  background: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  inputBackground: '#1e293b',
  errorText: '#ef4444',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setThemeMode(settings.theme);
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(deviceTheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, deviceTheme]);

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setThemeMode(newTheme);
    await saveSettings({ theme: newTheme });
  };

  const handleSetThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    await saveSettings({ theme: mode });
  };

  const colors = isDark ? darkColors : lightColors;

  const value = {
    isDark,
    colors,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}