'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { getGolfSeasonStandings, getGolfFlightLeaders } from '@draco/shared-api-client';
import type {
  GolfLeagueStandings,
  GolfFlightStandings,
  GolfFlightLeaders,
} from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';
import WidgetShell from './ui/WidgetShell';

type StatTab = 'lowScores' | 'scoringAvg' | 'skins';

interface GolfStatsLeaderboardProps {
  accountId: string;
  seasonId: string;
  title?: string;
}

export default function GolfStatsLeaderboard({
  accountId,
  seasonId,
  title = 'Stats Leaderboard',
}: GolfStatsLeaderboardProps) {
  const apiClient = useApiClient();
  const [flightLeaders, setFlightLeaders] = useState<GolfFlightLeaders[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<StatTab>('lowScores');

  useEffect(() => {
    if (!seasonId || seasonId === '0') return;

    const controller = new AbortController();

    const loadLeaders = async () => {
      setLoading(true);

      try {
        const standingsResult = await getGolfSeasonStandings({
          client: apiClient,
          throwOnError: false,
          path: { accountId, seasonId },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const standings = unwrapApiResult<GolfLeagueStandings>(
          standingsResult,
          'Failed to load standings',
        );

        if (!standings?.flights || standings.flights.length === 0) {
          setFlightLeaders([]);
          return;
        }

        const leaderPromises = standings.flights.map(async (flight: GolfFlightStandings) => {
          const result = await getGolfFlightLeaders({
            client: apiClient,
            throwOnError: false,
            path: { accountId, flightId: flight.flightId },
            signal: controller.signal,
          });

          return unwrapApiResult<GolfFlightLeaders>(
            result,
            `Failed to load leaders for ${flight.flightName}`,
          );
        });

        const allLeaders = await Promise.all(leaderPromises);

        if (controller.signal.aborted) return;

        setFlightLeaders(allLeaders);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!(err instanceof ApiClientError)) {
          console.error('Error loading golf stats leaders:', err);
        }
        setFlightLeaders([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadLeaders();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, seasonId]);

  if (!loading && flightLeaders.length === 0) return null;

  const playerLink = (contactId: string, firstName: string, lastName: string) =>
    `/account/${accountId}/seasons/${seasonId}/golf/players/${contactId}?name=${encodeURIComponent(`${firstName} ${lastName}`)}`;

  const renderPlayerName = (contactId: string, firstName: string, lastName: string) => (
    <Link
      href={playerLink(contactId, firstName, lastName)}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Typography
        component="span"
        sx={{
          '&:hover': { textDecoration: 'underline', color: 'primary.main' },
          cursor: 'pointer',
        }}
      >
        {firstName} {lastName}
      </Typography>
    </Link>
  );

  const tableContainerSx = {
    mb: 2,
    borderRadius: 2,
    backgroundColor: (theme: { palette: { widget: { surface: string } } }) =>
      theme.palette.widget.surface,
    border: (theme: { palette: { widget: { border: string } } }) =>
      `1px solid ${theme.palette.widget.border}`,
    boxShadow: (theme: { palette: { mode: string }; shadows: string[] }) =>
      theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
  };

  const headerRowSx = {
    backgroundColor: (theme: { palette: { primary: { main: string }; mode: string } }) =>
      alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08),
    '& .MuiTableCell-root': {
      borderBottom: (theme: { palette: { widget: { border: string } } }) =>
        `1px solid ${theme.palette.widget.border}`,
      color: (theme: { palette: { widget: { headerText: string } } }) =>
        theme.palette.widget.headerText,
      py: 1,
      px: 1.5,
    },
  };

  const getBodyRowSx = (index: number) => ({
    '&:hover': {
      backgroundColor: (theme: { palette: { action: { hover: string } } }) =>
        theme.palette.action.hover,
    },
    backgroundColor: (theme: { palette: { success: { main: string }; mode: string } }) =>
      index === 0
        ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.12)
        : 'transparent',
    borderBottom: (theme: { palette: { widget: { border: string } } }) =>
      `1px solid ${theme.palette.widget.border}`,
    '& .MuiTableCell-root': {
      py: 0.75,
      px: 1.5,
    },
  });

  const flightHeaderSx = {
    mb: 1.5,
    fontWeight: 700,
    textAlign: 'center',
    color: (theme: { palette: { secondary: { main: string } } }) => theme.palette.secondary.main,
    textTransform: 'uppercase',
    fontSize: '1rem',
    letterSpacing: '0.08em',
    borderBottom: (theme: { palette: { secondary: { main: string } } }) =>
      `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
    pb: 0.5,
    display: 'inline-block',
    minWidth: '200px',
  };

  const valueCellSx = {
    fontWeight: 700,
    color: (theme: { palette: { primary: { main: string } } }) => theme.palette.primary.main,
  };

  const renderFlightHeader = (flight: GolfFlightLeaders) =>
    flightLeaders.length > 1 ? (
      <Typography variant="h6" sx={flightHeaderSx}>
        {flight.flightName}
      </Typography>
    ) : null;

  const renderEmptyState = (message: string) => (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderLowScoresContent = () =>
    flightLeaders.map((flight, flightIndex) => {
      const rows = flight.lowActualScore.slice(0, 5);
      return (
        <Box key={flight.flightId} sx={{ mb: flightIndex < flightLeaders.length - 1 ? 3 : 0 }}>
          {renderFlightHeader(flight)}
          {rows.length > 0 ? (
            <TableContainer component={Paper} sx={tableContainerSx}>
              <Table size="small">
                {flightIndex === 0 && (
                  <TableHead>
                    <TableRow sx={headerRowSx}>
                      <TableCell sx={{ fontWeight: 600, width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 70 }}>
                        Score
                      </TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {rows.map((entry, index) => (
                    <TableRow key={entry.contactId} sx={getBodyRowSx(index)}>
                      <TableCell sx={{ color: 'text.secondary', width: 40 }}>
                        {entry.rank}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {renderPlayerName(entry.contactId, entry.firstName, entry.lastName)}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 70, ...valueCellSx }}>
                        {entry.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            renderEmptyState('No scores recorded yet.')
          )}
        </Box>
      );
    });

  const renderScoringAvgContent = () =>
    flightLeaders.map((flight, flightIndex) => {
      const rows = flight.scoringAverages.slice(0, 5);
      return (
        <Box key={flight.flightId} sx={{ mb: flightIndex < flightLeaders.length - 1 ? 3 : 0 }}>
          {renderFlightHeader(flight)}
          {rows.length > 0 ? (
            <TableContainer component={Paper} sx={tableContainerSx}>
              <Table size="small">
                {flightIndex === 0 && (
                  <TableHead>
                    <TableRow sx={headerRowSx}>
                      <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, width: 60 }}>
                        Rnds
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 80 }}>
                        Avg Score
                      </TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {rows.map((entry, index) => (
                    <TableRow key={entry.contactId} sx={getBodyRowSx(index)}>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {renderPlayerName(entry.contactId, entry.firstName, entry.lastName)}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 60, color: 'text.secondary' }}>
                        {entry.roundsPlayed}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 80, ...valueCellSx }}>
                        {entry.averageScore.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            renderEmptyState('No scoring averages available yet.')
          )}
        </Box>
      );
    });

  const renderSkinsContent = () =>
    flightLeaders.map((flight, flightIndex) => {
      const rows = (flight.skins ?? []).slice(0, 5);
      return (
        <Box key={flight.flightId} sx={{ mb: flightIndex < flightLeaders.length - 1 ? 3 : 0 }}>
          {renderFlightHeader(flight)}
          {rows.length > 0 ? (
            <TableContainer component={Paper} sx={tableContainerSx}>
              <Table size="small">
                {flightIndex === 0 && (
                  <TableHead>
                    <TableRow sx={headerRowSx}>
                      <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Team</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 90 }}>
                        Skins Won
                      </TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {rows.map((entry, index) => (
                    <TableRow key={`${entry.contactId}-${index}`} sx={getBodyRowSx(index)}>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {renderPlayerName(entry.contactId, entry.firstName, entry.lastName)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {entry.teamName ?? '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 90, ...valueCellSx }}>
                        {entry.skinsWon}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            renderEmptyState('No skins data available yet.')
          )}
        </Box>
      );
    });

  const renderBody = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="160px">
          <Typography variant="h6" color="text.secondary">
            Loading stats...
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {activeTab === 'lowScores' && renderLowScoresContent()}
        {activeTab === 'scoringAvg' && renderScoringAvgContent()}
        {activeTab === 'skins' && renderSkinsContent()}
      </Box>
    );
  };

  const headerContent = (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
        pb: 0,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: (theme) => theme.palette.widget.headerText, mb: 1.5 }}
      >
        {title}
      </Typography>
      <Tabs
        value={activeTab}
        onChange={(_e, val: StatTab) => setActiveTab(val)}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            px: 1.5,
            fontSize: '0.8rem',
            textTransform: 'none',
          },
        }}
      >
        <Tab value="lowScores" label="Low Scores" />
        <Tab value="scoringAvg" label="Scoring Avg" />
        <Tab value="skins" label="Skins" />
      </Tabs>
    </Box>
  );

  return (
    <WidgetShell accent="warning" disablePadding headerContent={headerContent}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>{renderBody()}</Box>
    </WidgetShell>
  );
}
