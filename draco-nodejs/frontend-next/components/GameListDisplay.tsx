import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Paper,
  IconButton as MuiIconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getGameStatusShortText } from '../utils/gameUtils';

export interface GameRecap {
  teamId: string;
  recap: string;
}

export interface Game {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameStatus: number;
  gameStatusText: string;
  gameStatusShortText?: string;
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  fieldShortName: string | null;
  hasGameRecap: boolean;
  gameRecaps: GameRecap[];
}

export interface GameListSection {
  title: string;
  games: Game[];
}

export interface GameListDisplayProps {
  sections: GameListSection[];
  emptyMessage?: string;
  canEditGames?: boolean;
  onEditGame?: (game: Game) => void;
  canEditRecap?: (game: Game) => boolean;
  onEditRecap?: (game: Game) => void;
  onViewRecap?: (game: Game) => void;
  layout?: 'vertical' | 'horizontal';
}

const GameListDisplay: React.FC<GameListDisplayProps> = ({
  sections,
  emptyMessage = 'No games to display.',
  canEditGames = false,
  onEditGame,
  canEditRecap,
  onEditRecap,
  onViewRecap,
  layout = 'vertical',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update navigation buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && layout === 'horizontal') {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Initial check

      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [layout, sections]);

  // Render a single game card
  const renderGame = (game: Game) => {
    let localTime = '';
    try {
      if (game.date) {
        const localDateString = game.date.replace('Z', '');
        const dateObj = new Date(localDateString);
        localTime = dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        localTime = 'TBD';
      }
    } catch {
      localTime = 'TBD';
    }

    return (
      <Card
        key={game.id}
        variant="outlined"
        sx={{
          mb: layout === 'vertical' ? 2 : 0,
          mr: layout === 'horizontal' ? 2 : 0,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          minWidth: layout === 'horizontal' ? 240 : 'auto',
          maxWidth: layout === 'horizontal' ? 280 : 'auto',
          width: layout === 'horizontal' ? 'auto' : 'auto',
          flexShrink: layout === 'horizontal' ? 0 : 1,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
            borderColor: 'primary.main',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {layout === 'horizontal' ? (
            // Horizontal layout with time/field below teams
            <Box>
              {/* Top row: League and actions */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  {game.leagueName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {canEditGames && onEditGame && (
                    <Tooltip title="Enter Game Results">
                      <IconButton
                        size="small"
                        onClick={() => onEditGame(game)}
                        sx={{
                          color: 'primary.main',
                          p: 0.5,
                          '&:hover': {
                            color: 'primary.dark',
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {/* Recap button for completed games */}
                  {game.gameStatus === 1 && canEditRecap && canEditRecap(game) && onEditRecap ? (
                    <Tooltip title={game.hasGameRecap ? 'Edit Summary' : 'Enter Summary'}>
                      <IconButton
                        size="small"
                        onClick={() => onEditRecap(game)}
                        sx={{
                          color: game.hasGameRecap ? 'warning.main' : 'primary.main',
                          p: 0.5,
                          '&:hover': {
                            color: game.hasGameRecap ? 'warning.dark' : 'primary.dark',
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    game.gameStatus === 1 &&
                    game.hasGameRecap &&
                    onViewRecap && (
                      <Tooltip title="View Game Summary">
                        <IconButton
                          size="small"
                          onClick={() => onViewRecap(game)}
                          sx={{
                            color: 'primary.main',
                            p: 0.5,
                            '&:hover': {
                              color: 'primary.dark',
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  )}
                </Box>
              </Box>

              {/* Teams and scores row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary', mb: 0.5 }}
                    noWrap
                  >
                    {game.awayTeamName}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary' }}
                    noWrap
                  >
                    {game.homeTeamName}
                  </Typography>
                </Box>

                {/* Scores column */}
                {game.gameStatus !== 0 && game.gameStatus !== 2 && game.gameStatus !== 5 && (
                  <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={game.awayScore > game.homeScore ? 'success.main' : 'text.primary'}
                      sx={{ mb: 0.5 }}
                    >
                      {game.awayScore}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={game.homeScore > game.awayScore ? 'success.main' : 'text.primary'}
                    >
                      {game.homeScore}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Time and field row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {game.gameStatus === 0 ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {localTime}
                    </Typography>
                    {(game.fieldName || game.fieldShortName) && (
                      <Typography variant="body2" color="text.secondary">
                        {game.fieldShortName || game.fieldName}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {game.gameStatusText}
                  </Typography>
                )}
              </Box>
            </Box>
          ) : (
            // Original vertical layout
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: 1.5,
                alignItems: 'start',
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ pt: 0.5 }}
                >
                  {game.leagueName}
                </Typography>
                {canEditGames && onEditGame && (
                  <Tooltip title="Enter Game Results">
                    <IconButton
                      size="small"
                      onClick={() => onEditGame(game)}
                      sx={{
                        color: 'primary.main',
                        mt: 1,
                        p: 0.5,
                        '&:hover': {
                          color: 'primary.dark',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {/* Recap button for completed games, only if canEditRecap is true */}
                {game.gameStatus === 1 && canEditRecap && canEditRecap(game) && onEditRecap ? (
                  <Tooltip title={game.hasGameRecap ? 'Edit Summary' : 'Enter Summary'}>
                    <IconButton
                      size="small"
                      onClick={() => onEditRecap(game)}
                      sx={{
                        color: game.hasGameRecap ? 'warning.main' : 'primary.main',
                        mt: 1,
                        ml: 1,
                        p: 0.5,
                        '&:hover': {
                          color: game.hasGameRecap ? 'warning.dark' : 'primary.dark',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  game.gameStatus === 1 &&
                  game.hasGameRecap &&
                  onViewRecap && (
                    <Tooltip title="View Game Summary">
                      <IconButton
                        size="small"
                        onClick={() => onViewRecap(game)}
                        sx={{
                          color: 'primary.main',
                          mt: 1,
                          ml: 1,
                          p: 0.5,
                          '&:hover': {
                            color: 'primary.dark',
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ color: 'text.primary', mb: 0.5 }}
                  noWrap
                >
                  {game.awayTeamName}
                </Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }} noWrap>
                  {game.homeTeamName}
                </Typography>
              </Box>
              {/* Scores column */}
              {game.gameStatus !== 0 && game.gameStatus !== 2 && game.gameStatus !== 5 ? (
                <Box textAlign="center" sx={{ minWidth: 'auto', width: 'auto' }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={game.awayScore > game.homeScore ? 'success.main' : 'text.primary'}
                    sx={{ mb: 0.5 }}
                  >
                    {game.awayScore}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={game.homeScore > game.awayScore ? 'success.main' : 'text.primary'}
                  >
                    {game.homeScore}
                  </Typography>
                </Box>
              ) : (
                <Box />
              )}
              {/* Game status badge column (far right) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: 'auto',
                }}
              >
                {game.gameStatus !== 0 ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      background: 'primary.main',
                      color: 'text.secondary',
                      borderRadius: 1,
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '4px 12px',
                      margin: 0,
                    }}
                  >
                    {game.gameStatusShortText || getGameStatusShortText(game.gameStatus)}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                      {localTime}
                    </Typography>
                    {(game.fieldName || game.fieldShortName) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {game.fieldShortName || game.fieldName}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Paper
      sx={{
        p: 4,
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: 0,
      }}
    >
      {sections.map((section) => (
        <Box key={section.title} mb={1.5}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <EventIcon sx={{ color: 'warning.main' }} />
            {section.title}
          </Typography>
          {section.games.length > 0 ? (
            <Box sx={{ position: 'relative', width: '100%' }}>
              {/* Navigation Buttons - Only show for horizontal layout */}
              {layout === 'horizontal' && (
                <>
                  {canScrollLeft && (
                    <MuiIconButton
                      onClick={scrollLeft}
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': {
                          bgcolor: 'background.paper',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        },
                      }}
                      size="small"
                    >
                      <ChevronLeftIcon />
                    </MuiIconButton>
                  )}
                  {canScrollRight && (
                    <MuiIconButton
                      onClick={scrollRight}
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': {
                          bgcolor: 'background.paper',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        },
                      }}
                      size="small"
                    >
                      <ChevronRightIcon />
                    </MuiIconButton>
                  )}
                </>
              )}

              <Box
                ref={scrollContainerRef}
                sx={{
                  display: layout === 'horizontal' ? 'flex' : 'block',
                  flexWrap: 'nowrap',
                  gap: layout === 'horizontal' ? 2 : 0,
                  overflowX: layout === 'horizontal' ? 'auto' : 'visible',
                  overflowY: 'hidden',
                  pb: layout === 'horizontal' ? 1 : 0,
                  pt: layout === 'horizontal' ? 0.5 : 0,
                  width: '100%',
                  scrollBehavior: 'smooth',
                  // Hide scrollbars but keep functionality
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                  // Touch scrolling improvements
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {layout === 'horizontal'
                  ? section.games.map(renderGame)
                  : section.games.map((game, index) => (
                      <Box key={game.id} sx={{ mt: index === 0 ? 0.5 : 0 }}>
                        {renderGame(game)}
                      </Box>
                    ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" mt={2}>
              {emptyMessage}
            </Typography>
          )}
        </Box>
      ))}
    </Paper>
  );
};

export default GameListDisplay;
