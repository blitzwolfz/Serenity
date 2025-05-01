import { format, startOfWeek, endOfWeek, subDays, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, parseISO, getWeek, getMonth, getYear } from 'date-fns';
import { MoodEntry } from '@/context/AppContext';

// Format a date to display
export const formatDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM d, yyyy');
};

// Format a range of dates for display (e.g., "September 1-7, 2023")
export const formatDateRange = (date: Date, period: string) => {
  let startDate: Date;
  let endDate: Date;
  let dateLabel: string;
  let isCurrentPeriod: boolean = false;
  const today = new Date();

  if (period === 'week') {
    startDate = startOfWeek(date, { weekStartsOn: 0 });
    endDate = endOfWeek(date, { weekStartsOn: 0 });
    dateLabel = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    
    // Check if this is the current week
    const currentStartDate = startOfWeek(today, { weekStartsOn: 0 });
    isCurrentPeriod = isSameDay(startDate, currentStartDate);
  } else if (period === 'month') {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
    dateLabel = format(date, 'MMMM yyyy');
    
    // Check if this is the current month
    isCurrentPeriod = getMonth(today) === getMonth(date) && getYear(today) === getYear(date);
  } else if (period === 'year') {
    startDate = startOfYear(date);
    endDate = endOfYear(date);
    dateLabel = format(date, 'yyyy');
    
    // Check if this is the current year
    isCurrentPeriod = getYear(today) === getYear(date);
  } else {
    // Default to a single day
    startDate = date;
    endDate = date;
    dateLabel = format(date, 'MMMM d, yyyy');
    isCurrentPeriod = isSameDay(today, date);
  }

  return { startDate, endDate, dateLabel, isCurrentPeriod };
};

// Group moods by period (day, week, month, year)
export const groupMoodsByPeriod = (moods: MoodEntry[], period: string, referenceDate: Date) => {
  let groupedData: any[] = [];

  // Get date range for the period
  const { startDate, endDate } = formatDateRange(referenceDate, period);

  // Filter moods that fall within the period
  const filteredMoods = moods.filter(entry => {
    const entryDate = parseISO(entry.date);
    return isWithinInterval(entryDate, { start: startDate, end: endDate });
  });

  if (period === 'week') {
    // For week view, create an entry for each day
    for (let i = 0; i < 7; i++) {
      const date = subDays(endDate, 6 - i);
      const dayStr = format(date, 'EEE');
      
      const dayMood = filteredMoods.find(mood => 
        isSameDay(parseISO(mood.date), date)
      );
      
      groupedData.push({
        date: date.toISOString(),
        label: dayStr,
        mood: dayMood?.mood || null,
        note: dayMood?.note || null,
      });
    }
  } else if (period === 'month') {
    // Get the number of days in the month
    const daysInMonth = endDate.getDate();
    
    // Create week groupings
    const weeks = Array.from(
      { length: Math.ceil(daysInMonth / 7) },
      (_, i) => `Week ${i + 1}`
    );
    
    // Initialize data for each week
    weeks.forEach(week => {
      groupedData.push({
        label: week,
        mood: 0,
        count: 0,
      });
    });
    
    // Calculate average mood per week
    filteredMoods.forEach(mood => {
      const date = parseISO(mood.date);
      const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
      
      if (groupedData[weekOfMonth]) {
        groupedData[weekOfMonth].mood += mood.mood;
        groupedData[weekOfMonth].count += 1;
        
        // Store the last note of the week
        groupedData[weekOfMonth].note = mood.note;
        groupedData[weekOfMonth].date = mood.date;
      }
    });
    
    // Calculate averages and clean up
    groupedData = groupedData.map(week => {
      return {
        label: week.label,
        mood: week.count > 0 ? Math.round(week.mood / week.count) : null,
        note: week.note || null,
        date: week.date || null,
      };
    });
  } else if (period === 'year') {
    // Create month groupings
    const months = Array.from(
      { length: 12 },
      (_, i) => format(new Date(2000, i, 1), 'MMM')
    );
    
    // Initialize data for each month
    months.forEach(month => {
      groupedData.push({
        label: month,
        mood: 0,
        count: 0,
      });
    });
    
    // Calculate average mood per month
    filteredMoods.forEach(mood => {
      const date = parseISO(mood.date);
      const monthIndex = date.getMonth();
      
      if (groupedData[monthIndex]) {
        groupedData[monthIndex].mood += mood.mood;
        groupedData[monthIndex].count += 1;
        
        // Store the last note of the month
        groupedData[monthIndex].note = mood.note;
        groupedData[monthIndex].date = mood.date;
      }
    });
    
    // Calculate averages and clean up
    groupedData = groupedData.map(month => {
      return {
        label: month.label,
        mood: month.count > 0 ? Math.round(month.mood / month.count) : null,
        note: month.note || null,
        date: month.date || null,
      };
    });
  }

  return groupedData;
};