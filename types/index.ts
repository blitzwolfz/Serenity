export type MoodEntry = {
  date: string; // Format: YYYY-MM-DD
  rating: number; // 1-5
  color: string; // Hex color code
  note?: string; // Optional note
  timestamp: string; // ISO date string
};

export type AppSettings = {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  notificationTime: string; // Format: HH:MM
};

export type ThemeColors = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
  errorText: string;
};