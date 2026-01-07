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
import type { GolfLeagueStandings, GolfFlightStandings } from '@draco/shared-api-client';
import type { LeagueHandicapsType, PlayerHandicapType } from '@draco/shared-schemas';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import WidgetShell from './ui/WidgetShell';

interface GolfHandicapLeaderboardProps {
  accountId: string;
  seasonId: string;
  title?: string;
  showHeader?: boolean;
}

export default function GolfHandicapLeaderboard({
  accountId,
  seasonId,
  title = 'Handicap Leaderboard',
  showHeader = true,
}: GolfHandicapLeaderboardProps) {
  const apiClient = useApiClient();
  const [flightHandicaps, setFlightHandicaps] = useState<
    Array<{ flightId: string; flightName: string; players: PlayerHandicapType[] }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHandicaps = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading(true);
    setError(null);

    try {
      const standingsResult = await getGolfSeasonStandings({
        client: apiClient,
        throwOnError: false,
        path: { accountId, seasonId },
      });

      const standings = unwrapApiResult<GolfLeagueStandings>(
        standingsResult,
        'Failed to load standings',
      );

      if (!standings?.flights || standings.flights.length === 0) {
        setFlightHandicaps([]);
        return;
      }

      const handicapPromises = standings.flights.map(async (flight: GolfFlightStandings) => {
        const result = await apiClient.get({
          url: `/api/accounts/${accountId}/golf/handicaps/flight/${flight.flightId}`,
          security: [{ scheme: 'bearer', type: 'http' }],
        });

        const handicapData = unwrapApiResult(
          result,
          `Failed to load handicaps for ${flight.flightName}`,
        ) as LeagueHandicapsType;

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          players: handicapData.players,
        };
      });

      const allHandicaps = await Promise.all(handicapPromises);
      setFlightHandicaps(allHandicaps);
    } catch (err) {
      console.error('Error loading golf handicaps:', err);
      setError('Failed to load handicap data');
      setFlightHandicaps([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  useEffect(() => {
    loadHandicaps();
  }, [loadHandicaps]);

  const formatHandicap = (handicapIndex: number | null): string => {
    if (handicapIndex === null) return 'N/A';
    return handicapIndex.toFixed(1);
  };

  const renderPlayersTable = (players: PlayerHandicapType[], isFirstTable: boolean = false) => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.widget.surface,
        border: (theme) => `1px solid ${theme.palette.widget.border}`,
        boxShadow: (theme) => theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
      }}
    >
      <Table size="small">
        {isFirstTable && (
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08),
                '& .MuiTableCell-root': {
                  borderBottom: (theme) => `1px solid ${theme.palette.widget.border}`,
                  color: (theme) => theme.palette.widget.headerText,
                  py: 1,
                  px: 1.5,
                },
              }}
            >
              <TableCell sx={{ fontWeight: 600, width: 40 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, width: 80 }}>
                Index
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 60 }}>
                Rnds
              </TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {players.map((player, index) => (
            <TableRow
              key={player.contactId || `player-${index}`}
              sx={{
                '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                backgroundColor: (theme) =>
                  index === 0
                    ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.12)
                    : 'transparent',
                borderBottom: (theme) => `1px solid ${theme.palette.widget.border}`,
                '& .MuiTableCell-root': {
                  py: 0.75,
                  px: 1.5,
                },
              }}
            >
              <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
              <TableCell sx={{ color: 'text.primary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {player.firstName} {player.lastName}
                  {index === 0 && player.handicapIndex !== null && (
                    <Chip
                      label="Low"
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  width: 80,
                  fontWeight: 700,
                  color: (theme) =>
                    player.handicapIndex !== null
                      ? theme.palette.primary.main
                      : theme.palette.text.disabled,
                }}
              >
                {formatHandicap(player.handicapIndex)}
              </TableCell>
              <TableCell align="center" sx={{ width: 60, color: 'text.secondary' }}>
                {player.totalRounds}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderHandicapsContent = () => {
    if (flightHandicaps.length === 0) return null;

    let isFirstTable = true;

    return (
      <Box>
        {flightHandicaps.map((flight) => {
          const currentIsFirst = isFirstTable;
          isFirstTable = false;

          return (
            <Box key={flight.flightId} sx={{ mb: 4 }}>
              {flightHandicaps.length > 1 && (
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

              {flight.players.length > 0 ? (
                renderPlayersTable(flight.players, currentIsFirst)
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No players with handicaps in this flight.
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
      return renderStatusMessage('Please select a season to view handicaps.');
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
            Loading handicaps...
          </Typography>
        </Box>
      );
    }

    if (flightHandicaps.length === 0) {
      return renderStatusMessage('No handicap data available for the selected season.');
    }

    const hasAnyPlayers = flightHandicaps.some((f) => f.players.length > 0);
    if (!hasAnyPlayers) {
      return renderStatusMessage('No players with handicaps in the selected season.');
    }

    return renderHandicapsContent();
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
    <WidgetShell accent="success" disablePadding headerContent={headerContent}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>{renderBody()}</Box>
    </WidgetShell>
  );
}
