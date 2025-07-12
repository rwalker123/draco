import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Alert, Avatar } from '@mui/material';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface GameRecapFlat {
  id: string; // game id
  gameDate: string | null;
  league: { id: string; name: string };
  homeTeamName: string;
  visitorTeamName: string;
  homeScore: number;
  visitorScore: number;
  teamName: string;
  recap: string;
}

interface GameRecapsWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId?: string;
  maxRecaps?: number;
}

const GameRecapsWidget: React.FC<GameRecapsWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  maxRecaps = 0,
}) => {
  const [recapList, setRecapList] = useState<GameRecapFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0); // Reset index when recaps change
  }, [recapList]);

  useEffect(() => {
    if (!accountId || !seasonId) return;
    setLoading(true);
    setError(null);
    // Calculate two-week date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 14);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1); // inclusive of today
    // Format as YYYY-MM-DD
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    let url = `/api/accounts/${accountId}/seasons/${seasonId}/games?hasRecap=true&startDate=${startStr}&endDate=${endStr}`;
    if (teamSeasonId) {
      url += `&teamId=${teamSeasonId}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load game recaps');
        // Flatten all recaps for all games into a single array
        let flatRecaps: GameRecapFlat[] = [];
        for (const game of data.data.games) {
          if (game.recaps && Array.isArray(game.recaps)) {
            for (const recap of game.recaps) {
              // Find the team name for this recap
              let teamName = '';
              if (recap.teamId === game.homeTeamId) teamName = game.homeTeamName;
              else if (recap.teamId === game.visitorTeamId) teamName = game.visitorTeamName;
              else teamName = 'Unknown Team';
              flatRecaps.push({
                id: game.id,
                gameDate: game.gameDate,
                league: game.league,
                homeTeamName: game.homeTeamName,
                visitorTeamName: game.visitorTeamName,
                homeScore: game.homeScore,
                visitorScore: game.visitorScore,
                teamName,
                recap: recap.recap,
              });
            }
          }
        }
        if (maxRecaps > 0) {
          flatRecaps = flatRecaps.slice(0, maxRecaps);
        }
        setRecapList(flatRecaps);
      })
      .catch((err) => setError(err.message || 'Error loading game recaps'))
      .finally(() => setLoading(false));
  }, [accountId, seasonId, teamSeasonId, maxRecaps]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!recapList.length) {
    return null;
  }

  // Show the current recap
  const recapItem = recapList[currentIndex];

  return (
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: '#1e3a8a', mr: 2 }}>
            <SportsBaseballIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
              Game Recap
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recapItem.gameDate ? new Date(recapItem.gameDate).toLocaleDateString() : ''} &bull;{' '}
              {recapItem.league.name}
            </Typography>
          </Box>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {recapItem.visitorTeamName} {recapItem.visitorScore} @ {recapItem.homeTeamName}{' '}
          {recapItem.homeScore}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 1, display: 'block' }}
        >
          {recapItem.teamName}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          {recapItem.recap}
        </Typography>
        {recapList.length > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="caption" sx={{ mr: 2 }}>
              {currentIndex + 1} of {recapList.length}
            </Typography>
            <Box>
              <button
                aria-label="Next Recap"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => setCurrentIndex((prev) => (prev + 1) % recapList.length)}
              >
                <ArrowForwardIosIcon fontSize="small" sx={{ color: '#1e3a8a' }} />
              </button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GameRecapsWidget;
