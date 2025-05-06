import { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useMoodContext } from '@/context/AppContext';
import { formatDateRange, groupMoodsByPeriod } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

const PERIODS = ['week', 'month', 'year'] as const;
type PeriodType = typeof PERIODS[number];

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { theme, colors } = useTheme();
  const { moods } = useMoodContext();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{ mood: number; note: string; label: string } | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const updateData = useCallback(() => {
    if (moods && moods.length > 0) {
      const grouped = groupMoodsByPeriod(moods, period, currentDate);
      setGroupedData(grouped);
    } else {
      setGroupedData([]);
    }
  }, [moods, period, currentDate]);

  useFocusEffect(
    useCallback(() => {
      updateData();
    }, [updateData])
  );

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (period === 'week') newDate.setDate(newDate.getDate() - 7);
    if (period === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (period === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (period === 'week') newDate.setDate(newDate.getDate() + 7);
    if (period === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (period === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const { dateLabel, isCurrentPeriod } = formatDateRange(currentDate, period);

  const getMoodEmoji = (mood: number) => {
    if (mood <= 1) return '😞';
    if (mood === 2) return '😐';
    if (mood === 3) return '🙂';
    if (mood === 4) return '😊';
    return '😁';
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

  const hasRealData = groupedData.some(entry => entry.mood !== undefined && entry.mood !== null);

  const openModal = (moodEntry: any) => {
    setSelectedMood(moodEntry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMood(null);
  };

  const moodStats = useMemo(() => {
    const validMoods = groupedData.filter((entry) => entry.mood != null).map((entry) => entry.mood);
    if (validMoods.length === 0) return null;
    const average = (validMoods.reduce((a, b) => a + b, 0) / validMoods.length);
    const max = Math.max(...validMoods);
    const min = Math.min(...validMoods);
    const total = validMoods.length;
    return { average, max, min, total };
  }, [groupedData]);

  const handleItemPress = (item: any) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      openModal(item);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Mood History</Text>
        </View>

        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && { backgroundColor: colors.primary },
              ]}
              onPress={() => handlePeriodChange(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p ? '#fff' : colors.textSecondary },
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.dateNavigator, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity style={styles.navButton} onPress={handlePreviousPeriod}>
            <ChevronLeft size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.dateLabel, { color: colors.text }]}>{dateLabel}</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextPeriod}
            disabled={isCurrentPeriod}
          >
            <ChevronRight
              size={24}
              color={isCurrentPeriod ? colors.textTertiary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.timelineContainer, { backgroundColor: colors.cardBackground }]}>
          {period === 'week' && !hasRealData ? (
            <View style={styles.emptyTimeline}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No mood data available
              </Text>
            </View>
          ) : (
            <View style={styles.timelineLine}>
              {groupedData.map((entry, index) => (
                <Animated.View key={index} style={[styles.timelineItem, { opacity: fadeAnim }]}>
                  <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => handleItemPress(entry)}>
                    <View style={styles.leftSide}>
                      <View style={[styles.moodCircle, { backgroundColor: getMoodColor(entry.mood) }]}>
                        <Text style={styles.moodEmoji}>
                          {entry.mood ? getMoodEmoji(entry.mood) : '❓'}
                        </Text>
                      </View>
                      {index !== groupedData.length - 1 && (
                        <View style={[styles.verticalLine, { backgroundColor: colors.textTertiary }]} />
                      )}
                    </View>

                    <View style={styles.moodDetails}>
                      <Text style={[styles.moodDate, { color: colors.textSecondary }]}>
                        {entry.label}
                      </Text>
                      <Text style={[styles.moodRating, { color: colors.text }]}>
                        Mood: {entry.mood ? entry.mood + '/5' : 'N/A'}
                      </Text>
                      {period === 'week' && (
                        <Text style={[styles.moodNote, { color: colors.textSecondary }]}>
                          {entry.note
                            ? (entry.note.length > 20 ? entry.note.slice(0, 20) + '...' : entry.note)
                            : 'No note'}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
            <Pressable style={styles.modalCloseButton} onPress={closeModal}>
              <X size={24} color={colors.text} />
            </Pressable>

            {selectedMood && (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedMood.label}</Text>
                <Text style={[styles.modalMood, { color: colors.primary }]}>
                  {getMoodEmoji(selectedMood.mood)} {selectedMood.mood}/5
                </Text>

                {period === 'week' ? (
                  <Text style={[styles.modalNote, { color: colors.textSecondary, marginBottom: 16 }]}>
                    {selectedMood.note ? `"${selectedMood.note}"` : 'No note added.'}
                  </Text>
                ) : (
                  moodStats && (
                    <Text style={[styles.modalNote, { color: colors.textSecondary, marginBottom: 16 }]}>
                      Average Mood for {period.charAt(0).toUpperCase() + period.slice(1)}: {moodStats.average}/5
                    </Text>
                  )
                )}

                {moodStats && (
                  <View style={styles.statsContainer}>
                    <Text style={[styles.statText, { color: colors.text }]}>Average Mood: {moodStats.average}</Text>
                    <Text style={[styles.statText, { color: colors.text }]}>Highest Mood: {moodStats.max}</Text>
                    <Text style={[styles.statText, { color: colors.text }]}>Lowest Mood: {moodStats.min}</Text>
                    <Text style={[styles.statText, { color: colors.text }]}>Total Entries: {moodStats.total}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { marginBottom: 24 },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 24 },
  periodSelector: { flexDirection: 'row', marginBottom: 16 },
  periodButton: { flex: 1, paddingVertical: 8, alignItems: 'center', marginHorizontal: 4, borderRadius: 8 },
  periodText: { fontFamily: 'Inter-Medium', fontSize: 14 },
  dateNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 12, marginBottom: 16 },
  navButton: { padding: 8 },
  dateLabel: { fontFamily: 'Inter-Medium', fontSize: 16 },
  timelineContainer: { borderRadius: 16, padding: 16, marginBottom: 24 },
  timelineLine: { marginLeft: 20, paddingBottom: 20 },
  timelineItem: { marginBottom: 24 },
  leftSide: { alignItems: 'center', width: 40 },
  moodCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  verticalLine: { width: 2, flex: 1, marginTop: 2 },
  moodEmoji: { fontSize: 20 },
  moodDetails: { flex: 1, marginLeft: 16 },
  moodDate: { fontFamily: 'Inter-Regular', fontSize: 12, marginBottom: 4 },
  moodRating: { fontFamily: 'Inter-Medium', fontSize: 16 },
  moodNote: { fontFamily: 'Inter-Regular', fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  emptyTimeline: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', padding: 24, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 8 },
  modalMood: { fontFamily: 'Inter-Bold', fontSize: 24, marginBottom: 8 },
  modalNote: { fontFamily: 'Inter-Regular', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
  modalCloseButton: { position: 'absolute', top: 12, right: 12 },
  statsContainer: { marginTop: 8, width: '100%', alignItems: 'flex-start' },
  statText: { fontFamily: 'Inter-Regular', fontSize: 14, marginVertical: 2 },
});
