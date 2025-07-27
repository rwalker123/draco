import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format, addDays, subDays, isToday as isTodayFn, isSameDay } from 'date-fns';
import { ViewComponentProps } from '@/types/schedule';
import GameCard from '../../GameCard';
import HierarchicalHeader from '../components/HierarchicalHeader';

interface DayListViewProps extends ViewComponentProps {
  viewMode: 'calendar' | 'list';
}

const DayListView: React.FC<DayListViewProps> = ({
  filteredGames,
  canEditSchedule,
  onEditGame: _onEditGame,
  onGameResults,
  convertGameToGameCardData,
  filterType,
  filterDate,
  setFilterDate,
  setFilterType,
  startDate: _startDate,
  endDate: _endDate,
  setStartDate,
  setEndDate,
  navigateToWeek: _navigateToWeek,
  navigate,
  isNavigating,
  viewMode,
}) => {
  const [currentDate, setCurrentDate] = React.useState(filterDate);

  // Sync currentDate with filterDate when it changes
  React.useEffect(() => {
    setCurrentDate(filterDate);
  }, [filterDate]);

  const navigateDay = (direction: 'prev' | 'next') => {
    if (navigate) {
      navigate(direction, 'day');
      const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
      setCurrentDate(newDate);
    } else {
      // Fallback to local navigation
      const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
      setCurrentDate(newDate);
      setFilterDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setFilterDate(today);
  };

  const navigateList = (direction: 'prev' | 'next') => {
    if (navigate) {
      navigate(direction, filterType);
    } else if (_navigateToWeek) {
      _navigateToWeek(direction);
    }
  };

  // For day view: get games for the current day
  const getGamesForDay = () => {
    return filteredGames.filter((game) => {
      const gameDate = new Date(game.gameDate);
      return isSameDay(gameDate, currentDate);
    });
  };

  // For list view: group games by date
  const getGamesByDate = () => {
    return filteredGames.reduce(
      (acc, game) => {
        const gameDate = new Date(game.gameDate);
        const dateKey = format(gameDate, 'yyyy-MM-dd');

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(game);
        return acc;
      },
      {} as Record<string, typeof filteredGames>,
    );
  };

  const isDayView = filterType === 'day';
  const dayGames = isDayView ? getGamesForDay() : [];
  const gamesByDate = isDayView ? null : getGamesByDate();
  const sortedDates = isDayView ? null : Object.keys(gamesByDate!).sort();
  const isToday = isDayView ? isTodayFn(currentDate) : false;

  const renderDayContent = () => {
    if (dayGames.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          No games scheduled for this day
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {dayGames.map((game) => (
          <GameCard
            key={game.id}
            game={convertGameToGameCardData(game)}
            layout="horizontal"
            compact={false}
            calendar={false}
            showDate={false}
            canEditGames={canEditSchedule}
            onEnterGameResults={canEditSchedule ? () => onGameResults(game) : undefined}
            onClick={canEditSchedule ? () => _onEditGame(game) : undefined}
          />
        ))}
      </Box>
    );
  };

  const renderListContent = () => {
    if (filteredGames.length === 0) {
      return (
        <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          No games found for the selected time period
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sortedDates!.map((dateKey) => {
          const games = gamesByDate![dateKey];
          const gameDate = new Date(dateKey);
          const isTodayDate = format(gameDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Paper
              key={dateKey}
              sx={{
                p: 2,
                backgroundColor: isTodayDate ? 'primary.light' : 'background.paper',
                border: isTodayDate ? 2 : 1,
                borderColor: isTodayDate ? 'primary.main' : 'divider',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: isTodayDate ? 'bold' : 'normal',
                  mb: 2,
                  color: isTodayDate ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {format(gameDate, 'EEEE, MMMM d, yyyy')}
                {isTodayDate && (
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ ml: 1, color: 'primary.light' }}
                  >
                    (Today)
                  </Typography>
                )}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={convertGameToGameCardData(game)}
                    layout="horizontal"
                    compact={true}
                    calendar={false}
                    showDate={false}
                    canEditGames={canEditSchedule}
                    onEnterGameResults={canEditSchedule ? () => onGameResults(game) : undefined}
                    onClick={canEditSchedule ? () => _onEditGame(game) : undefined}
                  />
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
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
        filterType={filterType}
        filterDate={isDayView ? currentDate : filterDate}
        startDate={_startDate}
        endDate={_endDate}
        isNavigating={isNavigating || false}
        onFilterTypeChange={setFilterType}
        onFilterDateChange={setFilterDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onNavigate={isDayView ? navigateDay : navigateList}
        onGoToToday={goToToday}
        viewMode={viewMode}
      />

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: '800px',
          mx: 'auto',
          width: '100%',
          p: 2,
          opacity: navigate && isNavigating ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {isDayView ? (
          <Paper
            sx={{
              p: 2,
              backgroundColor: isToday ? 'primary.light' : 'background.paper',
              border: isToday ? 2 : 1,
              borderColor: isToday ? 'primary.main' : 'divider',
            }}
          >
            {renderDayContent()}
          </Paper>
        ) : (
          renderListContent()
        )}
      </Box>
    </Box>
  );
};

export default DayListView;
