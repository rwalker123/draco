'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import StatisticsTable, {
  ColumnConfig,
  formatBattingAverage,
  formatPercentage,
} from './StatisticsTable';

interface BattingStatsRow {
  playerId: string;
  playerName: string;
  teams?: string[];
  teamName: string;
  ab: number;
  h: number;
  r: number;
  d: number; // doubles
  t: number; // triples
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  sf: number;
  sh: number;
  // Calculated fields
  avg: number | string;
  obp: number | string;
  slg: number | string;
  ops: number | string;
  tb: number | string;
  pa: number | string;
  [key: string]: unknown;
}

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

const BATTING_COLUMNS: ColumnConfig<BattingStatsRow>[] = [
  { field: 'playerName', label: 'Player', align: 'left', sortable: false },
  { field: 'teamName', label: 'Team', align: 'left', sortable: false },
  { field: 'ab', label: 'AB', align: 'right', tooltip: 'At Bats' },
  { field: 'h', label: 'H', align: 'right', tooltip: 'Hits' },
  { field: 'r', label: 'R', align: 'right', tooltip: 'Runs' },
  { field: 'd', label: '2B', align: 'right', tooltip: 'Doubles' },
  { field: 't', label: '3B', align: 'right', tooltip: 'Triples' },
  { field: 'hr', label: 'HR', align: 'right', tooltip: 'Home Runs' },
  { field: 'rbi', label: 'RBI', align: 'right', tooltip: 'Runs Batted In' },
  { field: 'bb', label: 'BB', align: 'right', tooltip: 'Walks' },
  { field: 'so', label: 'SO', align: 'right', tooltip: 'Strikeouts' },
  { field: 'sb', label: 'SB', align: 'right', tooltip: 'Stolen Bases' },
  {
    field: 'avg',
    label: 'AVG',
    align: 'right',
    tooltip: 'Batting Average',
    primary: true,
    formatter: formatBattingAverage,
  },
  {
    field: 'obp',
    label: 'OBP',
    align: 'right',
    tooltip: 'On-Base Percentage',
    formatter: formatPercentage,
  },
  {
    field: 'slg',
    label: 'SLG',
    align: 'right',
    tooltip: 'Slugging Percentage',
    formatter: formatPercentage,
  },
  {
    field: 'ops',
    label: 'OPS',
    align: 'right',
    tooltip: 'On-Base Plus Slugging',
    formatter: formatPercentage,
  },
];

export default function BattingStatistics({ accountId, filters }: BattingStatisticsProps) {
  const [stats, setStats] = useState<BattingStatsRow[]>([]);
  const [previousStats, setPreviousStats] = useState<BattingStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avg');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (filters.leagueId && filters.leagueId !== '') {
      const timeoutId = setTimeout(() => {
        loadBattingStats();
      }, 50); // Short debounce for all operations

      return () => clearTimeout(timeoutId);
    } else {
      setStats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortOrder, page, pageSize, accountId]);

  const loadBattingStats = useCallback(async () => {
    // Store current stats as previous before loading
    if (stats.length > 0) {
      setPreviousStats(stats);
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortBy: String(sortField),
        sortOrder,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.divisionId && filters.divisionId !== '0' && { divisionId: filters.divisionId }),
        ...(filters.isHistorical && { historical: 'true' }),
      });

      const response = await fetch(
        `/api/accounts/${accountId}/statistics/batting/${filters.leagueId}?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const statsData = data.data || [];

        // Atomic swap - new data replaces everything instantly
        setStats(statsData);
        setPreviousStats([]); // Clear previous data after successful load

        // Calculate total pages (this would ideally come from the API)
        // For now, assume there might be more data if we get a full page
        const hasMore = statsData.length === pageSize;
        setTotalPages(hasMore ? page + 1 : page);
      } else {
        throw new Error('Failed to fetch batting statistics');
      }
    } catch (error) {
      console.error('Error loading batting statistics:', error);
      setError('Failed to load batting statistics');
    } finally {
      setLoading(false);
    }
  }, [accountId, filters, sortField, sortOrder, page, pageSize, stats]);

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
        data={loading && previousStats.length > 0 ? previousStats : stats}
        columns={BATTING_COLUMNS}
        loading={loading && previousStats.length === 0}
        emptyMessage="No batting statistics available for the selected filters."
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
