'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import StatisticsTable, { formatERA, formatIPDecimal } from './StatisticsTable';
import type { ColumnConfig } from './StatisticsTable';
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

const PITCHING_COLUMNS: ColumnConfig<PitchingStatsRow>[] = [
  { field: 'playerName', label: 'Player', align: 'left', sortable: false },
  { field: 'teamName', label: 'Team', align: 'left', sortable: false },
  { field: 'w', label: 'W', align: 'right', tooltip: 'Wins' },
  { field: 'l', label: 'L', align: 'right', tooltip: 'Losses' },
  { field: 's', label: 'S', align: 'right', tooltip: 'Saves' },
  {
    field: 'ipDecimal',
    label: 'IP',
    align: 'right',
    tooltip: 'Innings Pitched',
    formatter: formatIPDecimal,
  },
  { field: 'h', label: 'H', align: 'right', tooltip: 'Hits Allowed' },
  { field: 'r', label: 'R', align: 'right', tooltip: 'Runs Allowed' },
  { field: 'er', label: 'ER', align: 'right', tooltip: 'Earned Runs' },
  { field: 'bb', label: 'BB', align: 'right', tooltip: 'Walks' },
  { field: 'so', label: 'SO', align: 'right', tooltip: 'Strikeouts' },
  { field: 'hr', label: 'HR', align: 'right', tooltip: 'Home Runs Allowed' },
  {
    field: 'era',
    label: 'ERA',
    align: 'right',
    tooltip: 'Earned Run Average',
    primary: true,
    formatter: formatERA,
  },
  {
    field: 'whip',
    label: 'WHIP',
    align: 'right',
    tooltip: 'Walks + Hits per Inning Pitched',
    formatter: formatERA,
  },
  {
    field: 'k9',
    label: 'K/9',
    align: 'right',
    tooltip: 'Strikeouts per 9 Innings',
    formatter: (value: unknown) => {
      const num =
        typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
      return isNaN(num) ? '0.0' : num.toFixed(1);
    },
  },
  {
    field: 'bb9',
    label: 'BB/9',
    align: 'right',
    tooltip: 'Walks per 9 Innings',
    formatter: (value: unknown) => {
      const num =
        typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
      return isNaN(num) ? '0.0' : num.toFixed(1);
    },
  },
];

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

  const loadPitchingStats = useCallback(async () => {
    if (!filters.leagueId) {
      setStats([]);
      statsRef.current = [];
      setPreviousStats([]);
      return;
    }

    // Store current stats as previous before loading
    if (statsRef.current.length > 0) {
      setPreviousStats(statsRef.current);
    }

    setLoading(true);
    setError(null);

    try {
      // Map frontend field names to backend expected field names
      const sortFieldMap: Record<string, string> = {
        ipDecimal: 'ip', // Backend expects 'ip' and maps it to 'ipDecimal' in SQL
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
        { client: apiClient },
      );

      // Atomic swap - new data replaces everything instantly
      setStats(statsData);
      statsRef.current = statsData;
      setPreviousStats([]); // Clear previous data after successful load

      // Calculate total pages (this would ideally come from the API)
      // For now, assume there might be more data if we get a full page
      const hasMore = statsData.length === pageSize;
      setTotalPages(hasMore ? page + 1 : page);
    } catch (error) {
      console.error('Error loading pitching statistics:', error);
      const message = error instanceof Error ? error.message : 'Failed to load pitching statistics';
      setError(message);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (!filters.leagueId || filters.leagueId === '') {
      setStats([]);
      statsRef.current = [];
      return;
    }

    const timeoutId = setTimeout(() => {
      loadPitchingStats();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [filters.leagueId, loadPitchingStats]);

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
        data={loading && previousStats.length > 0 ? previousStats : stats}
        columns={PITCHING_COLUMNS}
        loading={loading && previousStats.length === 0}
        emptyMessage="No pitching statistics available for the selected filters."
        getRowKey={(player, index) => `${player.playerId}-${index}`}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
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
