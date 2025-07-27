import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addYears,
  subYears,
} from 'date-fns';
import { ViewComponentProps } from '@/types/schedule';
import HierarchicalHeader from '../components/HierarchicalHeader';

const YearView: React.FC<ViewComponentProps> = ({
  filteredGames,
  canEditSchedule,
  onEditGame: _onEditGame,
  onGameResults: _onGameResults,
  convertGameToGameCardData: _convertGameToGameCardData,
  filterDate,
  setFilterDate,
  setFilterType,
  navigate,
  isNavigating,
}) => {
  const [currentYear, setCurrentYear] = React.useState(filterDate);

  // Sync currentYear with filterDate when it changes
  React.useEffect(() => {
    setCurrentYear(filterDate);
  }, [filterDate]);

  const navigateYear = (direction: 'prev' | 'next') => {
    if (navigate) {
      navigate(direction, 'year');
    } else {
      // Fallback to local navigation
      const newYear = direction === 'prev' ? subYears(currentYear, 1) : addYears(currentYear, 1);
      setCurrentYear(newYear);
      setFilterDate(newYear);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today);
    setFilterDate(today);
  };

  const renderYearView = () => {
    const year = currentYear.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthName = format(monthStart, 'MMMM');

      // Get games for this month
      const monthGames = filteredGames.filter((game) => {
        if (!game.gameDate) return false;
        const gameDate = parseISO(game.gameDate);
        return gameDate >= monthStart && gameDate <= monthEnd;
      });

      // Group games by day
      const gamesByDay = new Map<number, typeof filteredGames>();
      monthGames.forEach((game) => {
        if (game.gameDate) {
          const gameDate = new Date(game.gameDate);
          const day = gameDate.getDate();
          if (!gamesByDay.has(day)) {
            gamesByDay.set(day, []);
          }
          gamesByDay.get(day)!.push(game);
        }
      });

      // Create calendar days for this month
      const days: React.ReactElement[] = [];
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const startDate = startOfWeek(firstDayOfMonth);
      const endDate = endOfWeek(lastDayOfMonth);

      const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });

      calendarDays.forEach((day, index) => {
        const isCurrentMonth = day.getMonth() === month;
        const dayNumber = day.getDate();
        const dayGames = isCurrentMonth ? gamesByDay.get(dayNumber) || [] : [];
        const gameCount = dayGames.length;

        days.push(
          <Box
            key={index}
            sx={{
              width: '14.28%',
              height: '60px',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              bgcolor: isCurrentMonth ? 'white' : 'grey.100',
              position: 'relative',
              cursor: canEditSchedule ? 'pointer' : 'default',
              '&:hover': canEditSchedule
                ? {
                    bgcolor: isCurrentMonth ? 'primary.50' : 'grey.200',
                    '& .game-count': {
                      transform: 'scale(1.1)',
                    },
                  }
                : {},
            }}
            onClick={
              canEditSchedule
                ? () => {
                    setFilterType('day');
                    setFilterDate(day);
                  }
                : undefined
            }
            title={
              canEditSchedule ? `View ${format(day, 'EEEE, MMMM d, yyyy')} in day view` : undefined
            }
          >
            <Typography
              variant="body2"
              sx={{
                color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
                fontSize: '0.75rem',
                mt: 0.5,
              }}
            >
              {dayNumber}
            </Typography>
            {gameCount > 0 && (
              <Box
                className="game-count"
                sx={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                {gameCount}
              </Box>
            )}
          </Box>,
        );
      });

      months.push(
        <Box key={month} sx={{ mb: 4, width: '300px' }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: canEditSchedule ? 'pointer' : 'default',
              color: 'primary.main',
              '&:hover': canEditSchedule
                ? {
                    color: 'primary.dark',
                    textDecoration: 'underline',
                  }
                : {},
            }}
            onClick={
              canEditSchedule
                ? () => {
                    setFilterType('month');
                    setFilterDate(new Date(year, month, 1));
                  }
                : undefined
            }
            title={canEditSchedule ? `View ${monthName} ${year} in month view` : undefined}
          >
            {monthName}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Box
                key={index}
                sx={{
                  width: '14.28%',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                }}
              >
                {day}
              </Box>
            ))}
            {/* Calendar days */}
            {days}
          </Box>
        </Box>,
      );
    }

    return months;
  };

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
        filterType="year"
        filterDate={currentYear}
        isNavigating={isNavigating || false}
        onFilterTypeChange={setFilterType}
        onFilterDateChange={setFilterDate}
        onNavigate={navigateYear}
        onGoToToday={goToToday}
        viewMode="calendar"
      />

      {/* Year Grid */}
      <Box sx={{ p: 2, opacity: isNavigating ? 0.7 : 1, transition: 'opacity 0.2s ease' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{renderYearView()}</Box>
      </Box>
    </Box>
  );
};

export default YearView;
