import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getGameStatusShortText } from '../utils/gameUtils';
import { format, parseISO } from 'date-fns';

// Unified Game interface that works for both ScheduleManagement and GameListDisplay
export interface GameCardData {
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
  gameRecaps: Array<{ teamId: string; recap: string }>;
  comment?: string;
}

export interface GameCardProps {
  game: GameCardData;
  layout?: 'vertical' | 'horizontal';
  canEditGames?: boolean;
  onEnterGameResults?: (game: GameCardData) => void;
  canEditRecap?: (game: GameCardData) => boolean;
  onEditRecap?: (game: GameCardData) => void;
  onViewRecap?: (game: GameCardData) => void;
  onClick?: (game: GameCardData) => void;
  showActions?: boolean;
  compact?: boolean;
  calendar?: boolean;
  showDate?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  game,
  layout = 'vertical',
  canEditGames = false,
  onEnterGameResults,
  canEditRecap,
  onEditRecap,
  onViewRecap,
  onClick,
  showActions = true,
  compact = false,
  calendar = false,
  showDate = false,
}) => {
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

  const handleCardClick = () => {
    if (onClick) {
      onClick(game);
    }
  };

  const handleGameResultsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnterGameResults) {
      onEnterGameResults(game);
    }
  };

  const handleRecapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditRecap) {
      onEditRecap(game);
    } else if (onViewRecap) {
      onViewRecap(game);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: layout === 'vertical' ? 2 : 0,
        mr: layout === 'horizontal' ? 2 : 0,
        borderRadius: calendar ? 1 : 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        minWidth: calendar ? '100%' : layout === 'horizontal' ? 240 : 'auto',
        maxWidth: calendar ? '100%' : layout === 'horizontal' ? 280 : 'auto',
        width: calendar ? '100%' : layout === 'horizontal' ? 'auto' : 'auto',
        flexShrink: calendar ? 1 : layout === 'horizontal' ? 0 : 1,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: onClick ? 'translateY(-2px)' : 'none',
          boxShadow: onClick ? '0 8px 25px rgba(0,0,0,0.12)' : 'none',
          borderColor: onClick ? 'primary.main' : 'divider',
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent
        sx={{
          p: layout === 'vertical' && showDate ? 0.5 : calendar ? 0.5 : compact ? 1 : 2,
          position: 'relative',
        }}
      >
        {layout === 'vertical' && showDate && game.date && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
            {format(parseISO(game.date), 'EEE MMM d')}
          </Typography>
        )}
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
              {showActions && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {canEditGames && onEnterGameResults && (
                    <Tooltip title="Enter Game Results">
                      <IconButton
                        size="small"
                        onClick={handleGameResultsClick}
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
                        onClick={handleRecapClick}
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
                          onClick={handleRecapClick}
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
              )}
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
                <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }} noWrap>
                  {game.homeTeamName}
                </Typography>
              </Box>

              {/* Scores column */}
              {game.gameStatus !== 0 && game.gameStatus !== 2 && game.gameStatus !== 5 && (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    color={game.awayScore > game.homeScore ? 'success.main' : 'text.primary'}
                    sx={{ mb: 0.5 }}
                  >
                    {game.awayScore}
                  </Typography>
                  <Typography
                    variant="body1"
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
              {showActions && (
                <>
                  {canEditGames && onEnterGameResults && (
                    <Tooltip title="Enter Game Results">
                      <IconButton
                        size="small"
                        onClick={handleGameResultsClick}
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
                        onClick={handleRecapClick}
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
                          onClick={handleRecapClick}
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
                </>
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
                  variant="body1"
                  fontWeight={700}
                  color={game.awayScore > game.homeScore ? 'success.main' : 'text.primary'}
                  sx={{ mb: 0.5 }}
                >
                  {game.awayScore}
                </Typography>
                <Typography
                  variant="body1"
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
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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

export default GameCard;
