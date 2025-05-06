import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMoodContext } from '@/context/AppContext';
import { formatDate } from '@/utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { addMoodEntry, getTodayMood } = useMoodContext();
  const [note, setNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const noteAnimatedHeight = useSharedValue(0);
  const noteOpacity = useSharedValue(0);
  const savedBannerOpacity = useSharedValue(0);

  useEffect(() => {
    const checkTodayMood = async () => {
      const entry = await getTodayMood();
      if (entry) {
        setTodayEntry(entry);
        // Do not auto-select mood or open note
      }
    };
    checkTodayMood();
  }, []);

  const handleMoodSelect = (mood: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedMood(mood);

    if (noteAnimatedHeight.value === 0) {
      noteAnimatedHeight.value = withSpring(120);
      noteOpacity.value = withSpring(1);
    }
  };

  const showSavedBanner = () => {
    savedBannerOpacity.value = withTiming(1, { duration: 300 }, () => {
      // savedBannerOpacity.value = withTiming(0, { duration: 300, delay: 2000 });
      savedBannerOpacity.value = withTiming(0, { duration: 300 });

    });
  };

  const handleSave = async () => {
    if (selectedMood === null) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newEntry = {
      date: new Date().toISOString(),
      mood: selectedMood,
      note: note.trim(),
    };

    await addMoodEntry(newEntry);
    setTodayEntry(newEntry);

    setSelectedMood(null);
    setNote('');

    noteAnimatedHeight.value = withSpring(0);
    noteOpacity.value = withSpring(0);

    runOnJS(showSavedBanner)();
  };

  const noteAnimatedStyle = useAnimatedStyle(() => ({
    height: noteAnimatedHeight.value,
    opacity: noteOpacity.value,
  }));

  const savedBannerStyle = useAnimatedStyle(() => ({
    opacity: savedBannerOpacity.value,
    transform: [{ translateY: savedBannerOpacity.value ? 0 : -20 }],
  }));

  const getMoodEmoji = (mood: number) => {
    switch (mood) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '❓';
    }
  };

  const getMoodText = (mood: number) => {
    switch (mood) {
      case 1: return 'Bad';
      case 2: return 'Poor';
      case 3: return 'Okay';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return '';
    }
  };

  const getMoodColor = (mood: number) => {
    switch (mood) {
      case 1: return '#E76F51';
      case 2: return '#F4A261';
      case 3: return '#E9C46A';
      case 4: return '#2A9D8F';
      case 5: return '#264653';
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.View style={[styles.savedBanner, savedBannerStyle]}>
          <Text style={styles.savedBannerText}>Mood Saved!</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(new Date())}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              How are you feeling today?
            </Text>
          </View>

          {todayEntry ? (
            <View style={[styles.savedMoodContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.savedMoodContent}>
                <Text style={styles.savedMoodEmoji}>{getMoodEmoji(todayEntry.mood)}</Text>
                <View style={styles.savedMoodTextContainer}>
                  <Text style={[styles.savedMoodText, { color: colors.text }]}>
                    You're feeling {getMoodText(todayEntry.mood).toLowerCase()} today
                  </Text>
                  {todayEntry.note ? (
                    <Text style={[styles.savedMoodNote, { color: colors.textSecondary }]}>
                      "{todayEntry.note}"
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.savedMoodIndicator, { backgroundColor: getMoodColor(todayEntry.mood) }]} />

              <Text style={[styles.editText, { color: colors.primary }]}>
                Tap on another mood to update
              </Text>
            </View>
          ) : (
            <Text style={[styles.promptText, { color: colors.textSecondary }]}>
              Select your mood by tapping below
            </Text>
          )}

          <View style={styles.moodOptions}>
            {[1, 2, 3, 4, 5].map((mood) => (
              <MoodOption
                key={mood}
                mood={mood}
                selected={selectedMood === mood}
                onSelect={() => handleMoodSelect(mood)}
                color={getMoodColor(mood)}
                backgroundColor={colors.cardBackground}
                emoji={getMoodEmoji(mood)}
                moodText={getMoodText(mood)}
                textColor={colors.text}
              />
            ))}
          </View>

          <Animated.View style={[styles.noteContainer, noteAnimatedStyle]}>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Add a note about your day... (optional)"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
            />
          </Animated.View>

          {selectedMood !== null && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
              <Check size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type MoodOptionProps = {
  mood: number;
  selected: boolean;
  onSelect: () => void;
  color: string;
  backgroundColor: string;
  emoji: string;
  moodText: string;
  textColor: string;
};

function MoodOption({
                      mood,
                      selected,
                      onSelect,
                      color,
                      backgroundColor,
                      emoji,
                      moodText,
                      textColor
                    }: MoodOptionProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = selected ? withSpring(1.05) : withSpring(1);
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: selected ? color : 'transparent',
  }));

  return (
    <Animated.View style={[animatedStyle, { borderWidth: 2, borderRadius: 16 }]}>
      <TouchableOpacity
        style={[
          styles.moodOption,
          { backgroundColor }
        ]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <Text style={styles.moodEmoji}>{emoji}</Text>
        <Text style={[styles.moodText, { color: textColor }]}>{moodText}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 32 },
  date: { fontFamily: 'Inter-Regular', fontSize: 16, marginBottom: 8 },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 24, lineHeight: 32 },
  promptText: { fontFamily: 'Inter-Regular', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  moodOptions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 },
  moodOption: { width: 65, height: 90, borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8 },
  moodEmoji: { fontSize: 32, marginBottom: 8 },
  moodText: { fontFamily: 'Inter-Medium', fontSize: 12, textAlign: 'center' },
  noteContainer: { marginBottom: 24 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontFamily: 'Inter-Regular', fontSize: 16, height: '100%', textAlignVertical: 'top' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 8 },
  saveButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#fff', marginRight: 8 },
  savedMoodContainer: { borderRadius: 16, padding: 16, marginBottom: 24, position: 'relative', overflow: 'hidden' },
  savedMoodContent: { flexDirection: 'row', alignItems: 'center' },
  savedMoodEmoji: { fontSize: 42, marginRight: 16 },
  savedMoodTextContainer: { flex: 1 },
  savedMoodText: { fontFamily: 'Inter-Medium', fontSize: 16, marginBottom: 4 },
  savedMoodNote: { fontFamily: 'Inter-Regular', fontSize: 14, fontStyle: 'italic' },
  savedMoodIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  editText: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 12, textAlign: 'right' },
  savedBanner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: '#2A9D8F',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    zIndex: 10
  },
  savedBannerText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
