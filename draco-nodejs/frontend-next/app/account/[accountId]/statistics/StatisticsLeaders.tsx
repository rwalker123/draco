'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import LeaderCategoryPanel from '../../../../components/statistics/LeaderCategoryPanel';
import type { LeaderRowType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useLeaderCategories } from '../../../../hooks/useLeaderCategories';
import { fetchStatisticalLeaders } from '../../../../services/statisticsService';

type LeaderRow = LeaderRowType;

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

export default function StatisticsLeaders({ accountId, filters }: StatisticsLeadersProps) {
  const apiClient = useApiClient();
  const {
    battingCategories,
    pitchingCategories,
    loading: categoryLoading,
    error: categoryError,
  } = useLeaderCategories(accountId);
  const [battingLeaders, setBattingLeaders] = useState<{ [key: string]: LeaderRow[] }>({});
  const [pitchingLeaders, setPitchingLeaders] = useState<{ [key: string]: LeaderRow[] }>({});
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);
  const isLoading = categoryLoading || leadersLoading;
  const error = leadersError ?? categoryError;

  useEffect(() => {
    if (
      !filters.leagueId ||
      filters.leagueId === '' ||
      (battingCategories.length === 0 && pitchingCategories.length === 0)
    ) {
      return;
    }

    const controller = new AbortController();

    const loadLeaders = async () => {
      setLeadersLoading(true);
      setLeadersError(null);

      try {
        const battingPromises = battingCategories.map(async (category) => {
          const leaders = await fetchStatisticalLeaders(
            accountId,
            filters.leagueId,
            category.key,
            {
              divisionId: filters.divisionId,
              isHistorical: filters.isHistorical,
            },
            { client: apiClient },
          );

          return { category: category.key, leaders };
        });

        const pitchingPromises = pitchingCategories.map(async (category) => {
          const leaders = await fetchStatisticalLeaders(
            accountId,
            filters.leagueId,
            category.key,
            {
              divisionId: filters.divisionId,
              isHistorical: filters.isHistorical,
            },
            { client: apiClient },
          );

          return { category: category.key, leaders };
        });

        const [battingResults, pitchingResults] = await Promise.all([
          Promise.all(battingPromises),
          Promise.all(pitchingPromises),
        ]);

        if (controller.signal.aborted) return;

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
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load statistical leaders';
        setLeadersError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLeadersLoading(false);
        }
      }
    };

    void loadLeaders();

    return () => {
      controller.abort();
    };
  }, [
    accountId,
    apiClient,
    battingCategories,
    filters.divisionId,
    filters.isHistorical,
    filters.leagueId,
    pitchingCategories,
  ]);

  if (!filters.leagueId) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          Please select a league to view statistical leaders.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
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

              return (
                <Box key={category.key}>
                  <LeaderCategoryPanel
                    category={category}
                    leaders={leaders}
                    loading={leadersLoading}
                    emptyMessage={`No additional ${category.label.toLowerCase()} data available`}
                    accountId={accountId}
                    playerLinkLabelPrefix="League Leaders • Batting"
                  />
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

              return (
                <Box key={category.key}>
                  <LeaderCategoryPanel
                    category={category}
                    leaders={leaders}
                    loading={leadersLoading}
                    emptyMessage={`No additional ${category.label.toLowerCase()} data available`}
                    accountId={accountId}
                    playerLinkLabelPrefix="League Leaders • Pitching"
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
