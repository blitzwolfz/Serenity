import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryLine, VictoryGroup } from 'victory-native';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth, subWeeks } from 'date-fns';
import { getMoodEntries } from '@/utils/storage';
import { MoodEntry } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import EmptyState from '@/components/EmptyState';

const CHART_WIDTH = Dimensions.get('window').width - 32;

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [aggregatedData, setAggregatedData] = useState([]);

  const loadMoodData = async () => {
    const entries = await getMoodEntries();
    setMoodEntries(entries);

    if (entries.length > 0) {
      calculateAggregatedData(entries, period);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMoodData();
    }, [period])
  );

  const calculateAggregatedData = (entries: MoodEntry[], selectedPeriod: string) => {
    let data = [];
    
    if (selectedPeriod === 'week') {
      // Get current week's data
      const startDate = startOfWeek(new Date());
      const endDate = endOfWeek(new Date());
      const daysInWeek = eachDayOfInterval({ start: startDate, end: endDate });
      
      data = daysInWeek.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEntries = entries.filter(entry => entry.date === dateStr);
        const avgRating = dayEntries.length 
          ? dayEntries.reduce((sum, entry) => sum + entry.rating, 0) / dayEntries.length 
          : 0;
        
        return {
          date: format(day, 'EEE'),
          rating: avgRating,
          fullDate: dateStr,
        };
      });
    } else if (selectedPeriod === 'month') {
      // Get current month's data by weeks
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      const weeks = [];
      let currentWeekStart = startDate;
      
      while (currentWeekStart <= endDate) {
        const weekEnd = new Date(Math.min(
          endOfWeek(currentWeekStart).getTime(),
          endDate.getTime()
        ));
        weeks.push({ start: currentWeekStart, end: weekEnd });
        currentWeekStart = new Date(weekEnd.getTime() + 86400000); // Add one day
      }
      
      data = weeks.map((week, index) => {
        const weekEntries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= week.start && entryDate <= week.end;
        });
        
        const avgRating = weekEntries.length 
          ? weekEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekEntries.length 
          : 0;
        
        return {
          date: `Week ${index + 1}`,
          rating: avgRating,
          fullDate: `${format(week.start, 'MMM d')} - ${format(week.end, 'MMM d')}`,
        };
      });
    } else if (selectedPeriod === 'year') {
      // Get last 12 months data
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push(subMonths(new Date(), i));
      }
      months.reverse();
      
      data = months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthEntries = entries.filter(entry => entry.date.startsWith(monthStr));
        const avgRating = monthEntries.length 
          ? monthEntries.reduce((sum, entry) => sum + entry.rating, 0) / monthEntries.length 
          : 0;
        
        return {
          date: format(month, 'MMM'),
          rating: avgRating,
          fullDate: format(month, 'MMMM yyyy'),
        };
      });
    }
    
    setAggregatedData(data);
  };

  const renderChart = () => {
    if (moodEntries.length === 0) {
      return (
        <EmptyState
          title="No data to analyze yet"
          description="Start tracking your mood to see analytics"
        />
      );
    }

    return (
      <View style={styles.chartContainer}>
        <VictoryChart
          width={CHART_WIDTH}
          height={300}
          theme={VictoryTheme.material}
          domainPadding={{ x: 20 }}
        >
          <VictoryAxis
            tickFormat={(t) => t}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.text, fontSize: 10 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickValues={[1, 2, 3, 4, 5]}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.text, fontSize: 10 },
              grid: { stroke: colors.border, strokeWidth: 0.5 },
            }}
          />
          
          <VictoryGroup>
            <VictoryBar
              data={aggregatedData}
              x="date"
              y="rating"
              style={{
                data: { 
                  fill: colors.primary,
                  width: period === 'year' ? 15 : 25, 
                },
              }}
              animate={{
                duration: 500,
                onLoad: { duration: 500 }
              }}
              cornerRadius={{ top: 5 }}
            />
            
            <VictoryLine
              data={aggregatedData}
              x="date"
              y="rating"
              style={{
                data: { 
                  stroke: colors.accent,
                  strokeWidth: 2 
                },
              }}
              animate={{
                duration: 500,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryGroup>
        </VictoryChart>
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>
          Mood Analytics
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          View trends in your mood over time
        </Text>
      </View>
      
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'week' && [styles.activePeriod, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setPeriod('week')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'week' ? { color: '#fff' } : { color: colors.text }
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'month' && [styles.activePeriod, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setPeriod('month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'month' ? { color: '#fff' } : { color: colors.text }
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'year' && [styles.activePeriod, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setPeriod('year')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'year' ? { color: '#fff' } : { color: colors.text }
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>
      
      {renderChart()}
      
      {moodEntries.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Average Mood</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {(aggregatedData.reduce((sum, item) => sum + item.rating, 0) / aggregatedData.length).toFixed(1)}
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Total Entries</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {moodEntries.length}
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Completion</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {period === 'week' 
                ? `${Math.round((aggregatedData.filter(d => d.rating > 0).length / 7) * 100)}%`
                : period === 'month'
                ? `${Math.round((moodEntries.filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM'))).length / 30) * 100)}%`
                : `${Math.round((moodEntries.length / 365) * 100)}%`
              }
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontWeight: '500',
  },
  activePeriod: {
    backgroundColor: '#4a56e2',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});