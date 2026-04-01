'use client';

import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  getGolfFlightLeaders,
  getGolfFlightScoreTypes,
  getGolfClosestToPinForFlight,
  getGolfFlightPuttContest,
} from '@draco/shared-api-client';
import type {
  GolfFlightLeadersType,
  GolfLeaderboardType,
  GolfClosestToPinEntryType,
  GolfPuttContestEntryType,
} from '@draco/shared-schemas';
import AccountPageHeader from '../../AccountPageHeader';
import { AdminBreadcrumbs } from '../../admin';
import { useApiClient } from '../../../hooks/useApiClient';
import SkinsLeaderboard from './SkinsLeaderboard';

interface FlightStatsPageProps {
  accountId: string;
  seasonId: string;
  flightId: string;
  flightName: string;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}

function ScoringTab({
  accountId,
  flightId,
  activated,
}: {
  accountId: string;
  flightId: string;
  activated: boolean;
}) {
  const apiClient = useApiClient();
  const [data, setData] = useState<GolfFlightLeadersType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activated || !accountId || !flightId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfFlightLeaders({
          client: apiClient,
          path: { accountId, flightId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load scoring data');
        } else {
          setData(result.data ?? null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load scoring data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [activated, accountId, flightId, apiClient]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!data) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No scoring data available
      </Typography>
    );
  }

  return (
    <Box>
      {data.lowActualScore.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Low Actual Scores
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.lowActualScore.map((entry) => (
                <TableRow key={entry.contactId}>
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell>
                    {entry.firstName} {entry.lastName}
                  </TableCell>
                  <TableCell>{entry.teamName ?? '—'}</TableCell>
                  <TableCell align="right">{entry.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {data.lowNetScore.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Low Net Scores
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Net Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.lowNetScore.map((entry) => (
                <TableRow key={entry.contactId}>
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell>
                    {entry.firstName} {entry.lastName}
                  </TableCell>
                  <TableCell>{entry.teamName ?? '—'}</TableCell>
                  <TableCell align="right">{entry.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {data.scoringAverages.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Scoring Averages
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Rounds</TableCell>
                <TableCell align="right">Avg Score</TableCell>
                <TableCell align="right">Avg Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.scoringAverages.map((entry) => (
                <TableRow key={entry.contactId}>
                  <TableCell>
                    {entry.firstName} {entry.lastName}
                  </TableCell>
                  <TableCell>{entry.teamName ?? '—'}</TableCell>
                  <TableCell align="right">{entry.roundsPlayed}</TableCell>
                  <TableCell align="right">{entry.averageScore.toFixed(1)}</TableCell>
                  <TableCell align="right">
                    {entry.averageNetScore !== undefined ? entry.averageNetScore.toFixed(1) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

function ScoreTypesTab({
  accountId,
  flightId,
  activated,
}: {
  accountId: string;
  flightId: string;
  activated: boolean;
}) {
  const apiClient = useApiClient();
  const [data, setData] = useState<GolfLeaderboardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activated || !accountId || !flightId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfFlightScoreTypes({
          client: apiClient,
          path: { accountId, flightId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load score type data');
        } else {
          setData(result.data ?? []);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load score type data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [activated, accountId, flightId, apiClient]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No score type data available
      </Typography>
    );
  }

  return (
    <Box>
      {data.map((board) => (
        <Box key={board.category} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {board.categoryLabel}
          </Typography>
          {board.leaders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No leaders
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {board.leaders.map((entry) => (
                  <TableRow key={entry.contactId}>
                    <TableCell>{entry.rank}</TableCell>
                    <TableCell>
                      {entry.firstName} {entry.lastName}
                    </TableCell>
                    <TableCell>{entry.teamName ?? '—'}</TableCell>
                    <TableCell align="right">{entry.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      ))}
    </Box>
  );
}

function ClosestToPinTab({
  accountId,
  flightId,
  activated,
}: {
  accountId: string;
  flightId: string;
  activated: boolean;
}) {
  const apiClient = useApiClient();
  const [data, setData] = useState<GolfClosestToPinEntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activated || !accountId || !flightId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfClosestToPinForFlight({
          client: apiClient,
          path: { accountId, flightId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load closest to pin data');
        } else {
          setData(result.data ?? []);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load closest to pin data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [activated, accountId, flightId, apiClient]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No closest to pin entries
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Hole</TableCell>
          <TableCell>Player</TableCell>
          <TableCell align="right">Distance</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Week</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.holeNumber}</TableCell>
            <TableCell>
              {entry.firstName} {entry.lastName}
            </TableCell>
            <TableCell align="right">
              {entry.distance} {entry.unit}
            </TableCell>
            <TableCell>{entry.matchDate}</TableCell>
            <TableCell>{entry.weekNumber ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PuttContestTab({
  accountId,
  flightId,
  activated,
  weekNumber,
}: {
  accountId: string;
  flightId: string;
  activated: boolean;
  weekNumber?: number;
}) {
  const apiClient = useApiClient();
  const [data, setData] = useState<GolfPuttContestEntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activated || !accountId || !flightId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfFlightPuttContest({
          client: apiClient,
          path: { accountId, flightId },
          query: { weekNumber },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load putt contest data');
        } else {
          setData(result.data ?? []);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load putt contest data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [activated, accountId, flightId, weekNumber, apiClient]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No putt contest entries
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Player</TableCell>
          <TableCell align="right">Hole</TableCell>
          <TableCell align="right">Putts</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Week</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((entry, index) => (
          <TableRow key={`${entry.contactId}-${entry.matchId}-${entry.holeNumber}-${index}`}>
            <TableCell>
              {entry.firstName} {entry.lastName}
            </TableCell>
            <TableCell align="right">{entry.holeNumber}</TableCell>
            <TableCell align="right">{entry.putts}</TableCell>
            <TableCell>{entry.matchDate}</TableCell>
            <TableCell>{entry.weekNumber ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const TAB_SCORING = 0;
const TAB_SKINS = 1;
const TAB_SCORE_TYPES = 2;
const TAB_CTP = 3;
const TAB_PUTT_CONTEST = 4;

export default function FlightStatsPage({
  accountId,
  seasonId,
  flightId,
  flightName,
}: FlightStatsPageProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [activatedTabs, setActivatedTabs] = useState<Set<number>>(new Set([0]));
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setActivatedTabs((prev) => new Set([...prev, newValue]));
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          {flightName} Stats
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Flight statistics and leaderboards
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          links={[
            { name: 'Season Management', href: `/account/${accountId}/seasons` },
            {
              name: 'Flights',
              href: `/account/${accountId}/seasons/${seasonId}/golf/flights`,
            },
          ]}
          currentPage={`${flightName} Stats`}
        />

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Week</InputLabel>
            <Select<number | ''>
              value={selectedWeek ?? ''}
              onChange={(e) =>
                setSelectedWeek(e.target.value === '' ? undefined : Number(e.target.value))
              }
              label="Week"
            >
              <MenuItem value="">All Weeks</MenuItem>
              {Array.from({ length: 20 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  Week {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Scoring" />
            <Tab label="Skins" />
            <Tab label="Score Types" />
            <Tab label="Closest to Pin" />
            <Tab label="Putt Contest" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={TAB_SCORING}>
          <ScoringTab
            accountId={accountId}
            flightId={flightId}
            activated={activatedTabs.has(TAB_SCORING)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={TAB_SKINS}>
          <SkinsLeaderboard accountId={accountId} flightId={flightId} weekNumber={selectedWeek} />
        </TabPanel>

        <TabPanel value={activeTab} index={TAB_SCORE_TYPES}>
          <ScoreTypesTab
            accountId={accountId}
            flightId={flightId}
            activated={activatedTabs.has(TAB_SCORE_TYPES)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={TAB_CTP}>
          <ClosestToPinTab
            accountId={accountId}
            flightId={flightId}
            activated={activatedTabs.has(TAB_CTP)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={TAB_PUTT_CONTEST}>
          <PuttContestTab
            accountId={accountId}
            flightId={flightId}
            activated={activatedTabs.has(TAB_PUTT_CONTEST)}
            weekNumber={selectedWeek}
          />
        </TabPanel>
      </Container>
    </main>
  );
}
