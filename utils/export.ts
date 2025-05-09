import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import { getMoodEntries } from './storage';
import { MoodEntry } from '@/types';

export const exportMoodData = async () => {
  try {
    const entries = await getMoodEntries();
    
    if (entries.length === 0) {
      throw new Error('No mood data to export');
    }
    
    // Export as JSON
    await exportAsJson(entries);
    
  } catch (error) {
    console.error('Error exporting mood data:', error);
    throw error;
  }
};

const exportAsJson = async (entries: MoodEntry[]) => {
  if (Platform.OS === 'web') {
    // For web, create a download link
    downloadJsonFile(entries);
    return;
  }

  const fileName = `mood_tracker_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
  const jsonString = JSON.stringify(entries, null, 2);
  
  await FileSystem.writeAsStringAsync(fileUri, jsonString);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

export const exportAsCsv = async (entries: MoodEntry[]) => {
  if (Platform.OS === 'web') {
    // For web, create a download link
    downloadCsvFile(entries);
    return;
  }

  const fileName = `mood_tracker_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
  const header = 'Date,Rating,Color,Note\n';
  const rows = entries.map(entry => {
    const note = entry.note ? `"${entry.note.replace(/"/g, '""')}"` : '';
    return `${entry.date},${entry.rating},${entry.color},${note}`;
  }).join('\n');
  
  const csvString = header + rows;
  
  await FileSystem.writeAsStringAsync(fileUri, csvString);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

// Web-specific functions for downloading files
const downloadJsonFile = (entries: MoodEntry[]) => {
  const jsonString = JSON.stringify(entries, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `mood_tracker_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};

const downloadCsvFile = (entries: MoodEntry[]) => {
  const header = 'Date,Rating,Color,Note\n';
  const rows = entries.map(entry => {
    const note = entry.note ? `"${entry.note.replace(/"/g, '""')}"` : '';
    return `${entry.date},${entry.rating},${entry.color},${note}`;
  }).join('\n');
  
  const csvString = header + rows;
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `mood_tracker_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
};