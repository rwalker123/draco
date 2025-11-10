'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Stack,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import Link from 'next/link';
import { getTeamRosterCard } from '@draco/shared-api-client';
import type { TeamRosterCardType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import AccountPageHeader from '@/components/AccountPageHeader';

interface RosterCardPageClientProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const MAX_LINEUP_ROWS = 15;

const RosterCardPageClient: React.FC<RosterCardPageClientProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const apiClient = useApiClient();
  const [data, setData] = useState<TeamRosterCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRosterCard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTeamRosterCard({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
      });
      const payload = unwrapApiResult(result, 'Unable to load roster card.');
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load roster card.';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId, teamSeasonId]);

  useEffect(() => {
    void fetchRosterCard();
  }, [fetchRosterCard]);

  const heading = useMemo(() => {
    if (!data) {
      return '';
    }
    const teamName = data.teamSeason?.name ?? 'Team';
    const leagueName = data.teamSeason?.leagueName;
    return leagueName ? `${leagueName} ${teamName}` : teamName;
  }, [data]);

  const rosterPlayers = useMemo(() => data?.players ?? [], [data?.players]);
  const rosterTitle = useMemo(() => {
    if (!data?.teamSeason) {
      return 'Roster';
    }
    const parts = [data.teamSeason.leagueName, data.teamSeason.name].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );
    return parts.length > 0 ? parts.join(' ') : 'Roster';
  }, [data?.teamSeason]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchRosterCard}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <Box
        className="print-root"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.default',
          color: 'text.primary',
          py: { xs: 2, md: 3 },
        }}
      >
        <Box
          className="print-container"
          sx={{
            width: '100%',
            maxWidth: 720,
            px: { xs: 2, md: 0 },
          }}
        >
          <Box className="print-hidden" sx={{ mb: 3 }}>
            <AccountPageHeader
              accountId={accountId}
              accountLogoUrl={data.account?.accountLogoUrl ?? undefined}
              seasonName={data.teamSeason?.seasonName ?? null}
              showSeasonInfo={Boolean(data.teamSeason?.seasonName)}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {heading}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`}
                  >
                    Team Home Page
                  </Button>
                </Stack>
              </Stack>
            </AccountPageHeader>
          </Box>
          <Divider className="print-hidden" sx={{ mb: 3 }} />

          <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: '0.95rem', md: '1rem' } }}>
            Date: _____________________ &nbsp;&nbsp;&nbsp; Start Time: _________________________
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {data.teamSeason?.name ?? 'Team'} ( Home / Visitor ) vs. _________________________ (
            Home / Visitor )
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            ( 7 innings / 9 innings )
          </Typography>

          <Box
            className="print-grid"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 2,
                width: '100%',
                '@media print': {
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  pageBreakInside: 'avoid',
                },
              }}
            >
              <Typography variant="h5" gutterBottom>
                Batting Order
              </Typography>
              <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '10%' }}>#</TableCell>
                    <TableCell sx={{ width: '15%' }}>A/B</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell sx={{ width: '15%' }}>CR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: MAX_LINEUP_ROWS }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                width: '100%',
                '@media print': {
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  pageBreakInside: 'avoid',
                },
              }}
            >
              <Typography variant="h5" gutterBottom>
                {rosterTitle}
              </Typography>
              <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '20%' }}>No.</TableCell>
                    <TableCell>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rosterPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.playerNumber ?? '-'}</TableCell>
                      <TableCell>{`${player.firstName} ${player.lastName}`.trim()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Box>
      </Box>
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.4in;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-root,
          .print-root * {
            visibility: visible !important;
          }

          .print-root {
            width: 100%;
          }

          .print-hidden {
            display: none !important;
          }

          .print-container {
            margin: 0 auto !important;
            padding: 0 !important;
            max-width: 620px !important;
          }

          .print-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }

          .print-container table {
            font-size: 10px !important;
          }

          .print-container h5,
          .print-container h4,
          .print-container h3 {
            margin-top: 8px !important;
            margin-bottom: 8px !important;
          }
        }
      `}</style>
    </>
  );
};

export default RosterCardPageClient;
