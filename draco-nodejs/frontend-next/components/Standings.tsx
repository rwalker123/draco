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
import { alpha } from '@mui/material/styles';
import { getSeasonStandings } from '@draco/shared-api-client';
import type { SeasonStandingsResponse } from '@draco/shared-api-client';
import { StandingsLeagueType, StandingsTeamType } from '@draco/shared-schemas';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import WidgetShell from './ui/WidgetShell';

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

export default function Standings({
  accountId,
  seasonId,
  title = 'Standings',
  showHeader = true,
}: StandingsProps) {
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

  const renderStandingsTable = (teams: StandingsTeamType[], isFirstTable: boolean = false) => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        maxWidth: 800,
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.widget.surface,
        border: (theme) => `1px solid ${theme.palette.widget.border}`,
        boxShadow: (theme) => theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
      }}
    >
      <Table size="small" sx={{ minWidth: 650 }}>
        {isFirstTable && (
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08),
                '& .MuiTableCell-root': {
                  borderBottom: (theme) => `1px solid ${theme.palette.widget.border}`,
                  color: (theme) => theme.palette.widget.headerText,
                },
              }}
            >
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Team</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 50 }}>
                W
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 50 }}>
                L
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 50 }}>
                T
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 60 }}>
                PCT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 60 }}>
                GB
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 100 }}>
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
                '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                backgroundColor: (theme) =>
                  index === 0
                    ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.12)
                    : 'transparent',
                borderBottom: (theme) => `1px solid ${theme.palette.widget.border}`,
              }}
            >
              <TableCell sx={{ minWidth: 200, color: 'text.primary' }}>
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
                sx={{
                  minWidth: 60,
                  fontWeight: 700,
                  color: (theme) => theme.palette.primary.main,
                }}
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
                color: (theme) => theme.palette.widget.headerText,
                borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
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
                      fontWeight: 700,
                      textAlign: 'center',
                      color: (theme) => theme.palette.secondary.main,
                      textTransform: 'uppercase',
                      fontSize: '1rem',
                      letterSpacing: '0.08em',
                      borderBottom: (theme) =>
                        `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
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

  const renderStatusMessage = (message: string) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 160,
        textAlign: 'center',
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderBody = () => {
    if (!seasonId || seasonId === '0') {
      return renderStatusMessage('Please select a season to view standings.');
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          {error}
        </Alert>
      );
    }

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="h6" color="text.secondary">
            Loading standings...
          </Typography>
        </Box>
      );
    }

    if (!groupedStandings || groupedStandings.length === 0) {
      return renderStatusMessage('No standings available for the selected season.');
    }

    return renderStandingsContent();
  };

  const headerContent = showHeader ? (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 1, md: 1.5 },
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: (theme) => theme.palette.widget.headerText }}
      >
        {title}
      </Typography>
    </Box>
  ) : undefined;

  return (
    <WidgetShell accent="info" disablePadding headerContent={headerContent}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>{renderBody()}</Box>
    </WidgetShell>
  );
}
