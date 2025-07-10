import React from 'react';
import { Box, Typography, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

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
  canEditRecap?: boolean;
  onEditRecap?: (game: Game) => void;
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
          boxShadow: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #0a2342 80%, #1e3a5c 100%)',
          color: 'white',
          border: 'none',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                game.gameStatusText !== 'Incomplete' ? 'auto 1fr auto auto' : 'auto 1fr auto',
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="#b0c4de" fontWeight={500} sx={{ pt: 0.5 }}>
                {game.leagueName}
              </Typography>
              {canEditGames && onEditGame && (
                <Tooltip title="Enter Game Results">
                  <IconButton
                    size="small"
                    onClick={() => onEditGame(game)}
                    sx={{
                      color: '#b0c4de',
                      mt: 1,
                      p: 0.5,
                      '&:hover': {
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {/* Recap button for completed games, only if canEditRecap is true */}
              {game.gameStatusText !== 'Incomplete' && canEditRecap && onEditRecap && (
                <Tooltip title={game.hasGameRecap ? 'Edit Summary' : 'Enter Summary'}>
                  <IconButton
                    size="small"
                    onClick={() => onEditRecap(game)}
                    sx={{
                      color: game.hasGameRecap ? '#ffd700' : '#b0c4de',
                      mt: 1,
                      ml: 1,
                      p: 0.5,
                      '&:hover': {
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" fontWeight={700} sx={{ color: 'white', mb: 0.5 }} noWrap>
                {game.awayTeamName}
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ color: 'white' }} noWrap>
                {game.homeTeamName}
              </Typography>
            </Box>
            {/* Scores column */}
            {game.gameStatusText !== 'Incomplete' &&
              game.gameStatus !== 2 &&
              game.gameStatus !== 5 && (
                <Box textAlign="center" sx={{ minWidth: 'auto', width: 'auto' }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={game.awayScore > game.homeScore ? 'success.main' : 'white'}
                    sx={{ mb: 0.5 }}
                  >
                    {game.awayScore}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={game.homeScore > game.awayScore ? 'success.main' : 'white'}
                  >
                    {game.homeScore}
                  </Typography>
                </Box>
              )}
            {/* Game status badge column (far right, spans two rows, centered) */}
            {game.gameStatusText !== 'Incomplete' && (
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
                <span
                  style={{
                    display: 'inline-block',
                    background: '#b0c4de',
                    color: '#0a2342',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    margin: 0,
                  }}
                >
                  {game.gameStatusShortText || getGameStatusShortText(game.gameStatus)}
                </span>
              </Box>
            )}
            {game.gameStatusText === 'Incomplete' && (
              <Box>
                <Typography variant="body2" color="#b0c4de" sx={{ pt: 0.5 }}>
                  {localTime}
                </Typography>
                {(game.fieldName || game.fieldShortName) && (
                  <Typography variant="caption" color="#b0c4de" sx={{ display: 'block' }}>
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
    <Box
      sx={{
        background: 'linear-gradient(180deg, #0a2342 60%, #1e3a5c 100%)',
        borderRadius: 3,
        boxShadow: 4,
        p: 3,
        mb: 4,
        color: 'white',
        minWidth: 0,
      }}
    >
      {sections.map((section) => (
        <Box key={section.title} mb={3}>
          <Typography variant="h6" fontWeight={600} color="#b0c4de" mb={1}>
            {section.title}
          </Typography>
          {section.games.length > 0 ? (
            section.games.map(renderGame)
          ) : (
            <Typography color="#b0c4de" textAlign="center" mt={2}>
              {emptyMessage}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default GameListDisplay;
