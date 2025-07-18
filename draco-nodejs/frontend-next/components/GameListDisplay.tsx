import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, Tooltip, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';

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
}

// Utility to get short game status text
const getGameStatusShortText = (status: number): string => {
  switch (status) {
    case 0:
      return '';
    case 1:
      return 'F';
    case 2:
      return 'R';
    case 3:
      return 'PPD';
    case 4:
      return 'FFT';
    case 5:
      return 'DNR';
    default:
      return '';
  }
};

const GameListDisplay: React.FC<GameListDisplayProps> = ({
  sections,
  emptyMessage = 'No games to display.',
  canEditGames = false,
  onEditGame,
  canEditRecap,
  onEditRecap,
  onViewRecap,
}) => {
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
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
            borderColor: 'primary.main',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: game.gameStatus !== 0 ? 'auto 1fr auto auto' : 'auto 1fr auto',
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
            {game.gameStatus !== 0 && game.gameStatus !== 2 && game.gameStatus !== 5 && (
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
            )}
            {/* Game status badge column (far right, spans two rows, centered) */}
            {game.gameStatus !== 0 && (
              <Box
                sx={{
                  gridRow: '1 / span 2',
                  gridColumn: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  minWidth: 'auto',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'inline-block',
                    background: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    margin: 0,
                  }}
                >
                  {game.gameStatusShortText || getGameStatusShortText(game.gameStatus)}
                </Box>
              </Box>
            )}
            {game.gameStatus === 0 && (
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
        </CardContent>
      </Card>
    );
  };

  return (
    <Paper
      sx={{
        p: 4,
        mb: 4,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: 0,
      }}
    >
      {sections.map((section) => (
        <Box key={section.title} mb={3}>
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
            section.games.map(renderGame)
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
