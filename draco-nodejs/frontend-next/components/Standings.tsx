'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import StatisticsTable, {
  ColumnConfig,
  formatPercentage,
} from '/Users/raywalker/source/Draco/draco-nodejs/frontend-next/app/account/[accountId]/statistics/StatisticsTable';

interface StandingsRow {
  teamId: string;
  teamName: string;
  leagueId: string;
  leagueName: string;
  divisionId: string | null;
  divisionName: string | null;
  divisionPriority: number | null;
  w: number;
  l: number;
  t: number; // ties
  pct: number;
  gb: number;
  divisionRecord: { w: number; l: number; t: number };
  [key: string]: unknown;
}

interface GroupedStandingsResponse {
  leagues: LeagueStandings[];
}

interface LeagueStandings {
  leagueId: string;
  leagueName: string;
  divisions: DivisionStandings[];
}

interface DivisionStandings {
  divisionId: string | null;
  divisionName: string | null;
  divisionPriority: number | null;
  teams: StandingsRow[];
}

interface StandingsProps {
  accountId: string;
  seasonId: string;
  title?: string;
  showHeader?: boolean;
}

const STANDINGS_COLUMNS: ColumnConfig<StandingsRow>[] = [
  { field: 'teamName', label: 'Team', align: 'left', sortable: false },
  { field: 'w', label: 'W', align: 'right', tooltip: 'Wins' },
  { field: 'l', label: 'L', align: 'right', tooltip: 'Losses' },
  {
    field: 't',
    label: 'T',
    align: 'right',
    tooltip: 'Ties',
    formatter: (value: unknown) => {
      if (value === 0 || value === '0') return '0';
      if (value == null || value === '') return '0';
      return String(value);
    },
  },
  {
    field: 'pct',
    label: 'PCT',
    align: 'right',
    tooltip: 'Winning Percentage',
    primary: true,
    formatter: formatPercentage,
  },
  {
    field: 'gb',
    label: 'GB',
    align: 'right',
    tooltip: 'Games Back',
    formatter: (value: unknown) => {
      const num =
        typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
      return num === 0 ? '-' : num.toFixed(1);
    },
  },
  {
    field: 'divisionRecord',
    label: 'Div Record',
    align: 'right',
    tooltip: 'Division Record',
    formatter: (value: unknown) => {
      if (!value || typeof value !== 'object') return '';
      const { w, l, t } = value as { w: number; l: number; t: number };
      return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
    },
  },
];

export default function Standings({
  accountId,
  seasonId,
  title = 'Standings',
  showHeader = true,
}: StandingsProps) {
  const [groupedStandings, setGroupedStandings] = useState<GroupedStandingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof StandingsRow>('pct');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadStandings = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/standings?grouped=true`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setGroupedStandings(data.data || null);
      } else {
        throw new Error('Failed to fetch standings');
      }
    } catch (error) {
      console.error('Error loading standings:', error);
      setError('Failed to load standings');
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  const handleSort = (field: keyof StandingsRow) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default sort order - higher is better for wins/pct, lower is better for losses/GB
      const defaultDescFields: (keyof StandingsRow)[] = ['w', 'pct'];
      setSortOrder(defaultDescFields.includes(field) ? 'desc' : 'asc');
    }
  };

  const sortTeams = (teams: StandingsRow[]): StandingsRow[] => {
    return [...teams].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  if (!seasonId || seasonId === '0') {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          Please select a season to view standings.
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

  if (!loading && (!groupedStandings || groupedStandings.leagues.length === 0)) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          No standings available for the selected season.
        </Typography>
      </Box>
    );
  }

  const renderStandingsContent = () => {
    if (!groupedStandings) return null;

    return (
      <Box>
        {groupedStandings.leagues.map((league) => (
          <Box key={league.leagueId} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              {league.leagueName}
            </Typography>

            {league.divisions.map((division) => (
              <Box key={division.divisionId || 'no-division'} sx={{ mb: 3 }}>
                {division.divisionName && (
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    {division.divisionName}
                  </Typography>
                )}

                <StatisticsTable
                  data={sortTeams(division.teams)}
                  columns={STANDINGS_COLUMNS}
                  loading={loading}
                  emptyMessage="No teams in this division."
                  getRowKey={(team) => team.teamId}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  maxHeight="40vh"
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const content = (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>Loading standings...</Typography>
        </Box>
      ) : (
        renderStandingsContent()
      )}
    </Box>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {content}
    </Box>
  );
}
