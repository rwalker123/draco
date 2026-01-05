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
import { getGolfSeasonStandings } from '@draco/shared-api-client';
import type {
  GolfLeagueStandings,
  GolfFlightStandings,
  GolfTeamStanding,
} from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import WidgetShell from './ui/WidgetShell';

interface GolfStandingsProps {
  accountId: string;
  seasonId: string;
  title?: string;
  showHeader?: boolean;
}

export default function GolfStandings({
  accountId,
  seasonId,
  title = 'Standings',
  showHeader = true,
}: GolfStandingsProps) {
  const apiClient = useApiClient();
  const [standings, setStandings] = useState<GolfLeagueStandings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStandings = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading(true);
    setError(null);

    try {
      const result = await getGolfSeasonStandings({
        client: apiClient,
        throwOnError: false,
        path: { accountId, seasonId },
      });

      const data = unwrapApiResult<GolfLeagueStandings>(result, 'Failed to load standings');
      setStandings(data);
    } catch (err) {
      console.error('Error loading golf standings:', err);
      setError('Failed to load standings');
      setStandings(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  const sortTeams = (teams: GolfTeamStanding[]): GolfTeamStanding[] => {
    return [...teams].sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) {
        return a.rank - b.rank;
      }
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.totalStrokes - b.totalStrokes;
    });
  };

  const renderStandingsTable = (teams: GolfTeamStanding[], isFirstTable: boolean = false) => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        maxWidth: 700,
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.widget.surface,
        border: (theme) => `1px solid ${theme.palette.widget.border}`,
        boxShadow: (theme) => theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
      }}
    >
      <Table size="small" sx={{ minWidth: 500 }}>
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
              <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Team</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 40 }}>
                W
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 40 }}>
                L
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 40 }}>
                T
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, minWidth: 60 }}>
                Pts
              </TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {sortTeams(teams).map((team, index) => (
            <TableRow
              key={team.teamSeasonId}
              sx={{
                '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                backgroundColor: (theme) =>
                  index === 0
                    ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.12)
                    : 'transparent',
                borderBottom: (theme) => `1px solid ${theme.palette.widget.border}`,
              }}
            >
              <TableCell sx={{ minWidth: 180, color: 'text.primary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {team.teamName ?? 'Unnamed Team'}
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
              <TableCell align="right" sx={{ minWidth: 40, fontWeight: 'medium' }}>
                {team.matchesWon}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 40 }}>
                {team.matchesLost}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 40 }}>
                {team.matchesTied}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  minWidth: 60,
                  fontWeight: 700,
                  color: (theme) => theme.palette.primary.main,
                }}
              >
                {team.totalPoints}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStandingsContent = () => {
    if (!standings || !standings.flights || standings.flights.length === 0) return null;

    let isFirstTable = true;

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {standings.flights.map((flight: GolfFlightStandings) => {
          const currentIsFirst = isFirstTable;
          isFirstTable = false;

          return (
            <Box key={flight.flightId} sx={{ mb: 4 }}>
              {standings.flights.length > 1 && (
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
                  {flight.flightName}
                </Typography>
              )}

              {flight.standings.length > 0 ? (
                renderStandingsTable(flight.standings, currentIsFirst)
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No teams in this flight.
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
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

    if (!standings || !standings.flights || standings.flights.length === 0) {
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
