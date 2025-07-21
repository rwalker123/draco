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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

interface Team {
  teamId: string;
  teamName: string;
  leagueName: string;
  divisionName: string;
}

interface BattingStatsRow {
  playerId: string;
  playerName: string;
  teamName: string;
  ab: number;
  h: number;
  r: number;
  d: number;
  t: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  sf: number;
  sh: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  tb: number;
  pa: number;
}

interface PitchingStatsRow {
  playerId: string;
  playerName: string;
  teamName: string;
  ip: number;
  ip2: number;
  w: number;
  l: number;
  s: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  bf: number;
  wp: number;
  hbp: number;
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  oba: number;
  slg: number;
  ipDecimal: number;
}

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
      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${selectedTeamId}/batting-stats`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBattingStats(data.data || []);
      } else {
        throw new Error('Failed to fetch batting stats');
      }
    } catch (error) {
      console.error('Error loading batting stats:', error);
      setError('Failed to load batting stats');
    } finally {
      setLoading((prev) => ({ ...prev, batting: false }));
    }
  }, [accountId, selectedTeamId, seasonId]);

  const loadPitchingStats = useCallback(async () => {
    if (!selectedTeamId || !seasonId) return;

    setLoading((prev) => ({ ...prev, pitching: true }));

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${selectedTeamId}/pitching-stats`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPitchingStats(data.data || []);
      } else {
        throw new Error('Failed to fetch pitching stats');
      }
    } catch (error) {
      console.error('Error loading pitching stats:', error);
      setError('Failed to load pitching stats');
    } finally {
      setLoading((prev) => ({ ...prev, pitching: false }));
    }
  }, [accountId, selectedTeamId, seasonId]);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatBattingAverage = (avg: number) => avg.toFixed(3);
  const formatPercentage = (pct: number) => pct.toFixed(3);
  const formatERA = (era: number) => era.toFixed(2);
  const formatIP = (ip: number, ip2: number) => {
    const totalInnings = ip + ip2 / 3;
    return totalInnings.toFixed(1);
  };

  const selectedTeam = Array.isArray(teams)
    ? teams.find((team) => team.teamId === selectedTeamId)
    : null;

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
              {loading.batting ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">AVG</TableCell>
                        <TableCell align="right">AB</TableCell>
                        <TableCell align="right">H</TableCell>
                        <TableCell align="right">R</TableCell>
                        <TableCell align="right">HR</TableCell>
                        <TableCell align="right">RBI</TableCell>
                        <TableCell align="right">BB</TableCell>
                        <TableCell align="right">SO</TableCell>
                        <TableCell align="right">OBP</TableCell>
                        <TableCell align="right">SLG</TableCell>
                        <TableCell align="right">OPS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {battingStats.map((stat) => (
                        <TableRow key={stat.playerId} hover>
                          <TableCell component="th" scope="row">
                            {stat.playerName}
                          </TableCell>
                          <TableCell align="right">{formatBattingAverage(stat.avg)}</TableCell>
                          <TableCell align="right">{stat.ab}</TableCell>
                          <TableCell align="right">{stat.h}</TableCell>
                          <TableCell align="right">{stat.r}</TableCell>
                          <TableCell align="right">{stat.hr}</TableCell>
                          <TableCell align="right">{stat.rbi}</TableCell>
                          <TableCell align="right">{stat.bb}</TableCell>
                          <TableCell align="right">{stat.so}</TableCell>
                          <TableCell align="right">{formatPercentage(stat.obp)}</TableCell>
                          <TableCell align="right">{formatPercentage(stat.slg)}</TableCell>
                          <TableCell align="right">{formatPercentage(stat.ops)}</TableCell>
                        </TableRow>
                      ))}
                      {battingStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={12} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No batting statistics available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {loading.pitching ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">ERA</TableCell>
                        <TableCell align="right">W</TableCell>
                        <TableCell align="right">L</TableCell>
                        <TableCell align="right">IP</TableCell>
                        <TableCell align="right">H</TableCell>
                        <TableCell align="right">R</TableCell>
                        <TableCell align="right">ER</TableCell>
                        <TableCell align="right">BB</TableCell>
                        <TableCell align="right">SO</TableCell>
                        <TableCell align="right">WHIP</TableCell>
                        <TableCell align="right">K/9</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pitchingStats.map((stat) => (
                        <TableRow key={stat.playerId} hover>
                          <TableCell component="th" scope="row">
                            {stat.playerName}
                          </TableCell>
                          <TableCell align="right">{formatERA(stat.era)}</TableCell>
                          <TableCell align="right">{stat.w}</TableCell>
                          <TableCell align="right">{stat.l}</TableCell>
                          <TableCell align="right">{formatIP(stat.ip, stat.ip2)}</TableCell>
                          <TableCell align="right">{stat.h}</TableCell>
                          <TableCell align="right">{stat.r}</TableCell>
                          <TableCell align="right">{stat.er}</TableCell>
                          <TableCell align="right">{stat.bb}</TableCell>
                          <TableCell align="right">{stat.so}</TableCell>
                          <TableCell align="right">{formatPercentage(stat.whip)}</TableCell>
                          <TableCell align="right">{formatERA(stat.k9)}</TableCell>
                        </TableRow>
                      ))}
                      {pitchingStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={12} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No pitching statistics available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
