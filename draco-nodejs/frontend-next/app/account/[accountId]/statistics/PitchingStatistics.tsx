'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import StatisticsTable from '../../../../components/statistics/StatisticsTable';
import type { PlayerPitchingStatsType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { fetchPitchingStatistics } from '../../../../services/statisticsService';

type PitchingStatsRow = PlayerPitchingStatsType;

interface StatisticsFilters {
  seasonId: string;
  leagueId: string;
  divisionId: string;
  isHistorical: boolean;
}

interface PitchingStatisticsProps {
  accountId: string;
  filters: StatisticsFilters;
}

type SortField = keyof PitchingStatsRow;
type SortOrder = 'asc' | 'desc';

export default function PitchingStatistics({ accountId, filters }: PitchingStatisticsProps) {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<PitchingStatsRow[]>([]);
  const [previousStats, setPreviousStats] = useState<PitchingStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('era');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // ERA is better when lower
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const statsRef = useRef<PitchingStatsRow[]>([]);

  useEffect(() => {
    if (!filters.leagueId || filters.leagueId === '') {
      setStats([]);
      statsRef.current = [];
      return;
    }

    const controller = new AbortController();

    const loadPitchingStats = async () => {
      if (statsRef.current.length > 0) {
        setPreviousStats(statsRef.current);
      }

      setLoading(true);
      setError(null);

      try {
        const sortFieldMap: Record<string, string> = {
          ipDecimal: 'ip',
        };
        const backendSortField = sortFieldMap[String(sortField)] || String(sortField);

        const statsData = await fetchPitchingStatistics(
          accountId,
          filters.leagueId,
          {
            divisionId: filters.divisionId,
            isHistorical: filters.isHistorical,
            page,
            pageSize,
            sortField: backendSortField,
            sortOrder,
          },
          { client: apiClient, signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        setStats(statsData);
        statsRef.current = statsData;
        setPreviousStats([]);

        const hasMore = statsData.length === pageSize;
        setTotalPages(hasMore ? page + 1 : page);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load pitching statistics';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPitchingStats();

    return () => {
      controller.abort();
    };
  }, [
    accountId,
    apiClient,
    filters.divisionId,
    filters.isHistorical,
    filters.leagueId,
    page,
    pageSize,
    sortField,
    sortOrder,
  ]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default sort order for different types of stats
      // Lower is better for ERA, WHIP, BB/9, R, ER, H, HR, BB
      const defaultAscFields: SortField[] = ['era', 'whip', 'bb9', 'r', 'er', 'h', 'hr', 'bb', 'l'];
      setSortOrder(defaultAscFields.includes(field) ? 'asc' : 'desc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handlePageSizeChange = (event: SelectChangeEvent) => {
    setPageSize(parseInt(event.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  if (!filters.leagueId) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          Please select a league to view pitching statistics.
        </Typography>
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

  if (stats.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          No pitching statistics available for the selected filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Pitching Statistics</Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rows per page</InputLabel>
            <Select
              value={pageSize.toString()}
              label="Rows per page"
              onChange={handlePageSizeChange}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <StatisticsTable
        variant="pitching"
        extendedStats={false}
        data={loading && previousStats.length > 0 ? previousStats : stats}
        loading={loading && previousStats.length === 0}
        emptyMessage="No pitching statistics available for the selected filters."
        getRowKey={(player, index) => `${player.playerId}-${index}`}
        sortField={String(sortField)}
        sortOrder={sortOrder}
        onSort={(field) => handleSort(field as SortField)}
        playerLinkLabel="Pitching Statistics"
      />

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}
