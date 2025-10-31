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
import StatisticsTable from '../../../../components/statistics/StatisticsTable';
import { Team } from '@/types/schedule';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  listSeasonTeams as apiListSeasonTeams,
  listTeamSeasonBattingStats as apiListTeamSeasonBattingStats,
  listTeamSeasonPitchingStats as apiListTeamSeasonPitchingStats,
} from '@draco/shared-api-client';
import type { PlayerBattingStatsType, PlayerPitchingStatsType } from '@draco/shared-schemas';

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
  const [battingStats, setBattingStats] = useState<PlayerBattingStatsType[]>([]);
  const [pitchingStats, setPitchingStats] = useState<PlayerPitchingStatsType[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    teams: false,
    batting: false,
    pitching: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [battingSortField, setBattingSortField] = useState<keyof PlayerBattingStatsType>('avg');
  const [battingSortOrder, setBattingSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pitchingSortField, setPitchingSortField] = useState<keyof PlayerPitchingStatsType>('era');
  const [pitchingSortOrder, setPitchingSortOrder] = useState<'asc' | 'desc'>('asc');
  const apiClient = useApiClient();

  const loadTeams = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading((prev) => ({ ...prev, teams: true }));
    setError(null);

    try {
      const result = await apiListSeasonTeams({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const teamSeasons = unwrapApiResult(result, 'Failed to load teams');
      const teamsData = (teamSeasons ?? []).map((teamSeason) => {
        const displayName = teamSeason.name ?? teamSeason.team?.webAddress ?? 'Unknown Team';
        return {
          id: teamSeason.id,
          teamId: teamSeason.id,
          name: displayName,
          teamName: displayName,
          logoUrl: teamSeason.team?.logoUrl ?? undefined,
          leagueName: teamSeason.league?.name ?? 'Unknown League',
          divisionName: teamSeason.division?.name ?? 'No Division',
        } satisfies Team;
      });

      setTeams(teamsData);

      if (teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].teamId);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setError('Failed to load teams');
    } finally {
      setLoading((prev) => ({ ...prev, teams: false }));
    }
  }, [accountId, seasonId, selectedTeamId, apiClient]);

  const loadBattingStats = useCallback(async () => {
    if (!selectedTeamId || !seasonId) return;

    setLoading((prev) => ({ ...prev, batting: true }));

    try {
      const result = await apiListTeamSeasonBattingStats({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId: selectedTeamId },
        throwOnError: false,
      });

      const data = unwrapApiResult<PlayerBattingStatsType[]>(
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

      const data = unwrapApiResult<PlayerPitchingStatsType[]>(
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

  const handleBattingSort = (field: keyof PlayerBattingStatsType) => {
    if (field === battingSortField) {
      setBattingSortOrder(battingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBattingSortField(field);
      // Default sort order for different types of stats
      const defaultDescFields: (keyof PlayerBattingStatsType)[] = [
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

  const handlePitchingSort = (field: keyof PlayerPitchingStatsType) => {
    if (field === pitchingSortField) {
      setPitchingSortOrder(pitchingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPitchingSortField(field);
      // Default sort order for pitching stats (lower is better for rates)
      const defaultAscFields: (keyof PlayerPitchingStatsType)[] = [
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
                variant="batting"
                extendedStats={false}
                data={sortedBattingStats}
                loading={loading.batting}
                emptyMessage="No batting statistics available"
                getRowKey={(stat) => stat.playerId}
                sortField={String(battingSortField)}
                sortOrder={battingSortOrder}
                onSort={(field) => handleBattingSort(field as keyof PlayerBattingStatsType)}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <StatisticsTable
                variant="pitching"
                extendedStats={false}
                data={sortedPitchingStats}
                loading={loading.pitching}
                emptyMessage="No pitching statistics available"
                getRowKey={(stat) => stat.playerId}
                sortField={String(pitchingSortField)}
                sortOrder={pitchingSortOrder}
                onSort={(field) => handlePitchingSort(field as keyof PlayerPitchingStatsType)}
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
