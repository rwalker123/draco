'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';

interface LeaderRow {
  playerId: string;
  playerName: string;
  teamName: string;
  statValue: number | string;
  category: string;
  rank: number;
  isTie?: boolean;
  tieCount?: number;
}

interface StatisticsFilters {
  seasonId: string;
  leagueId: string;
  divisionId: string;
  isHistorical: boolean;
}

interface StatisticsLeadersProps {
  accountId: string;
  filters: StatisticsFilters;
}

interface LeaderCategory {
  key: string;
  label: string;
  format: string;
}

export default function StatisticsLeaders({ accountId, filters }: StatisticsLeadersProps) {
  const [battingCategories, setBattingCategories] = useState<LeaderCategory[]>([]);
  const [pitchingCategories, setPitchingCategories] = useState<LeaderCategory[]>([]);
  const [battingLeaders, setBattingLeaders] = useState<{ [key: string]: LeaderRow[] }>({});
  const [pitchingLeaders, setPitchingLeaders] = useState<{ [key: string]: LeaderRow[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Load leaders when filters change and categories are available
  useEffect(() => {
    if (
      filters.leagueId &&
      filters.leagueId !== '' &&
      (battingCategories.length > 0 || pitchingCategories.length > 0)
    ) {
      loadLeaders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accountId, battingCategories, pitchingCategories]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/statistics/leader-categories`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBattingCategories(data.data?.batting || []);
        setPitchingCategories(data.data?.pitching || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load leader categories');
    }
  }, [accountId]);

  const loadLeaders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load batting leaders
      const battingPromises = battingCategories.map(async (category) => {
        const params = new URLSearchParams({
          category: category.key,
          ...(filters.divisionId &&
            filters.divisionId !== '0' && { divisionId: filters.divisionId }),
          ...(filters.isHistorical && { historical: 'true' }),
        });

        const response = await fetch(
          `/api/accounts/${accountId}/statistics/leaders/${filters.leagueId}?${params}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          return { category: category.key, leaders: data.data || [] };
        }
        return { category: category.key, leaders: [] };
      });

      // Load pitching leaders
      const pitchingPromises = pitchingCategories.map(async (category) => {
        const params = new URLSearchParams({
          category: category.key,
          ...(filters.divisionId &&
            filters.divisionId !== '0' && { divisionId: filters.divisionId }),
          ...(filters.isHistorical && { historical: 'true' }),
        });

        const response = await fetch(
          `/api/accounts/${accountId}/statistics/leaders/${filters.leagueId}?${params}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          return { category: category.key, leaders: data.data || [] };
        }
        return { category: category.key, leaders: [] };
      });

      const [battingResults, pitchingResults] = await Promise.all([
        Promise.all(battingPromises),
        Promise.all(pitchingPromises),
      ]);

      // Convert results to objects
      const battingLeadersObj = battingResults.reduce(
        (acc, result) => {
          acc[result.category] = result.leaders;
          return acc;
        },
        {} as { [key: string]: LeaderRow[] },
      );

      const pitchingLeadersObj = pitchingResults.reduce(
        (acc, result) => {
          acc[result.category] = result.leaders;
          return acc;
        },
        {} as { [key: string]: LeaderRow[] },
      );

      setBattingLeaders(battingLeadersObj);
      setPitchingLeaders(pitchingLeadersObj);
    } catch (error) {
      console.error('Error loading leaders:', error);
      setError('Failed to load statistical leaders');
    } finally {
      setLoading(false);
    }
  }, [accountId, filters, battingCategories, pitchingCategories]);

  const formatStatValue = (value: number | string, format: string) => {
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Handle NaN case
    if (isNaN(numValue)) {
      return '0';
    }

    switch (format) {
      case 'average':
        return numValue.toFixed(3);
      case 'era':
        return numValue.toFixed(2);
      case 'innings':
        return numValue.toFixed(1);
      case 'number':
      default:
        return numValue.toString();
    }
  };

  if (!filters.leagueId) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          Please select a league to view statistical leaders.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        League Leaders
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Batting Leaders */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Batting Leaders
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {battingCategories.map((category) => (
              <Box key={category.key}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {category.label}
                    </Typography>
                    <List dense>
                      {(battingLeaders[category.key] || []).map((leader, index) => (
                        <ListItem key={`${leader.playerId}-${index}`} disablePadding>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {leader.rank}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={leader.isTie ? `${leader.tieCount} tied` : leader.playerName}
                            secondary={
                              leader.isTie
                                ? `with ${formatStatValue(leader.statValue, category.format)}`
                                : `${leader.teamName} • ${formatStatValue(leader.statValue, category.format)}`
                            }
                          />
                          <Box sx={{ ml: 1 }}>
                            <Chip
                              label={formatStatValue(leader.statValue, category.format)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Pitching Leaders */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Pitching Leaders
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pitchingCategories.map((category) => (
              <Box key={category.key}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {category.label}
                    </Typography>
                    <List dense>
                      {(pitchingLeaders[category.key] || []).map((leader, index) => (
                        <ListItem key={`${leader.playerId}-${index}`} disablePadding>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {leader.rank}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={leader.isTie ? `${leader.tieCount} tied` : leader.playerName}
                            secondary={
                              leader.isTie
                                ? `with ${formatStatValue(leader.statValue, category.format)}`
                                : `${leader.teamName} • ${formatStatValue(leader.statValue, category.format)}`
                            }
                          />
                          <Box sx={{ ml: 1 }}>
                            <Chip
                              label={formatStatValue(leader.statValue, category.format)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
