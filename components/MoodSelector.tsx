import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const moods = [
  { value: 1, label: 'Terrible', emoji: '😞', color: '#e63946' },
  { value: 2, label: 'Bad', emoji: '😕', color: '#f59e0b' },
  { value: 3, label: 'Okay', emoji: '😐', color: '#6b91e3' },
  { value: 4, label: 'Good', emoji: '🙂', color: '#34d399' },
  { value: 5, label: 'Great', emoji: '😄', color: '#8b5cf6' },
];

type MoodSelectorProps = {
  rating: number;
  onRatingChange: (rating: number) => void;
};

export default function MoodSelector({ rating, onRatingChange }: MoodSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {moods.map((mood) => (
        <MoodButton
          key={mood.value}
          mood={mood}
          isSelected={rating === mood.value}
          onPress={() => onRatingChange(mood.value)}
        />
      ))}
    </View>
  );
}

type MoodButtonProps = {
  mood: { value: number; label: string; emoji: string; color: string };
  isSelected: boolean;
  onPress: () => void;
};

function MoodButton({ mood, isSelected, onPress }: MoodButtonProps) {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(isSelected ? 1.1 : 1, {
            duration: 200,
          }),
        },
      ],
      backgroundColor: withTiming(
        isSelected ? mood.color : colors.card,
        { duration: 200 }
      ),
      borderColor: withTiming(
        isSelected ? mood.color : colors.border,
        { duration: 200 }
      ),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(
        isSelected ? '#fff' : colors.text,
        { duration: 200 }
      ),
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.moodButton,
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Animated.Text style={[styles.moodLabel, textStyle]}>
          {mood.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 64,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});