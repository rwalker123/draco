import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Modal,
  CircularProgress,
  Chip
} from '@mui/material';
import { SportsBaseball as SportsBaseballIcon } from '@mui/icons-material';

interface GameRecap {
  teamId: string;
  recap: string;
}

interface Game {
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
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  hasGameRecap: boolean;
  gameRecaps: GameRecap[];
}

interface ScoreboardData {
  today: Game[];
  yesterday: Game[];
  recaps: Game[];
}

interface BaseballScoreboardProps {
  accountId: string;
  teamId?: string;
}

const groupLabels: Record<keyof ScoreboardData, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  recaps: 'Recent Recaps (2-5 days ago)'
};

const statusColor = (status: number) => {
  switch (status) {
    case 1: return 'primary'; // Final
    case 2: return 'warning'; // In Progress
    case 3: return 'info'; // Postponed
    case 4: return 'secondary'; // Forfeit
    case 5: return 'default'; // Did Not Report
    default: return 'default';
  }
};

const BaseballScoreboard: React.FC<BaseballScoreboardProps> = ({ accountId, teamId }) => {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recapModal, setRecapModal] = useState<null | { game: Game; recap: GameRecap }>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/accounts/${accountId}/games/scoreboard/public${teamId ? `?teamId=${teamId}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch scoreboard');
        }
        return res.json();
      })
      .then(json => {
        setData(json.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [accountId, teamId]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box color="error.main" p={2}>{error}</Box>;
  }
  if (!data) {
    return null;
  }

  const renderGame = (game: Game) => {
    let localTime = '';
    try {
      if (game.date) {
        // Remove the "Z" to treat as local time instead of UTC
        const localDateString = game.date.replace('Z', '');
        const dateObj = new Date(localDateString);
        
        // Now format as local time
        localTime = dateObj.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        localTime = 'TBD';
      }
    } catch (error) {
      console.error('Error formatting time:', error);
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
          <Typography variant="subtitle2" color="#b0c4de" fontWeight={500} gutterBottom noWrap>
            {game.leagueName}
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: game.gameStatusText !== 'Scheduled' ? '1fr auto auto' : '1fr auto',
            gap: 2,
            alignItems: 'center'
          }}>
            <Box>
              <Button
                href={`/baseball/team/${game.awayTeamId}`}
                sx={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1rem', 
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  textAlign: 'left',
                  display: 'block',
                  mb: 0.5
                }}
                size="small"
              >
                {game.awayTeamName}
              </Button>
              <Button
                href={`/baseball/team/${game.homeTeamId}`}
                sx={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1rem', 
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  textAlign: 'left',
                  display: 'block'
                }}
                size="small"
              >
                {game.homeTeamName}
              </Button>
            </Box>
            {game.gameStatusText !== 'Scheduled' && (
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color={game.awayScore > game.homeScore ? 'success.main' : 'white'} sx={{ mb: 0.5 }}>
                  {game.awayScore}
                </Typography>
                <Typography variant="h6" fontWeight={700} color={game.homeScore > game.awayScore ? 'success.main' : 'white'}>
                  {game.homeScore}
                </Typography>
              </Box>
            )}
            <Box textAlign="center" minWidth={120}>
              <Chip
                label={game.gameStatusText}
                color={statusColor(game.gameStatus)}
                size="small"
                sx={{ mb: 1, fontWeight: 700, bgcolor: '#1e3a5c', color: 'white' }}
              />
              <Typography variant="body2" color="#b0c4de">
                {localTime}
              </Typography>
              {game.fieldName && (
                <Typography variant="caption" color="#b0c4de">
                  {game.fieldName}
                </Typography>
              )}
              {game.hasGameRecap && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, color: 'white', borderColor: '#b0c4de' }}
                  onClick={() => setRecapModal({ game, recap: game.gameRecaps[0] })}
                >
                  Recap
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{
      background: 'linear-gradient(180deg, #0a2342 60%, #1e3a5c 100%)',
      borderRadius: 3,
      boxShadow: 4,
      p: 3,
      mb: 4,
      color: 'white',
      minWidth: 0,
    }}>
      <Box display="flex" alignItems="center" mb={2}>
        <SportsBaseballIcon sx={{ color: '#b0c4de', mr: 1 }} />
        <Typography variant="h5" fontWeight={700} color="white">
          Scoreboard
        </Typography>
      </Box>
      {(['today', 'yesterday', 'recaps'] as (keyof ScoreboardData)[]).map(group => (
        data[group].length > 0 && (
          <Box key={group} mb={3}>
            <Typography variant="h6" fontWeight={600} color="#b0c4de" mb={1}>
              {groupLabels[group]}
            </Typography>
            {data[group].map(renderGame)}
          </Box>
        )
      ))}
      {data.today.length === 0 && data.yesterday.length === 0 && (
        <Typography color="#b0c4de" textAlign="center" mt={4}>
          No games to display.
        </Typography>
      )}
      <Modal
        open={!!recapModal}
        onClose={() => setRecapModal(null)}
        aria-labelledby="recap-modal-title"
        aria-describedby="recap-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#0a2342',
            color: 'white',
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            minWidth: 320,
            maxWidth: 500,
            outline: 'none',
          }}
        >
          <Typography id="recap-modal-title" variant="h6" fontWeight={700} mb={2}>
            Game Recap
          </Typography>
          <Typography id="recap-modal-description" sx={{ whiteSpace: 'pre-line' }}>
            {recapModal?.recap.recap}
          </Typography>
          <Box mt={3} textAlign="right">
            <Button variant="contained" color="primary" onClick={() => setRecapModal(null)}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BaseballScoreboard; 