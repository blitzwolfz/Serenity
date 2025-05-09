import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/hooks/useTheme';
import { getMoodEntries } from '@/utils/storage';
import MoodBottomSheet from '@/components/MoodBottomSheet';
import { MoodEntry } from '@/types';
import AddMoodButton from '@/components/AddMoodButton';
import EmptyState from '@/components/EmptyState';

export default function TrackerScreen() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState('');
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd'); // uses local time

  const loadMarkedDates = async () => {
    const entries = await getMoodEntries();
    setMoodEntries(entries);

    const marked: any = {};
    entries.forEach(entry => {
      marked[entry.date] = {
        customStyles: {
          container: {
            backgroundColor: entry.color,
            borderRadius: 4,
          },
          text: {
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      };
    });

    setMarkedDates(marked);
  };

  useFocusEffect(
    useCallback(() => {
      loadMarkedDates();
    }, [])
  );

  const handleDayPress = (day) => {
    const selectedLocalDate = format(parseISO(day.dateString), 'yyyy-MM-dd');
    setSelectedDate(selectedLocalDate);

    const entry = moodEntries.find(e => e.date === selectedLocalDate);

    console.log('Selected date:', selectedLocalDate);
    console.log('Entry:', entry);
    console.log('Mood entries:', moodEntries);

    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }

    setIsBottomSheetVisible(true);
  };

  const handleAddMood = () => {
    setSelectedDate(today);
    setSelectedEntry(null);
    setIsBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    loadMarkedDates();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>
          {format(new Date(), 'MMMM yyyy')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your daily mood
        </Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          calendarBackground: colors.card,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
        }}
        markingType="custom"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        enableSwipeMonths={true}
      />

      {moodEntries.length === 0 ? (
        <EmptyState
          title="No mood entries yet"
          description="Start tracking your mood by tapping the button below"
          action={handleAddMood}
        />
      ) : (
        <View style={styles.recentContainer}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>
            Recent Entries
          </Text>
          <View style={styles.recentEntries}>
            {moodEntries
              .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
              .slice(0, 3)
              .map(entry => (
                <TouchableOpacity
                  key={entry.date}
                  style={[
                    styles.recentEntry,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedDate(entry.date);
                    setSelectedEntry(entry);
                    console.log('Selected entry:', entry);
                    setIsBottomSheetVisible(true);
                  }}
                >
                  <View style={[styles.moodColor, { backgroundColor: entry.color }]} />
                  <View style={styles.entryDetails}>
                    <Text style={[styles.entryDate, { color: colors.text }]}>
                      {format(parseISO(entry.date), 'EEEE, MMM d')}
                    </Text>
                    <Text style={[styles.entryRating, { color: colors.textSecondary }]}>
                      Rating: {entry.rating}/5
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      <AddMoodButton onPress={handleAddMood} />

      <MoodBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        date={selectedDate}
        existingEntry={selectedEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 8 },
  header: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 16,
  },
  recentContainer: { paddingHorizontal: 16, marginTop: 16 },
  recentTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  recentEntries: { gap: 8 },
  recentEntry: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  moodColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  entryDetails: { flex: 1 },
  entryDate: { fontSize: 16, fontWeight: '500' },
  entryRating: { fontSize: 14, marginTop: 2 },
});
