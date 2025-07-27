import React from 'react';
import { Box } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ViewComponentProps } from '@/types/schedule';
import CalendarGrid from './CalendarGrid';
import HierarchicalHeader from '../components/HierarchicalHeader';

const MonthView: React.FC<ViewComponentProps> = ({
  filteredGames,
  canEditSchedule,
  onEditGame: _onEditGame,
  onGameResults,
  convertGameToGameCardData,
  filterType,
  filterDate,
  setFilterDate,
  setFilterType,
  navigate,
  isNavigating,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(filterDate);

  // Sync currentMonth with filterDate when it changes
  React.useEffect(() => {
    setCurrentMonth(filterDate);
  }, [filterDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (navigate) {
      navigate(direction, 'month');
    } else {
      // Fallback to local navigation
      const newMonth =
        direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
      setFilterDate(newMonth);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setFilterDate(today);
  };

  // Calculate month days including padding days from previous/next months
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Box
      sx={{
        border: '3px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        overflowX: 'auto',
        minWidth: 'fit-content',
      }}
    >
      <HierarchicalHeader
        filterType={filterType}
        filterDate={currentMonth}
        isNavigating={isNavigating || false}
        onFilterTypeChange={setFilterType}
        onFilterDateChange={setFilterDate}
        onNavigate={navigateMonth}
        onGoToToday={goToToday}
        viewMode="calendar"
      />

      {/* Calendar Grid */}
      <CalendarGrid
        gridType="month"
        showZoomColumn={true}
        days={monthDays}
        filteredGames={filteredGames}
        minHeight="200px"
        minWidth="800px"
        onDayClick={(day) => {
          setFilterType('day');
          setFilterDate(day);
        }}
        onGameClick={_onEditGame}
        onGameResults={onGameResults}
        onZoomClick={(weekStartDate) => {
          setFilterType('week');
          setFilterDate(weekStartDate);
        }}
        convertGameToGameCardData={convertGameToGameCardData}
        canEditSchedule={canEditSchedule}
        isNavigating={isNavigating || false}
      />
    </Box>
  );
};

export default MonthView;
