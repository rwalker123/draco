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

interface PitchingStatsRow {
  playerId: string;
  playerName: string;
  teams?: string[];
  teamName: string;
  ip: number;
  ip2: number; // partial innings (outs)
  w: number;
  l: number;
  s: number; // saves
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  bf: number; // batters faced
  wp: number; // wild pitches
  hbp: number;
  // Calculated fields
  era: number | string;
  whip: number | string;
  k9: number | string;
  bb9: number | string;
  oba: number | string; // opponent batting average
  slg: number | string; // opponent slugging
  ipDecimal: number | string; // innings pitched as decimal
}

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

const PITCHING_COLUMNS = [
  { field: 'playerName' as SortField, label: 'Player', align: 'left' as const, sortable: false },
  { field: 'teamName' as SortField, label: 'Team', align: 'left' as const, sortable: false },
  { field: 'w' as SortField, label: 'W', align: 'right' as const, tooltip: 'Wins' },
  { field: 'l' as SortField, label: 'L', align: 'right' as const, tooltip: 'Losses' },
  { field: 's' as SortField, label: 'S', align: 'right' as const, tooltip: 'Saves' },
  {
    field: 'ipDecimal' as SortField,
    label: 'IP',
    align: 'right' as const,
    tooltip: 'Innings Pitched',
  },
  { field: 'h' as SortField, label: 'H', align: 'right' as const, tooltip: 'Hits Allowed' },
  { field: 'r' as SortField, label: 'R', align: 'right' as const, tooltip: 'Runs Allowed' },
  { field: 'er' as SortField, label: 'ER', align: 'right' as const, tooltip: 'Earned Runs' },
  { field: 'bb' as SortField, label: 'BB', align: 'right' as const, tooltip: 'Walks' },
  { field: 'so' as SortField, label: 'SO', align: 'right' as const, tooltip: 'Strikeouts' },
  { field: 'hr' as SortField, label: 'HR', align: 'right' as const, tooltip: 'Home Runs Allowed' },
  {
    field: 'era' as SortField,
    label: 'ERA',
    align: 'right' as const,
    tooltip: 'Earned Run Average',
    primary: true,
  },
  {
    field: 'whip' as SortField,
    label: 'WHIP',
    align: 'right' as const,
    tooltip: 'Walks + Hits per Inning Pitched',
  },
  {
    field: 'k9' as SortField,
    label: 'K/9',
    align: 'right' as const,
    tooltip: 'Strikeouts per 9 Innings',
  },
  {
    field: 'bb9' as SortField,
    label: 'BB/9',
    align: 'right' as const,
    tooltip: 'Walks per 9 Innings',
  },
];

export default function PitchingStatistics({ accountId, filters }: PitchingStatisticsProps) {
  const [stats, setStats] = useState<PitchingStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('era');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // ERA is better when lower
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (filters.leagueId && filters.leagueId !== '') {
      loadPitchingStats();
    } else {
      setStats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortOrder, page, pageSize, accountId]);

  const loadPitchingStats = useCallback(async () => {
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
        `/api/accounts/${accountId}/statistics/pitching/${filters.leagueId}?${params}`,
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
        throw new Error('Failed to fetch pitching statistics');
      }
    } catch (error) {
      console.error('Error loading pitching statistics:', error);
      setError('Failed to load pitching statistics');
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

  const formatERA = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatRate = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatK9 = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.0' : num.toFixed(1);
  };

  const formatIP = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.0' : num.toFixed(1);
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

      <ScrollableTable>
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {PITCHING_COLUMNS.map((column) => (
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
                  <TableCell align="right">{player.w}</TableCell>
                  <TableCell align="right">{player.l}</TableCell>
                  <TableCell align="right">{player.s}</TableCell>
                  <TableCell align="right">{formatIP(player.ipDecimal)}</TableCell>
                  <TableCell align="right">{player.h}</TableCell>
                  <TableCell align="right">{player.r}</TableCell>
                  <TableCell align="right">{player.er}</TableCell>
                  <TableCell align="right">{player.bb}</TableCell>
                  <TableCell align="right">{player.so}</TableCell>
                  <TableCell align="right">{player.hr}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: sortField === 'era' ? 'action.selected' : undefined,
                    }}
                  >
                    {formatERA(player.era)}
                  </TableCell>
                  <TableCell align="right">{formatRate(player.whip)}</TableCell>
                  <TableCell align="right">{formatK9(player.k9)}</TableCell>
                  <TableCell align="right">{formatK9(player.bb9)}</TableCell>
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
