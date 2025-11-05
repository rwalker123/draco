import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { Game } from '@/types/schedule';
import GameCard from '../../GameCard';
import { GameCardData } from '../../GameCard';
import {
  formatDateInTimezone,
  getDateKeyInTimezone,
  isSameDayInTimezone,
} from '../../../utils/dateUtils';
import { alpha, useTheme } from '@mui/material/styles';

export interface CalendarGridProps {
  // Grid configuration
  gridType: 'week' | 'month';
  showZoomColumn?: boolean;
  currentMonthDate?: Date;

  // Data
  days: Date[];
  filteredGames: Game[];

  // Styling
  minHeight?: string;
  minWidth?: string;

  // Callbacks
  onDayClick?: (day: Date) => void;
  onGameClick?: (game: Game) => void;
  onGameResults?: (game: Game) => void;
  onZoomClick?: (weekStartDate: Date) => void;
  onEditRecap?: (game: Game) => void;
  onViewRecap?: (game: Game) => void;

  // Game card conversion
  convertGameToGameCardData: (game: Game) => GameCardData;

  // Permissions
  canEditSchedule: boolean;
  canEditRecap?: (game: GameCardData) => boolean;

  // Navigation state
  isNavigating?: boolean;

  timeZone: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  gridType: _gridType,
  showZoomColumn = false,
  currentMonthDate,
  days,
  filteredGames,
  minHeight = '300px',
  minWidth = '700px',
  onDayClick,
  onGameClick,
  onGameResults,
  onZoomClick,
  onEditRecap,
  onViewRecap,
  convertGameToGameCardData,
  canEditSchedule,
  canEditRecap,
  isNavigating = false,
  timeZone,
}) => {
  const theme = useTheme();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const columns = showZoomColumn ? `40px repeat(7, 1fr)` : `repeat(7, 1fr)`;
  const borderColor = theme.palette.widget.border;
  const headerBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.45 : 0.12);
  const headerText = theme.palette.widget.headerText;
  const cellHoverBg = alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'dark' ? 0.25 : 0.08,
  );
  const todayBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.12);
  const todayBorder = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.8 : 0.45);
  const zoomColumnBg = alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'dark' ? 0.35 : 0.08,
  );

  // Common styling for consistent appearance
  const gridStyles = {
    border: `1px solid ${borderColor}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden' as const,
    minWidth,
    width: '100%',
  };

  const headerStyles = {
    display: 'grid' as const,
    gridTemplateColumns: columns,
    borderBottom: `1px solid ${borderColor}`,
    minWidth,
    width: '100%',
  };

  const dayHeaderStyles = {
    p: 1,
    textAlign: 'center' as const,
    backgroundColor: headerBg,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 0,
    overflow: 'hidden' as const,
  };

  const dayCellStyles = {
    minHeight,
    backgroundColor: theme.palette.widget.surface,
    cursor: onDayClick ? ('pointer' as const) : ('default' as const),
    minWidth: 0,
    overflow: 'hidden' as const,
    '&:hover': onDayClick
      ? {
          backgroundColor: cellHoverBg,
        }
      : {},
  };

  const gamesByDateKey = React.useMemo(() => {
    const map = new Map<string, Game[]>();
    filteredGames.forEach((game) => {
      const key = getDateKeyInTimezone(game.gameDate, timeZone);
      if (!key) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(game);
    });
    return map;
  }, [filteredGames, timeZone]);

  const monthReference = React.useMemo(() => {
    if (!currentMonthDate) {
      return null;
    }

    return {
      month: currentMonthDate.getMonth(),
      year: currentMonthDate.getFullYear(),
    };
  }, [currentMonthDate]);

  const isInCurrentMonth = React.useCallback(
    (day: Date) => {
      if (!monthReference) {
        return true;
      }

      return day.getMonth() === monthReference.month && day.getFullYear() === monthReference.year;
    },
    [monthReference],
  );

  const getGamesForDay = (day: Date) => {
    const dayKey = getDateKeyInTimezone(day, timeZone);
    if (!dayKey) {
      return [];
    }

    return gamesByDateKey.get(dayKey) ?? [];
  };

  return (
    <Box sx={gridStyles}>
      {/* Day Headers Row */}
      <Box sx={headerStyles}>
        {/* Zoom column header if needed */}
        {showZoomColumn && (
          <Box
            sx={{
              height: 40,
              backgroundColor: zoomColumnBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: headerText, fontWeight: 600 }}>
              Zoom
            </Typography>
          </Box>
        )}

        {/* Day Headers */}
        {dayNames.map((day, index) => (
          <Box
            key={day}
            sx={{
              ...dayHeaderStyles,
              borderRight: index < 6 ? '1px solid' : 'none',
              borderRightColor: theme.palette.primary.dark,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: headerText, fontWeight: 600 }}>
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar Content */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: columns,
          opacity: isNavigating ? 0.7 : 1,
          transition: 'opacity 0.2s ease-in-out',
          minWidth,
          width: '100%',
        }}
      >
        {showZoomColumn
          ? // Month view with zoom column
            Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => {
              const weekStart = weekIndex * 7;
              const weekDays = days.slice(weekStart, weekStart + 7);
              const weekStartDate = weekDays[0];
              const weekEndDate = (() => {
                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + 6);
                return date;
              })();

              return (
                <React.Fragment key={weekIndex}>
                  {/* Zoom Button for this week */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: `1px solid ${borderColor}`,
                      borderBottom:
                        weekIndex < Math.ceil(days.length / 7) - 1
                          ? `1px solid ${borderColor}`
                          : 'none',
                      backgroundColor: theme.palette.widget.surface,
                    }}
                  >
                    <Tooltip
                      title={`View week of ${formatDateInTimezone(weekStartDate, timeZone, {
                        month: 'short',
                        day: '2-digit',
                      })} - ${formatDateInTimezone(weekEndDate, timeZone, {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })} in week view`}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onZoomClick?.(weekStartDate)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Days for this week */}
                  {weekDays.map((day) => {
                    const isToday = isSameDayInTimezone(day, new Date(), timeZone);
                    const inCurrentMonth = isInCurrentMonth(day);
                    const dayNumberColor = isToday
                      ? theme.palette.primary.main
                      : inCurrentMonth
                        ? theme.palette.primary.main
                        : theme.palette.text.disabled;

                    return (
                      <Box
                        key={day.toISOString()}
                        sx={{
                          ...dayCellStyles,
                          borderRight: `1px solid ${borderColor}`,
                          borderBottom: `1px solid ${borderColor}`,
                          backgroundColor: isToday ? todayBg : theme.palette.widget.surface,
                          border: isToday ? `1px solid ${todayBorder}` : undefined,
                        }}
                        onClick={() => onDayClick?.(day)}
                        title={
                          onDayClick
                            ? `View ${formatDateInTimezone(day, timeZone, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}`
                            : undefined
                        }
                      >
                        {/* Day Number */}
                        <Box
                          sx={{
                            py: 1,
                            px: 1,
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === 'dark' ? 0.15 : 0.08,
                            ),
                            borderBottom: `1px solid ${borderColor}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 'bold',
                              color: dayNumberColor,
                            }}
                          >
                            {formatDateInTimezone(day, timeZone, { day: 'numeric' })}
                          </Typography>
                        </Box>

                        {/* Games for this day */}
                        <Box sx={{ p: 1, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                          {getGamesForDay(day).length > 0 ? (
                            getGamesForDay(day).map((game) => {
                              const gameCardData = convertGameToGameCardData(game);
                              const showActions =
                                canEditSchedule ||
                                (onViewRecap && gameCardData.hasGameRecap) ||
                                (canEditRecap?.(gameCardData) ?? false);

                              return (
                                <Box
                                  key={game.id}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering day view
                                    onGameClick?.(game);
                                  }}
                                >
                                  <GameCard
                                    game={gameCardData}
                                    layout="vertical"
                                    compact={true}
                                    calendar={true}
                                    canEditGames={canEditSchedule}
                                    onEnterGameResults={
                                      canEditSchedule && onGameResults
                                        ? (cardData) => {
                                            // Find the original game by ID and call onGameResults
                                            const originalGame = getGamesForDay(day).find(
                                              (g) => g.id === cardData.id,
                                            );
                                            if (originalGame) {
                                              onGameResults(originalGame);
                                            }
                                          }
                                        : undefined
                                    }
                                    canEditRecap={canEditRecap}
                                    onEditRecap={
                                      canEditRecap && onEditRecap
                                        ? () => onEditRecap(game)
                                        : undefined
                                    }
                                    onViewRecap={
                                      onViewRecap && gameCardData.hasGameRecap
                                        ? () => onViewRecap(game)
                                        : undefined
                                    }
                                    showActions={showActions}
                                    onClick={() => onGameClick?.(game)}
                                    timeZone={timeZone}
                                  />
                                </Box>
                              );
                            })
                          ) : (
                            <Typography
                              variant="body2"
                              color={theme.palette.widget.supportingText}
                              sx={{ textAlign: 'center', mt: 2 }}
                            >
                              No games
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </React.Fragment>
              );
            })
          : // Week view without zoom column
            days.map((day, index) => {
              const isToday = isSameDayInTimezone(day, new Date(), timeZone);
              const inCurrentMonth = isInCurrentMonth(day);
              const dayNumberColor = isToday
                ? theme.palette.primary.main
                : inCurrentMonth
                  ? theme.palette.primary.main
                  : theme.palette.text.disabled;

              return (
                <Box
                  key={day.toISOString()}
                  sx={{
                    ...dayCellStyles,
                    borderRight: index < 6 ? `1px solid ${borderColor}` : 'none',
                    borderBottom: `1px solid ${borderColor}`,
                    backgroundColor: isToday ? todayBg : theme.palette.widget.surface,
                    border: isToday ? `1px solid ${todayBorder}` : undefined,
                  }}
                  onClick={() => onDayClick?.(day)}
                  title={
                    onDayClick
                      ? `View ${formatDateInTimezone(day, timeZone, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })} in day view`
                      : undefined
                  }
                >
                  {/* Day Number */}
                  <Box
                    sx={{
                      py: 1,
                      px: 1,
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.15 : 0.08,
                      ),
                      borderBottom: `1px solid ${borderColor}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: dayNumberColor,
                      }}
                    >
                      {formatDateInTimezone(day, timeZone, { day: 'numeric' })}
                    </Typography>
                  </Box>

                  {/* Games for this day */}
                  <Box sx={{ p: 1, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    {getGamesForDay(day).length > 0 ? (
                      getGamesForDay(day).map((game) => {
                        const gameCardData = convertGameToGameCardData(game);
                        const showActions =
                          canEditSchedule ||
                          (onViewRecap && gameCardData.hasGameRecap) ||
                          (canEditRecap?.(gameCardData) ?? false);

                        return (
                          <Box
                            key={game.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onGameClick?.(game);
                            }}
                          >
                            <GameCard
                              game={gameCardData}
                              layout="vertical"
                              compact={true}
                              calendar={true}
                              canEditGames={canEditSchedule}
                              onEnterGameResults={
                                canEditSchedule && onGameResults
                                  ? (cardData) => {
                                      const originalGame = getGamesForDay(day).find(
                                        (g) => g.id === cardData.id,
                                      );
                                      if (originalGame) {
                                        onGameResults(originalGame);
                                      }
                                    }
                                  : undefined
                              }
                              canEditRecap={canEditRecap}
                              onEditRecap={
                                canEditRecap && onEditRecap ? () => onEditRecap(game) : undefined
                              }
                              onViewRecap={
                                onViewRecap && gameCardData.hasGameRecap
                                  ? () => onViewRecap(game)
                                  : undefined
                              }
                              showActions={showActions}
                              onClick={() => onGameClick?.(game)}
                              timeZone={timeZone}
                            />
                          </Box>
                        );
                      })
                    ) : (
                      <Typography
                        variant="body2"
                        color={theme.palette.widget.supportingText}
                        sx={{ textAlign: 'center', mt: 2 }}
                      >
                        No games
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
      </Box>
    </Box>
  );
};

export default CalendarGrid;
