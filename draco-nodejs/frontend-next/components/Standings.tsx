'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { getSeasonStandings } from '@draco/shared-api-client';
import type { SeasonStandingsResponse } from '@draco/shared-api-client';
import { StandingsLeagueType, StandingsTeamType } from '@draco/shared-schemas';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

interface StandingsProps {
  accountId: string;
  seasonId: string;
  title?: string;
  showHeader?: boolean;
}

const formatPercentage = (value: number): string => {
  const num = Number.isFinite(value) ? value : 0;
  return num.toFixed(3);
};

const formatGamesBehind = (value: number): string => {
  const num = Number.isFinite(value) ? value : 0;
  return num === 0 ? '-' : num.toFixed(1);
};

const formatDivisionRecord = (value: StandingsTeamType['divisionRecord']): string => {
  if (!value) return '';
  const { w, l, t } = value;
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
};

const formatTies = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return value.toString();
};

export default function Standings({ accountId, seasonId, showHeader = true }: StandingsProps) {
  const apiClient = useApiClient();
  const [groupedStandings, setGroupedStandings] = useState<StandingsLeagueType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStandings = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading(true);
    setError(null);

    try {
      const result = await getSeasonStandings({
        client: apiClient,
        throwOnError: false,
        path: { accountId, seasonId },
        query: { grouped: true },
      });

      const data = unwrapApiResult<SeasonStandingsResponse>(result, 'Failed to load standings');

      setGroupedStandings((data as StandingsLeagueType[]) ?? []);
    } catch (error) {
      console.error('Error loading standings:', error);
      setError('Failed to load standings');
      setGroupedStandings(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  const sortTeams = (teams: StandingsTeamType[]): StandingsTeamType[] => {
    return [...teams].sort((a, b) => {
      // Sort by winning percentage (descending), then by wins (descending)
      if (a.pct !== b.pct) {
        return b.pct - a.pct;
      }
      return b.w - a.w;
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

  if (!loading && (!groupedStandings || groupedStandings.length === 0)) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          No standings available for the selected season.
        </Typography>
      </Box>
    );
  }

  const renderStandingsTable = (teams: StandingsTeamType[], isFirstTable: boolean = false) => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        maxWidth: 800,
        mx: 'auto',
        boxShadow: 2,
        borderRadius: 2,
      }}
    >
      <Table size="small" sx={{ minWidth: 650 }}>
        {isFirstTable && (
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Team</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                W
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                L
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                T
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                PCT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                GB
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 100 }}>
                Div Record
              </TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {sortTeams(teams).map((team, index) => (
            <TableRow
              key={team.team.id}
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                backgroundColor: index === 0 ? 'success.light' : 'inherit',
              }}
            >
              <TableCell sx={{ minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {team.team.name ?? 'Unnamed Team'}
                  {index === 0 && (
                    <Chip
                      label="1st"
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 50, fontWeight: 'medium' }}>
                {team.w}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 50 }}>
                {team.l}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 50 }}>
                {formatTies(team.t)}
              </TableCell>
              <TableCell
                align="right"
                sx={{ minWidth: 60, fontWeight: 'bold', color: 'primary.main' }}
              >
                {formatPercentage(team.pct)}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 60 }}>
                {formatGamesBehind(team.gb)}
              </TableCell>
              <TableCell
                align="right"
                sx={{ minWidth: 100, fontSize: '0.875rem', color: 'text.secondary' }}
              >
                {formatDivisionRecord(team.divisionRecord)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStandingsContent = () => {
    if (!groupedStandings) return null;

    let isFirstTable = true;

    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {groupedStandings.map((league) => (
          <Box key={league.league.id ?? 'no-league'} sx={{ mb: 5 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 'bold',
                textAlign: 'center',
                color: 'primary.main',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1,
                letterSpacing: '0.05em',
              }}
            >
              {league.league.name ?? 'Unnamed League'}
            </Typography>

            {league.divisions.map((division) => {
              const currentIsFirst = isFirstTable;
              isFirstTable = false;
              const divisionKey = division.division.id ?? 'no-division';
              const divisionName = division.division.division?.name ?? 'Unassigned Division';

              return (
                <Box key={divisionKey} sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: 'secondary.main',
                      textTransform: 'uppercase',
                      fontSize: '1rem',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid',
                      borderColor: 'secondary.light',
                      pb: 0.5,
                      display: 'inline-block',
                      minWidth: '200px',
                    }}
                  >
                    {divisionName}
                  </Typography>

                  {division.teams.length > 0 ? (
                    renderStandingsTable(division.teams, currentIsFirst)
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No teams in this division.
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  const content = (
    <Box sx={{ py: 2 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="h6" color="text.secondary">
            Loading standings...
          </Typography>
        </Box>
      ) : (
        renderStandingsContent()
      )}
    </Box>
  );

  if (!showHeader) {
    return content;
  }

  return <Box sx={{ py: 3, px: 2 }}>{content}</Box>;
}
