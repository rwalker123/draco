import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getGameStatusShortText } from '../utils/gameUtils';
import { format, parseISO } from 'date-fns';
import { formatGameTime } from '../utils/dateUtils';
import RecapButton from './RecapButton';
import { GameStatus, GameType } from '../types/schedule';

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
  gameType?: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
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
  /**
   * Controls width behavior for horizontal layout.
   * - `false` (default): Card fills container width (min: 240px, max: 100%)
   * - `true`: Card fits content width (min: 280px, max: 500px)
   */
  fitContent?: boolean;
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
  fitContent = false,
}) => {
  const localTime = formatGameTime(game.date);

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
        minWidth: calendar ? '100%' : layout === 'horizontal' ? (fitContent ? 280 : 240) : 'auto',
        maxWidth: calendar
          ? '100%'
          : layout === 'horizontal'
            ? fitContent
              ? 500
              : '100%'
            : 'auto',
        width: calendar
          ? '100%'
          : layout === 'horizontal'
            ? fitContent
              ? 'auto'
              : '100%'
            : 'auto',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  {game.leagueName}
                </Typography>
                {(game.gameType === GameType.Playoff ||
                  game.gameType === GameType.RegularSeason) && (
                  <Tooltip title="Playoff Game">
                    <EmojiEventsIcon
                      sx={{
                        color: 'warning.main',
                        fontSize: 16,
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
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
                  <RecapButton
                    game={game}
                    onRecapClick={handleRecapClick}
                    {...(canEditRecap && onEditRecap
                      ? { recapMode: 'edit' as const, canEditRecap, onEditRecap }
                      : onViewRecap
                        ? { recapMode: 'view' as const, onViewRecap }
                        : { recapMode: 'none' as const })}
                  />
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
              {game.gameStatus !== GameStatus.Scheduled &&
              game.gameStatus !== GameStatus.Rainout &&
              game.gameStatus !== GameStatus.DidNotReport ? (
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
              ) : game.gameStatus !== GameStatus.Scheduled ? (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    {game.gameStatusText}
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {localTime}
                  </Typography>
                  {(game.fieldName || game.fieldShortName) && (
                    <Typography variant="body2" color="text.secondary">
                      {game.fieldName || game.fieldShortName}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          // Original vertical layout
          <Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: 1.5,
                alignItems: 'start',
                mb: 1,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                    {game.leagueName}
                  </Typography>
                  {(game.gameType === GameType.Playoff ||
                    game.gameType === GameType.RegularSeason) && (
                    <Tooltip title="Playoff Game">
                      <EmojiEventsIcon
                        sx={{
                          color: 'warning.main',
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
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
                    <RecapButton
                      game={game}
                      onRecapClick={handleRecapClick}
                      sx={{ mt: 1, ml: 1 }}
                      {...(canEditRecap && onEditRecap
                        ? { recapMode: 'edit' as const, canEditRecap, onEditRecap }
                        : onViewRecap
                          ? { recapMode: 'view' as const, onViewRecap }
                          : { recapMode: 'none' as const })}
                    />
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
              {game.gameStatus !== GameStatus.Scheduled &&
              game.gameStatus !== GameStatus.Rainout &&
              game.gameStatus !== GameStatus.DidNotReport ? (
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
                {/* Game status moved to bottom row for vertical layout */}
              </Box>
            </Box>

            {/* Bottom row for time, field, and game status (vertical layout only) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {game.gameStatus === GameStatus.Scheduled && (
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
                )}
              </Box>

              {/* Game status on the right side of bottom row */}
              {game.gameStatus !== GameStatus.Scheduled &&
                game.gameStatus !== GameStatus.Completed && (
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
                )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GameCard;
