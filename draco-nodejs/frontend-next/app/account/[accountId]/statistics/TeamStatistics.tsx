'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import StatisticsTable, {
  formatBattingAverage,
  formatPercentage,
  formatERA,
  formatIPDecimal,
} from './StatisticsTable';
import { Team } from '@/types/schedule';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  listTeamSeasonBattingStats as apiListTeamSeasonBattingStats,
  listTeamSeasonPitchingStats as apiListTeamSeasonPitchingStats,
} from '@draco/shared-api-client';
import type {
  PlayerBattingStatsBriefType,
  PlayerPitchingStatsBriefType,
} from '@draco/shared-schemas';

interface BattingStatsRow extends PlayerBattingStatsBriefType {
  teamName?: string;
  hbp?: number;
  sb?: number;
  sf?: number;
  sh?: number;
  tb?: number;
  pa?: number;
  [key: string]: unknown;
}

interface PitchingStatsRow extends PlayerPitchingStatsBriefType {
  teamName?: string;
  ip2?: number;
  hr?: number;
  bf?: number;
  wp?: number;
  hbp?: number;
  k9?: number;
  bb9?: number;
  oba?: number;
  slg?: number;
  ipDecimal?: number;
  [key: string]: unknown;
}

// Column configurations matching the exact order from BattingStatistics
const BATTING_COLUMNS = [
  { field: 'playerName' as const, label: 'Player', align: 'left' as const, sortable: false },
  { field: 'ab' as const, label: 'AB', align: 'right' as const, tooltip: 'At Bats' },
  { field: 'h' as const, label: 'H', align: 'right' as const, tooltip: 'Hits' },
  { field: 'r' as const, label: 'R', align: 'right' as const, tooltip: 'Runs' },
  { field: 'd' as const, label: '2B', align: 'right' as const, tooltip: 'Doubles' },
  { field: 't' as const, label: '3B', align: 'right' as const, tooltip: 'Triples' },
  { field: 'hr' as const, label: 'HR', align: 'right' as const, tooltip: 'Home Runs' },
  { field: 'rbi' as const, label: 'RBI', align: 'right' as const, tooltip: 'Runs Batted In' },
  { field: 'bb' as const, label: 'BB', align: 'right' as const, tooltip: 'Walks' },
  { field: 'so' as const, label: 'SO', align: 'right' as const, tooltip: 'Strikeouts' },
  { field: 'sb' as const, label: 'SB', align: 'right' as const, tooltip: 'Stolen Bases' },
  {
    field: 'avg' as const,
    label: 'AVG',
    align: 'right' as const,
    tooltip: 'Batting Average',
    primary: true,
    formatter: formatBattingAverage,
  },
  {
    field: 'obp' as const,
    label: 'OBP',
    align: 'right' as const,
    tooltip: 'On-Base Percentage',
    formatter: formatPercentage,
  },
  {
    field: 'slg' as const,
    label: 'SLG',
    align: 'right' as const,
    tooltip: 'Slugging Percentage',
    formatter: formatPercentage,
  },
  {
    field: 'ops' as const,
    label: 'OPS',
    align: 'right' as const,
    tooltip: 'On-Base Plus Slugging',
    formatter: formatPercentage,
  },
];

const PITCHING_COLUMNS = [
  { field: 'playerName' as const, label: 'Player', align: 'left' as const, sortable: false },
  { field: 'w' as const, label: 'W', align: 'right' as const, tooltip: 'Wins' },
  { field: 'l' as const, label: 'L', align: 'right' as const, tooltip: 'Losses' },
  { field: 's' as const, label: 'S', align: 'right' as const, tooltip: 'Saves' },
  {
    field: 'ipDecimal' as const,
    label: 'IP',
    align: 'right' as const,
    tooltip: 'Innings Pitched',
    formatter: formatIPDecimal,
  },
  { field: 'h' as const, label: 'H', align: 'right' as const, tooltip: 'Hits Allowed' },
  { field: 'r' as const, label: 'R', align: 'right' as const, tooltip: 'Runs Allowed' },
  { field: 'er' as const, label: 'ER', align: 'right' as const, tooltip: 'Earned Runs' },
  { field: 'bb' as const, label: 'BB', align: 'right' as const, tooltip: 'Walks' },
  { field: 'so' as const, label: 'SO', align: 'right' as const, tooltip: 'Strikeouts' },
  { field: 'hr' as const, label: 'HR', align: 'right' as const, tooltip: 'Home Runs Allowed' },
  {
    field: 'era' as const,
    label: 'ERA',
    align: 'right' as const,
    tooltip: 'Earned Run Average',
    primary: true,
    formatter: formatERA,
  },
  {
    field: 'whip' as const,
    label: 'WHIP',
    align: 'right' as const,
    tooltip: 'Walks + Hits per Inning Pitched',
    formatter: formatERA,
  },
  {
    field: 'k9' as const,
    label: 'K/9',
    align: 'right' as const,
    tooltip: 'Strikeouts per 9 Innings',
    formatter: formatERA,
  },
  {
    field: 'bb9' as const,
    label: 'BB/9',
    align: 'right' as const,
    tooltip: 'Walks per 9 Innings',
    formatter: formatERA,
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-stats-tabpanel-${index}`}
      aria-labelledby={`team-stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface TeamStatisticsProps {
  accountId: string;
  seasonId: string;
}

export default function TeamStatistics({ accountId, seasonId }: TeamStatisticsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [battingStats, setBattingStats] = useState<BattingStatsRow[]>([]);
  const [pitchingStats, setPitchingStats] = useState<PitchingStatsRow[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    teams: false,
    batting: false,
    pitching: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [battingSortField, setBattingSortField] = useState<keyof BattingStatsRow>('avg');
  const [battingSortOrder, setBattingSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pitchingSortField, setPitchingSortField] = useState<keyof PitchingStatsRow>('era');
  const [pitchingSortOrder, setPitchingSortOrder] = useState<'asc' | 'desc'>('asc');
  const apiClient = useApiClient();

  const loadTeams = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading((prev) => ({ ...prev, teams: true }));
    setError(null);

    try {
      const response = await fetch(`/api/accounts/${accountId}/seasons/${seasonId}/teams`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the API response structure to match expected format
        const rawTeams = data.data?.teams || [];
        const teamsData = rawTeams.map(
          (team: {
            id: string;
            name: string;
            teamId: string;
            league?: { name: string };
            division?: { name: string } | null;
          }) => ({
            teamId: team.id, // Use team season ID for API calls
            teamName: team.name,
            leagueName: team.league?.name || 'Unknown League',
            divisionName: team.division?.name || 'No Division',
          }),
        );
        setTeams(teamsData);

        // Auto-select first team if available
        if (teamsData.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamsData[0].teamId);
        }
      } else {
        throw new Error('Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setError('Failed to load teams');
    } finally {
      setLoading((prev) => ({ ...prev, teams: false }));
    }
  }, [accountId, seasonId, selectedTeamId]);

  const loadBattingStats = useCallback(async () => {
    if (!selectedTeamId || !seasonId) return;

    setLoading((prev) => ({ ...prev, batting: true }));

    try {
      const result = await apiListTeamSeasonBattingStats({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId: selectedTeamId },
        throwOnError: false,
      });

      const data = unwrapApiResult<PlayerBattingStatsBriefType[]>(
        result,
        'Failed to load batting stats',
      );

      setBattingStats(data.map((stat) => ({ ...stat })));
    } catch (fetchError) {
      console.error('Error loading batting stats:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load batting stats');
    } finally {
      setLoading((prev) => ({ ...prev, batting: false }));
    }
  }, [accountId, apiClient, seasonId, selectedTeamId]);

  const loadPitchingStats = useCallback(async () => {
    if (!selectedTeamId || !seasonId) return;

    setLoading((prev) => ({ ...prev, pitching: true }));

    try {
      const result = await apiListTeamSeasonPitchingStats({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId: selectedTeamId },
        throwOnError: false,
      });

      const data = unwrapApiResult<PlayerPitchingStatsBriefType[]>(
        result,
        'Failed to load pitching stats',
      );

      setPitchingStats(data.map((stat) => ({ ...stat })));
    } catch (fetchError) {
      console.error('Error loading pitching stats:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load pitching stats');
    } finally {
      setLoading((prev) => ({ ...prev, pitching: false }));
    }
  }, [accountId, apiClient, seasonId, selectedTeamId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      loadBattingStats();
      loadPitchingStats();
    }
  }, [selectedTeamId, loadBattingStats, loadPitchingStats]);

  const handleTeamChange = (event: SelectChangeEvent) => {
    const teamId = event.target.value;
    setSelectedTeamId(teamId);
    setBattingStats([]);
    setPitchingStats([]);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBattingSort = (field: keyof BattingStatsRow) => {
    if (field === battingSortField) {
      setBattingSortOrder(battingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBattingSortField(field);
      // Default sort order for different types of stats
      const defaultDescFields: (keyof BattingStatsRow)[] = [
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
      setBattingSortOrder(defaultDescFields.includes(field) ? 'desc' : 'asc');
    }
  };

  const handlePitchingSort = (field: keyof PitchingStatsRow) => {
    if (field === pitchingSortField) {
      setPitchingSortOrder(pitchingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPitchingSortField(field);
      // Default sort order for pitching stats (lower is better for rates)
      const defaultAscFields: (keyof PitchingStatsRow)[] = [
        'era',
        'whip',
        'bb9',
        'l',
        'h',
        'r',
        'er',
        'bb',
      ];
      setPitchingSortOrder(defaultAscFields.includes(field) ? 'asc' : 'desc');
    }
  };

  const selectedTeam = Array.isArray(teams)
    ? teams.find((team) => team.teamId === selectedTeamId)
    : null;

  // Sort the batting stats
  const sortedBattingStats = [...battingStats].sort((a, b) => {
    const aValue = a[battingSortField];
    const bValue = b[battingSortField];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return battingSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    return battingSortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  // Sort the pitching stats
  const sortedPitchingStats = [...pitchingStats].sort((a, b) => {
    const aValue = a[pitchingSortField];
    const bValue = b[pitchingSortField];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return pitchingSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    return pitchingSortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Team Statistics
      </Typography>

      {/* Team Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="team-select-label">Select Team</InputLabel>
            <Select
              labelId="team-select-label"
              value={selectedTeamId}
              label="Select Team"
              onChange={handleTeamChange}
              disabled={loading.teams}
            >
              {Array.isArray(teams)
                ? teams.map((team) => (
                    <MenuItem key={team.teamId} value={team.teamId}>
                      {team.teamName} ({team.leagueName} - {team.divisionName})
                    </MenuItem>
                  ))
                : null}
            </Select>
          </FormControl>

          {selectedTeam && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedTeam.teamName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTeam.leagueName} League • {selectedTeam.divisionName} Division
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedTeamId && (
        <>
          {/* Tabs */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="team statistics tabs">
                <Tab label="Batting" id="team-stats-tab-0" />
                <Tab label="Pitching" id="team-stats-tab-1" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <StatisticsTable
                data={sortedBattingStats}
                columns={BATTING_COLUMNS}
                loading={loading.batting}
                emptyMessage="No batting statistics available"
                getRowKey={(stat) => stat.playerId}
                sortField={battingSortField}
                sortOrder={battingSortOrder}
                onSort={handleBattingSort}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <StatisticsTable
                data={sortedPitchingStats}
                columns={PITCHING_COLUMNS}
                loading={loading.pitching}
                emptyMessage="No pitching statistics available"
                getRowKey={(stat) => stat.playerId}
                sortField={pitchingSortField}
                sortOrder={pitchingSortOrder}
                onSort={handlePitchingSort}
              />
            </TabPanel>
          </Paper>
        </>
      )}

      {!selectedTeamId && !loading.teams && Array.isArray(teams) && teams.length === 0 && (
        <Alert severity="info">No teams found for the selected season.</Alert>
      )}
    </Box>
  );
}
