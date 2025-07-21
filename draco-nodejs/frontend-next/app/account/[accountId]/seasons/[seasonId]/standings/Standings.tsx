'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import { useAuth } from '../../../../../../context/AuthContext';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';

interface StandingsRow {
  teamName: string;
  teamId: string;
  w: number;
  l: number;
  pct: number;
  gb: number; // games back
  streak: string;
  last10: string;
}

interface StandingsProps {
  accountId: string;
  seasonId: string;
}

export default function Standings({ accountId, seasonId }: StandingsProps) {
  const { token } = useAuth();
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStandings = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounts/${accountId}/seasons/${seasonId}/standings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const standingsData = data.data || [];

        // Calculate games back
        const processedStandings = calculateGamesBack(standingsData);
        setStandings(processedStandings);
      } else {
        throw new Error('Failed to fetch standings');
      }
    } catch (error) {
      console.error('Error loading standings:', error);
      setError('Failed to load standings');
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId, token]);

  useEffect(() => {
    if (seasonId && seasonId !== '' && seasonId !== '0') {
      loadStandings();
    } else {
      setStandings([]);
    }
  }, [seasonId, accountId, token, loadStandings]);

  const calculateGamesBack = (teams: StandingsRow[]): StandingsRow[] => {
    if (teams.length === 0) return teams;

    // Sort by winning percentage descending, then by wins descending
    const sorted = [...teams].sort((a, b) => {
      if (a.pct === b.pct) {
        return b.w - a.w;
      }
      return b.pct - a.pct;
    });

    // Calculate games back from first place
    const leader = sorted[0];
    const leaderGames = leader.w + leader.l;
    const leaderWins = leader.w;

    return sorted.map((team, index) => {
      if (index === 0) {
        return { ...team, gb: 0 };
      }

      const teamWins = team.w;
      const teamLosses = team.l;

      // Games back calculation: ((Leader Wins - Team Wins) + (Team Losses - Leader Losses)) / 2
      const gb = (leaderWins - teamWins + (teamLosses - (leaderGames - leaderWins))) / 2;

      return { ...team, gb: Math.max(0, gb) };
    });
  };

  const formatWinningPercentage = (pct: number) => {
    return pct.toFixed(3);
  };

  const formatGamesBack = (gb: number) => {
    if (gb === 0) return '—';
    if (gb % 1 === 0) return gb.toString();
    return gb.toFixed(1);
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'success';
    if (position <= 3) return 'info';
    if (position <= 6) return 'warning';
    return 'default';
  };

  if (!seasonId || seasonId === '0') {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId} />
        <Box p={3}>
          <Typography variant="body1" color="text.secondary">
            Invalid season for standings.
          </Typography>
        </Box>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId} />
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId} />
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </main>
    );
  }

  if (standings.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId} />
        <Box p={3}>
          <Typography variant="body1" color="text.secondary">
            No standings available for the selected season.
          </Typography>
        </Box>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId} />
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          League Standings
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px' }}>
                  <Tooltip title="Position">
                    <Typography variant="inherit">Pos</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px' }}>
                  <Tooltip title="Wins">
                    <Typography variant="inherit">W</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px' }}>
                  <Tooltip title="Losses">
                    <Typography variant="inherit">L</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>
                  <Tooltip title="Winning Percentage">
                    <Typography variant="inherit">PCT</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>
                  <Tooltip title="Games Back">
                    <Typography variant="inherit">GB</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>
                  <Tooltip title="Current Streak">
                    <Typography variant="inherit">Streak</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>
                  <Tooltip title="Last 10 Games">
                    <Typography variant="inherit">L10</Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standings.map((team, index) => {
                const position = index + 1;
                const isFirstPlace = position === 1;

                return (
                  <TableRow
                    key={team.teamId}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      ...(isFirstPlace && {
                        backgroundColor: 'action.selected',
                      }),
                    }}
                  >
                    <TableCell align="center">
                      <Chip
                        label={position}
                        size="small"
                        color={
                          getPositionColor(position) as 'success' | 'info' | 'warning' | 'default'
                        }
                        variant={isFirstPlace ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 'bold',
                          minWidth: '32px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={isFirstPlace ? 'bold' : 'medium'}>
                        {team.teamName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={isFirstPlace ? 'bold' : 'normal'}>
                        {team.w}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={isFirstPlace ? 'bold' : 'normal'}>
                        {team.l}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={isFirstPlace ? 'bold' : 'normal'}>
                        {formatWinningPercentage(team.pct)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight={isFirstPlace ? 'bold' : 'normal'}
                        color={team.gb === 0 ? 'primary.main' : 'text.primary'}
                      >
                        {formatGamesBack(team.gb)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {team.streak || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {team.last10 || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            * Standings are sorted by winning percentage, then by total wins
          </Typography>
        </Box>
      </Box>
    </main>
  );
}
