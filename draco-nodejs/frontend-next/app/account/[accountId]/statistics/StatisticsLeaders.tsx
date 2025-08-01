'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import StatisticsTable, {
  formatBattingAverage,
  formatERA,
  formatIPDecimal,
} from './StatisticsTable';
import type { ColumnConfig } from './StatisticsTable';
import LeaderCard from './LeaderCard';

interface LeaderRow {
  playerId: string;
  playerName: string;
  teams?: string[];
  teamName: string;
  statValue: number | string;
  category: string;
  rank: number;
  isTie?: boolean;
  tieCount?: number;
  [key: string]: unknown;
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

  const getFormatter = (format: string) => {
    switch (format) {
      case 'average':
        return formatBattingAverage;
      case 'era':
        return formatERA;
      case 'innings':
        return formatIPDecimal;
      default:
        return (value: unknown) => String(value ?? '0');
    }
  };

  const createLeaderColumns = (
    category: LeaderCategory,
    _data: LeaderRow[],
  ): ColumnConfig<LeaderRow>[] => {
    return [
      {
        field: 'rank',
        label: '#',
        align: 'center',
        tooltip: 'Rank',
        sortable: false,
        formatter: (value: unknown) => String(value ?? ''),
      },
      {
        field: 'playerName',
        label: 'Player',
        align: 'left',
        sortable: false,
      },
      {
        field: 'teamName',
        label: 'Team',
        align: 'left',
        sortable: false,
      },
      {
        field: 'statValue',
        label: category.label,
        align: 'right',
        tooltip: category.label,
        primary: true,
        sortable: false,
        formatter: getFormatter(category.format),
      },
    ];
  };

  const getRowKey = (item: LeaderRow, index: number) => {
    if (item.isTie) {
      return `tie-${item.rank}-${index}`;
    }
    return `${item.playerId}-${item.rank}-${index}`;
  };

  const processLeadersForTable = (
    leaders: LeaderRow[],
    leaderCard: LeaderRow | null,
  ): LeaderRow[] => {
    const processed = leaders.map((leader) => {
      if (leader.isTie) {
        return {
          ...leader,
          playerName: `${leader.tieCount} tied`,
          teamName: '',
          teams: [],
        };
      }
      return leader;
    });

    // If we're showing a single leader card (not a tie), filter out that leader from the table
    if (leaderCard && !leaderCard.isTie) {
      return processed.filter((leader) => leader.rank !== 1 || leader.isTie);
    }

    // If it's a tie card, show all leaders in the table
    return processed;
  };

  const getLeaderForCard = (leaders: LeaderRow[]): LeaderRow | null => {
    const firstPlaceEntries = leaders.filter((row) => row.rank === 1 && !row.isTie);

    // If there's exactly one leader, return them
    if (firstPlaceEntries.length === 1) {
      return firstPlaceEntries[0];
    }

    // If there are multiple leaders tied for first, create a special tie entry
    if (firstPlaceEntries.length > 1) {
      return {
        playerId: 'tie-entry',
        playerName: `${firstPlaceEntries.length} tied`,
        teams: [],
        teamName: '',
        statValue: firstPlaceEntries[0].statValue, // All have the same value
        category: firstPlaceEntries[0].category,
        rank: 1,
        isTie: true,
        tieCount: firstPlaceEntries.length,
      };
    }

    return null;
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {battingCategories.map((category) => {
              const leaders = battingLeaders[category.key] || [];
              const leaderForCard = getLeaderForCard(leaders);
              const processedLeaders = processLeadersForTable(leaders, leaderForCard);

              return (
                <Box key={category.key}>
                  {/* Leader Card */}
                  {leaderForCard && (
                    <LeaderCard
                      leader={leaderForCard}
                      statLabel={category.label}
                      formatter={getFormatter(category.format)}
                    />
                  )}

                  {/* Statistics Table */}
                  {processedLeaders.length > 0 && (
                    <StatisticsTable
                      data={processedLeaders}
                      columns={createLeaderColumns(category, processedLeaders)}
                      loading={loading}
                      emptyMessage={`No additional ${category.label.toLowerCase()} data available`}
                      getRowKey={getRowKey}
                      hideHeader={leaderForCard !== null}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Pitching Leaders */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Pitching Leaders
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {pitchingCategories.map((category) => {
              const leaders = pitchingLeaders[category.key] || [];
              const leaderForCard = getLeaderForCard(leaders);
              const processedLeaders = processLeadersForTable(leaders, leaderForCard);

              return (
                <Box key={category.key}>
                  {/* Leader Card */}
                  {leaderForCard && (
                    <LeaderCard
                      leader={leaderForCard}
                      statLabel={category.label}
                      formatter={getFormatter(category.format)}
                    />
                  )}

                  {/* Statistics Table */}
                  {processedLeaders.length > 0 && (
                    <StatisticsTable
                      data={processedLeaders}
                      columns={createLeaderColumns(category, processedLeaders)}
                      loading={loading}
                      emptyMessage={`No additional ${category.label.toLowerCase()} data available`}
                      getRowKey={getRowKey}
                      hideHeader={leaderForCard !== null}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
