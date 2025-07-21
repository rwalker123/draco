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
  TableSortLabel,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import TeamBadges from './TeamBadges';
import ScrollableTable from './ScrollableTable';

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

const BATTING_COLUMNS = [
  { field: 'playerName' as SortField, label: 'Player', align: 'left' as const, sortable: false },
  { field: 'teamName' as SortField, label: 'Team', align: 'left' as const, sortable: false },
  { field: 'ab' as SortField, label: 'AB', align: 'right' as const, tooltip: 'At Bats' },
  { field: 'h' as SortField, label: 'H', align: 'right' as const, tooltip: 'Hits' },
  { field: 'r' as SortField, label: 'R', align: 'right' as const, tooltip: 'Runs' },
  { field: 'd' as SortField, label: '2B', align: 'right' as const, tooltip: 'Doubles' },
  { field: 't' as SortField, label: '3B', align: 'right' as const, tooltip: 'Triples' },
  { field: 'hr' as SortField, label: 'HR', align: 'right' as const, tooltip: 'Home Runs' },
  { field: 'rbi' as SortField, label: 'RBI', align: 'right' as const, tooltip: 'Runs Batted In' },
  { field: 'bb' as SortField, label: 'BB', align: 'right' as const, tooltip: 'Walks' },
  { field: 'so' as SortField, label: 'SO', align: 'right' as const, tooltip: 'Strikeouts' },
  { field: 'sb' as SortField, label: 'SB', align: 'right' as const, tooltip: 'Stolen Bases' },
  {
    field: 'avg' as SortField,
    label: 'AVG',
    align: 'right' as const,
    tooltip: 'Batting Average',
    primary: true,
  },
  {
    field: 'obp' as SortField,
    label: 'OBP',
    align: 'right' as const,
    tooltip: 'On-Base Percentage',
  },
  {
    field: 'slg' as SortField,
    label: 'SLG',
    align: 'right' as const,
    tooltip: 'Slugging Percentage',
  },
  {
    field: 'ops' as SortField,
    label: 'OPS',
    align: 'right' as const,
    tooltip: 'On-Base Plus Slugging',
  },
];

export default function BattingStatistics({ accountId, filters }: BattingStatisticsProps) {
  const [stats, setStats] = useState<BattingStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avg');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (filters.leagueId && filters.leagueId !== '') {
      loadBattingStats();
    } else {
      setStats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortOrder, page, pageSize, accountId]);

  const loadBattingStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortBy: sortField,
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
        setStats(statsData);

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
  }, [accountId, filters, sortField, sortOrder, page, pageSize]);

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

  const formatBattingAverage = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.000' : num.toFixed(3);
  };

  const formatPercentage = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.000' : num.toFixed(3);
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

  if (stats.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          No batting statistics available for the selected filters.
        </Typography>
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

      <ScrollableTable>
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {BATTING_COLUMNS.map((column) => (
                  <TableCell
                    key={column.field}
                    align={column.align}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      ...(column.primary && {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                      }),
                    }}
                  >
                    {column.sortable !== false ? (
                      <Tooltip title={column.tooltip || ''}>
                        <TableSortLabel
                          active={sortField === column.field}
                          direction={sortField === column.field ? sortOrder : 'asc'}
                          onClick={() => handleSort(column.field)}
                          sx={{
                            '& .MuiTableSortLabel-icon': {
                              color: column.primary ? 'inherit' : undefined,
                            },
                          }}
                        >
                          {column.label}
                        </TableSortLabel>
                      </Tooltip>
                    ) : (
                      <Tooltip title={column.tooltip || ''}>
                        <Typography variant="inherit" component="span">
                          {column.label}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((player, index) => (
                <TableRow
                  key={`${player.playerId}-${index}`}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="left">
                    <Typography variant="body2" fontWeight="medium">
                      {player.playerName}
                    </Typography>
                  </TableCell>
                  <TableCell align="left">
                    <TeamBadges
                      teams={player.teams as string[] | undefined}
                      teamName={player.teamName}
                      maxVisible={3}
                    />
                  </TableCell>
                  <TableCell align="right">{player.ab}</TableCell>
                  <TableCell align="right">{player.h}</TableCell>
                  <TableCell align="right">{player.r}</TableCell>
                  <TableCell align="right">{player.d}</TableCell>
                  <TableCell align="right">{player.t}</TableCell>
                  <TableCell align="right">{player.hr}</TableCell>
                  <TableCell align="right">{player.rbi}</TableCell>
                  <TableCell align="right">{player.bb}</TableCell>
                  <TableCell align="right">{player.so}</TableCell>
                  <TableCell align="right">{player.sb}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: sortField === 'avg' ? 'action.selected' : undefined,
                    }}
                  >
                    {formatBattingAverage(player.avg)}
                  </TableCell>
                  <TableCell align="right">{formatPercentage(player.obp)}</TableCell>
                  <TableCell align="right">{formatPercentage(player.slg)}</TableCell>
                  <TableCell align="right">{formatPercentage(player.ops)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ScrollableTable>

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
