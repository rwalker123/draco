import React from 'react';
import { Box, Typography } from '@mui/material';
import { startOfWeek, endOfWeek, eachDayOfInterval, addYears, subYears } from 'date-fns';
import { ViewComponentProps } from '@/types/schedule';
import HierarchicalHeader from '../components/HierarchicalHeader';
import {
  formatDateInTimezone,
  getDateKeyInTimezone,
  isSameDayInTimezone,
} from '../../../utils/dateUtils';
import WidgetShell from '../../ui/WidgetShell';
import { alpha, useTheme } from '@mui/material/styles';

const YearView: React.FC<ViewComponentProps> = ({
  filteredGames,
  onEditGame: _onEditGame,
  onGameResults: _onGameResults,
  convertGameToGameCardData: _convertGameToGameCardData,
  timeZone,
  filterDate,
  setFilterDate,
  setFilterType,
  navigate,
  isNavigating,
}) => {
  const theme = useTheme();
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
    const months: React.ReactElement[] = [];
    const today = new Date();
    const dayHeaderBg = alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.45 : 0.12,
    );
    const todayBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.12);
    const todayBorder = alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.8 : 0.45,
    );
    const offMonthBg =
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.widget.surface, 0.3)
        : alpha(theme.palette.widget.supportingText, 0.08);

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthName = formatDateInTimezone(monthStart, timeZone, { month: 'long' });
      const monthKeyPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

      const monthGames = filteredGames.filter((game) => {
        const key = getDateKeyInTimezone(game.gameDate, timeZone);
        return key ? key.startsWith(monthKeyPrefix) : false;
      });

      const gamesByDay = new Map<string, typeof filteredGames>();
      monthGames.forEach((game) => {
        const dateKey = getDateKeyInTimezone(game.gameDate, timeZone);
        if (!dateKey) {
          return;
        }
        if (!gamesByDay.has(dateKey)) {
          gamesByDay.set(dateKey, []);
        }
        gamesByDay.get(dateKey)!.push(game);
      });

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const calendarDays = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
      });

      const dayCells = calendarDays.map((day, index) => {
        const dateKey = getDateKeyInTimezone(day, timeZone);
        const isCurrentMonth = dateKey ? dateKey.startsWith(monthKeyPrefix) : false;
        const dayGames = dateKey ? gamesByDay.get(dateKey) || [] : [];
        const gameCount = dayGames.length;
        const isToday = isSameDayInTimezone(day, today, timeZone);
        const dayNumberLabel = formatDateInTimezone(day, timeZone, { day: 'numeric' });
        const dayTitle = formatDateInTimezone(day, timeZone, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        return (
          <Box
            key={dateKey ?? `${monthKeyPrefix}-${index}`}
            sx={{
              width: '14.28%',
              height: 60,
              borderBottom: `1px solid ${theme.palette.widget.border}`,
              borderRight:
                (index + 1) % 7 === 0 ? 'none' : `1px solid ${theme.palette.widget.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              bgcolor: isToday
                ? todayBg
                : isCurrentMonth
                  ? theme.palette.widget.surface
                  : offMonthBg,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: isCurrentMonth
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.1)
                  : alpha(offMonthBg, 0.85),
                '& .game-count': {
                  transform: 'scale(1.1)',
                },
              },
              border: isToday ? `1px solid ${todayBorder}` : undefined,
            }}
            onClick={() => {
              setFilterType('day');
              setFilterDate(day);
            }}
            title={`View ${dayTitle}`}
          >
            <Typography
              variant="body2"
              sx={{
                color: isToday
                  ? theme.palette.primary.contrastText
                  : isCurrentMonth
                    ? theme.palette.widget.headerText
                    : theme.palette.widget.supportingText,
                fontWeight: isToday ? 'bold' : 'normal',
                fontSize: '0.75rem',
                mt: 0.5,
              }}
            >
              {dayNumberLabel}
            </Typography>
            {gameCount > 0 && (
              <Box
                className="game-count"
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.9 : 0.85,
                  ),
                  color: theme.palette.primary.contrastText,
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
          </Box>
        );
      });

      months.push(
        <Box key={month} sx={{ mb: 4, width: { xs: '100%', sm: 300 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark',
                textDecoration: 'underline',
              },
            }}
            onClick={() => {
              setFilterType('month');
              setFilterDate(new Date(year, month, 1));
            }}
            title={`View ${monthName} ${year} in month view`}
          >
            {monthName}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.widget.border}`,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.widget.surface, 0.8)
                  : theme.palette.widget.surface,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Box
                key={`header-${day}`}
                sx={{
                  width: '14.28%',
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: index < 6 ? `1px solid ${theme.palette.widget.border}` : 'none',
                  borderBottom: `1px solid ${theme.palette.widget.border}`,
                  backgroundColor: dayHeaderBg,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.widget.headerText, fontWeight: 600 }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
            {dayCells}
          </Box>
        </Box>,
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 2, md: 3 },
          justifyContent: 'center',
        }}
      >
        {months}
      </Box>
    );
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
      <Box
        sx={{
          p: 2,
          opacity: isNavigating ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {renderYearView()}
      </Box>
    </WidgetShell>
  );
};

export default YearView;
