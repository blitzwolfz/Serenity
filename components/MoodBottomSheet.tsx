import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  Pressable, Alert, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { format, parse } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import MoodSelector from './MoodSelector';
import { saveMoodEntry, deleteMoodEntry } from '@/utils/storage';
import { MoodEntry } from '@/types';
import { Trash2 } from 'lucide-react-native';

type MoodBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  date: string;
  existingEntry: MoodEntry | null;
};

export default function MoodBottomSheet({
  isVisible, onClose, date, existingEntry
}: MoodBottomSheetProps) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [rating, setRating] = useState(existingEntry?.rating || 3);
  const [color, setColor] = useState(existingEntry?.color || getMoodColor(3));
  const [note, setNote] = useState(existingEntry?.note || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setRating(existingEntry.rating);
      setColor(existingEntry.color);
      setNote(existingEntry.note || '');
      setIsEditing(true);
    } else {
      setRating(3);
      setColor(getMoodColor(3));
      setNote('');
      setIsEditing(false);
    }
  }, [existingEntry, isVisible]);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      Keyboard.dismiss();
      onClose();
    }
  }, [onClose]);

  const handleMoodChange = (newRating: number) => {
    setRating(newRating);
    setColor(getMoodColor(newRating));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    try {
      await saveMoodEntry({
        date,
        rating,
        color,
        note,
        timestamp: new Date().toISOString(),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Keyboard.dismiss();
      bottomSheetRef.current?.close();
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood entry');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMoodEntry(date);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Keyboard.dismiss();
              bottomSheetRef.current?.close();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete mood entry');
            }
          },
        },
      ]
    );
  };

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const snapPoints = useMemo(() => ['50%', '75%'], []);
  // const formattedDate = date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : '';
  const formattedDate = date
  ? format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d, yyyy')
  : '';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formattedDate}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How are you feeling today?
          </Text>

          <MoodSelector rating={rating} onRatingChange={handleMoodChange} />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Add a note (optional)
          </Text>

          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Write about your day..."
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={styles.buttonContainer}>
            {isEditing && (
              <Pressable
                style={[styles.deleteButton, { borderColor: colors.errorText }]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={colors.errorText} />
              </Pressable>
            )}

            <Pressable
              style={[styles.saveButton, { backgroundColor: color || colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Save'} Mood
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </BottomSheet>
  );
}

function getMoodColor(rating: number): string {
  switch (rating) {
    case 1: return '#e63946'; // Terrible - Red
    case 2: return '#f59e0b'; // Bad - Amber
    case 3: return '#6b91e3'; // Okay - Blue
    case 4: return '#34d399'; // Good - Green
    case 5: return '#8b5cf6'; // Great - Purple
    default: return '#6b91e3';
  }
}

const styles = StyleSheet.create({
  contentContainer: { flex: 1, padding: 24 },
  dateText: { fontSize: 16, fontWeight: '500', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
