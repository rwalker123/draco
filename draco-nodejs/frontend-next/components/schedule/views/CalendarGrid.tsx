import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { format, isSameDay } from 'date-fns';
import { Game } from '@/types/schedule';
import GameCard from '../../GameCard';
import { GameCardData } from '../../GameCard';

export interface CalendarGridProps {
  // Grid configuration
  gridType: 'week' | 'month';
  showZoomColumn?: boolean;

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

  // Game card conversion
  convertGameToGameCardData: (game: Game) => GameCardData;

  // Permissions
  canEditSchedule: boolean;

  // Navigation state
  isNavigating?: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  gridType: _gridType,
  showZoomColumn = false,
  days,
  filteredGames,
  minHeight = '300px',
  minWidth = '700px',
  onDayClick,
  onGameClick,
  onGameResults,
  onZoomClick,
  convertGameToGameCardData,
  canEditSchedule,
  isNavigating = false,
}) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const columns = showZoomColumn ? `40px repeat(7, 1fr)` : `repeat(7, 1fr)`;

  // Common styling for consistent appearance
  const gridStyles = {
    border: '2px solid',
    borderColor: 'grey.400',
    borderRadius: 1,
    overflow: 'hidden' as const,
    minWidth,
    width: '100%',
  };

  const headerStyles = {
    display: 'grid' as const,
    gridTemplateColumns: columns,
    borderBottom: '2px solid',
    borderBottomColor: 'grey.400',
    minWidth,
    width: '100%',
  };

  const dayHeaderStyles = {
    p: 1,
    textAlign: 'center' as const,
    backgroundColor: 'primary.main',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 0,
    overflow: 'hidden' as const,
  };

  const dayCellStyles = {
    minHeight,
    backgroundColor: 'background.paper',
    cursor: onDayClick ? ('pointer' as const) : ('default' as const),
    minWidth: 0,
    overflow: 'hidden' as const,
    '&:hover': onDayClick
      ? {
          backgroundColor: 'grey.100',
        }
      : {},
  };

  const getGamesForDay = (day: Date) => {
    return filteredGames.filter((game) => {
      const gameDate = new Date(game.gameDate);
      return isSameDay(gameDate, day);
    });
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
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
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
              borderRightColor: 'primary.dark',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
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

              return (
                <React.Fragment key={weekIndex}>
                  {/* Zoom Button for this week */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid',
                      borderRightColor: 'grey.300',
                      borderBottom:
                        weekIndex < Math.ceil(days.length / 7) - 1 ? '1px solid' : 'none',
                      borderBottomColor: 'grey.300',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Tooltip
                      title={`View week of ${format(weekStartDate, 'MMM dd')} - ${format(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000, 'MMM dd, yyyy')} in week view`}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onZoomClick?.(weekStartDate)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Days for this week */}
                  {weekDays.map((day) => (
                    <Box
                      key={day.toISOString()}
                      sx={{
                        ...dayCellStyles,
                        borderRight: '1px solid',
                        borderRightColor: 'grey.300',
                        borderBottom: '1px solid',
                        borderBottomColor: 'grey.300',
                        backgroundColor: isSameDay(day, new Date())
                          ? 'primary.light'
                          : 'background.paper',
                        border: isSameDay(day, new Date()) ? 2 : 1,
                        borderColor: isSameDay(day, new Date()) ? 'primary.main' : 'grey.300',
                      }}
                      onClick={() => onDayClick?.(day)}
                      title={
                        onDayClick
                          ? `View ${format(day, 'EEEE, MMMM d, yyyy')} in day view`
                          : undefined
                      }
                    >
                      {/* Day Number */}
                      <Box
                        sx={{
                          py: 1,
                          px: 1,
                          backgroundColor: 'grey.50',
                          borderBottom: '1px solid',
                          borderBottomColor: 'divider',
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                          }}
                        >
                          {format(day, 'd')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {format(day, 'MMM')}
                        </Typography>
                      </Box>

                      {/* Games for this day */}
                      <Box sx={{ p: 1, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                        {getGamesForDay(day).length > 0 ? (
                          getGamesForDay(day).map((game) => (
                            <Box
                              key={game.id}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering day view
                                onGameClick?.(game);
                              }}
                            >
                              <GameCard
                                game={convertGameToGameCardData(game)}
                                layout="vertical"
                                compact={true}
                                calendar={true}
                                canEditGames={canEditSchedule}
                                onEnterGameResults={
                                  canEditSchedule && onGameResults
                                    ? (gameCardData) => {
                                        // Find the original game by ID and call onGameResults
                                        const originalGame = getGamesForDay(day).find(
                                          (g) => g.id === gameCardData.id,
                                        );
                                        if (originalGame) {
                                          onGameResults(originalGame);
                                        }
                                      }
                                    : undefined
                                }
                                showActions={canEditSchedule}
                                onClick={() => onGameClick?.(game)}
                              />
                            </Box>
                          ))
                        ) : (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ textAlign: 'center', mt: 2 }}
                          >
                            No games
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </React.Fragment>
              );
            })
          : // Week view without zoom column
            days.map((day, index) => (
              <Box
                key={day.toISOString()}
                sx={{
                  ...dayCellStyles,
                  borderRight: index < 6 ? '1px solid' : 'none',
                  borderRightColor: 'grey.300',
                  borderBottom: '1px solid',
                  borderBottomColor: 'grey.300',
                  backgroundColor: isSameDay(day, new Date())
                    ? 'primary.light'
                    : 'background.paper',
                  border: isSameDay(day, new Date()) ? 2 : 1,
                  borderColor: isSameDay(day, new Date()) ? 'primary.main' : 'grey.300',
                }}
                onClick={() => onDayClick?.(day)}
                title={
                  onDayClick ? `View ${format(day, 'EEEE, MMMM d, yyyy')} in day view` : undefined
                }
              >
                {/* Day Number */}
                <Box
                  sx={{
                    py: 1,
                    px: 1,
                    backgroundColor: 'grey.50',
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {format(day, 'MMM')}
                  </Typography>
                </Box>

                {/* Games for this day */}
                <Box sx={{ p: 1, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                  {getGamesForDay(day).length > 0 ? (
                    getGamesForDay(day).map((game) => (
                      <Box
                        key={game.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering day view
                          onGameClick?.(game);
                        }}
                      >
                        <GameCard
                          game={convertGameToGameCardData(game)}
                          layout="vertical"
                          compact={true}
                          calendar={true}
                          canEditGames={canEditSchedule}
                          onEnterGameResults={
                            canEditSchedule && onGameResults
                              ? (gameCardData) => {
                                  // Find the original game by ID and call onGameResults
                                  const originalGame = getGamesForDay(day).find(
                                    (g) => g.id === gameCardData.id,
                                  );
                                  if (originalGame) {
                                    onGameResults(originalGame);
                                  }
                                }
                              : undefined
                          }
                          showActions={canEditSchedule}
                          onClick={() => onGameClick?.(game)}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ textAlign: 'center', mt: 2 }}
                    >
                      No games
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
      </Box>
    </Box>
  );
};

export default CalendarGrid;
