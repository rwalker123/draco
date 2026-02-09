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
import type { PlayerBattingStatsType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { fetchBattingStatistics } from '../../../../services/statisticsService';

type BattingStatsRow = PlayerBattingStatsType;

interface StatisticsFilters {
  seasonId: string;
  leagueId: string;
  divisionId: string;
  isHistorical: boolean;
}

interface BattingStatisticsProps {
  accountId: string;
  filters: StatisticsFilters;
}

type SortField = keyof BattingStatsRow;
type SortOrder = 'asc' | 'desc';

export default function BattingStatistics({ accountId, filters }: BattingStatisticsProps) {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<BattingStatsRow[]>([]);
  const [previousStats, setPreviousStats] = useState<BattingStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avg');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const statsRef = useRef<BattingStatsRow[]>([]);

  useEffect(() => {
    if (!filters.leagueId || filters.leagueId === '') {
      setStats([]);
      statsRef.current = [];
      return;
    }

    const controller = new AbortController();

    const loadBattingStats = async () => {
      if (statsRef.current.length > 0) {
        setPreviousStats(statsRef.current);
      }

      setLoading(true);
      setError(null);

      try {
        const statsData = await fetchBattingStatistics(
          accountId,
          filters.leagueId,
          {
            divisionId: filters.divisionId,
            isHistorical: filters.isHistorical,
            page,
            pageSize,
            sortField: String(sortField),
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
        const message = err instanceof Error ? err.message : 'Failed to load batting statistics';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadBattingStats();

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
      const defaultDescFields: SortField[] = [
        'avg',
        'obp',
        'slg',
        'ops',
        'h',
        'hr',
        'rbi',
        'r',
        'sb',
      ];
      setSortOrder(defaultDescFields.includes(field) ? 'desc' : 'asc');
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
          Please select a league to view batting statistics.
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

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Batting Statistics</Typography>

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
        variant="batting"
        extendedStats={false}
        data={loading && previousStats.length > 0 ? previousStats : stats}
        loading={loading && previousStats.length === 0}
        emptyMessage="No batting statistics available for the selected filters."
        getRowKey={(player, index) => `${player.playerId}-${index}`}
        sortField={String(sortField)}
        sortOrder={sortOrder}
        onSort={(field) => handleSort(field as SortField)}
        playerLinkLabel="Batting Statistics"
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
