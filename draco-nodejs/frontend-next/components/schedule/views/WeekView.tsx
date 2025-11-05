import React from 'react';
import { eachDayOfInterval } from 'date-fns';
import { ViewComponentProps } from '@/types/schedule';
import CalendarGrid from './CalendarGrid';
import HierarchicalHeader from '../components/HierarchicalHeader';
import WidgetShell from '../../ui/WidgetShell';

const WeekView: React.FC<ViewComponentProps> = ({
  filteredGames,
  canEditSchedule,
  onEditGame,
  onGameResults,
  onEditRecap,
  onViewRecap,
  convertGameToGameCardData,
  timeZone,
  filterType,
  startDate,
  endDate,
  filterDate,
  setFilterType,
  setFilterDate,
  setStartDate,
  setEndDate,
  isNavigating,
  navigateToWeek,
  navigate,
  canEditRecap,
}) => {
  const weekDays =
    startDate && endDate ? eachDayOfInterval({ start: startDate, end: endDate }) : [];

  const goToToday = () => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setDate(today.getDate() - today.getDay());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 6);
    setStartDate(todayStart);
    setEndDate(todayEnd);
    setFilterDate(today);
  };

  // Navigation function for week view
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (navigate) {
      navigate(direction, 'week');
    } else if (navigateToWeek) {
      navigateToWeek(direction);
    }
  };

  return (
    <WidgetShell
      disablePadding
      accent="info"
      sx={{
        overflow: 'hidden',
        minWidth: 'fit-content',
      }}
    >
      <HierarchicalHeader
        filterType={filterType}
        filterDate={filterDate}
        startDate={startDate}
        endDate={endDate}
        isNavigating={isNavigating}
        onFilterTypeChange={setFilterType}
        onFilterDateChange={setFilterDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onNavigate={navigateWeek}
        onGoToToday={goToToday}
        viewMode="calendar"
      />

      {/* Calendar Grid */}
      <CalendarGrid
        gridType="week"
        showZoomColumn={false}
        days={weekDays}
        filteredGames={filteredGames}
        minHeight="300px"
        minWidth="700px"
        onDayClick={(day) => {
          setFilterType('day');
          setFilterDate(day);
        }}
        onGameClick={onEditGame}
        onGameResults={onGameResults}
        onEditRecap={onEditRecap}
        onViewRecap={onViewRecap}
        convertGameToGameCardData={convertGameToGameCardData}
        canEditSchedule={canEditSchedule}
        canEditRecap={canEditRecap}
        isNavigating={isNavigating}
        timeZone={timeZone}
        currentMonthDate={filterDate}
      />
    </WidgetShell>
  );
};

export default WeekView;
