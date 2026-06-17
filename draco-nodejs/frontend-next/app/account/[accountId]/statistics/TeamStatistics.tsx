'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StatisticsTable from '../../../../components/statistics/StatisticsTable';
import GameListCard, { type SortOrder } from '@/components/team-stats-entry/GameListCard';
import BattingStatsViewTable from '@/components/team-stats-entry/BattingStatsViewTable';
import PitchingStatsViewTable from '@/components/team-stats-entry/PitchingStatsViewTable';
import { TeamStatsEntryService } from '@/services/teamStatsEntryService';
import { Team } from '@/types/schedule';
import { useApiClient } from '@/hooks/useApiClient';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useAuth } from '@/context/AuthContext';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  listSeasonTeams as apiListSeasonTeams,
  listMyTeamSeasons as apiListMyTeamSeasons,
  listTeamSeasonBattingStats as apiListTeamSeasonBattingStats,
  listTeamSeasonPitchingStats as apiListTeamSeasonPitchingStats,
  listAllTimeTeams as apiListAllTimeTeams,
  listAllTimeTeamBattingStats as apiListAllTimeTeamBattingStats,
  listAllTimeTeamPitchingStats as apiListAllTimeTeamPitchingStats,
  exportTeamBattingStatistics,
  exportTeamPitchingStatistics,
  exportAllTimeTeamBattingStatistics,
  exportAllTimeTeamPitchingStatistics,
} from '@draco/shared-api-client';
import { downloadBlob, sanitizeDownloadName } from '@/utils/downloadUtils';
import type {
  AllTimeTeamSummaryType,
  GameBattingStatsType,
  GamePitchingStatsType,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
  RosterSeasonMembershipListType,
  TeamCompletedGameType,
} from '@draco/shared-schemas';

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
  const [games, setGames] = useState<TeamCompletedGameType[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [gameSortOrder, setGameSortOrder] = useState<SortOrder>('desc');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [displayedGame, setDisplayedGame] = useState<{
    gameId: string;
    batting: GameBattingStatsType;
    pitching: GamePitchingStatsType;
  } | null>(null);
  const [gameStatsError, setGameStatsError] = useState<string | null>(null);
  const apiClient = useApiClient();
  const { token } = useAuth();
  const { teams: userTeams, initialized: userTeamsInitialized } = useUserTeams(accountId);
  const [seasonMyTeamIds, setSeasonMyTeamIds] = useState<Set<string>>(new Set());
  const [seasonMyTeamsInitialized, setSeasonMyTeamsInitialized] = useState(false);

  const isAllTime = seasonId === '0';

  const myOverallTeamIds = new Set(
    userTeams.map((team) => team.team?.id).filter((id): id is string => Boolean(id)),
  );

  const isMyTeam = (team: Team): boolean =>
    isAllTime
      ? Boolean(team.overallTeamId && myOverallTeamIds.has(team.overallTeamId))
      : Boolean(team.teamId && seasonMyTeamIds.has(team.teamId));

  useEffect(() => {
    setSelectedTeamId('');
    setTeams([]);
    setBattingStats([]);
    setPitchingStats([]);
    setError(null);

    if (!seasonId) return;

    const controller = new AbortController();

    setLoading((prev) => ({ ...prev, teams: true }));

    const loadTeams = async () => {
      try {
        let teamsData: Team[];

        if (isAllTime) {
          const result = await apiListAllTimeTeams({
            client: apiClient,
            path: { accountId },
            signal: controller.signal,
            throwOnError: false,
          });

          if (controller.signal.aborted) return;

          const allTimeTeams = unwrapApiResult<AllTimeTeamSummaryType[]>(
            result,
            'Failed to load teams',
          );
          teamsData = (allTimeTeams ?? [])
            .map((team) => {
              const displayNames =
                team.names.length <= 3
                  ? team.names.join(', ')
                  : team.names.slice(0, 3).join(', ') + ', ...';
              const leagueLabel = team.leagueNames.join(', ');
              const remaining = team.seasonNames.length - 3;
              const seasonLabel =
                team.seasonNames.length <= 3
                  ? team.seasonNames.join(', ')
                  : team.seasonNames.slice(0, 3).join(', ') + `, ${remaining} more...`;
              return {
                id: team.teamId,
                teamId: team.teamId,
                overallTeamId: team.teamId,
                name: displayNames,
                teamName: displayNames,
                logoUrl: team.logoUrl ?? undefined,
                leagueName: leagueLabel,
                divisionName: seasonLabel,
              } satisfies Team;
            })
            .sort((a, b) => {
              const leagueCmp = (a.leagueName ?? '').localeCompare(b.leagueName ?? '');
              if (leagueCmp !== 0) return leagueCmp;
              return (a.teamName ?? '').localeCompare(b.teamName ?? '');
            });
        } else {
          const result = await apiListSeasonTeams({
            client: apiClient,
            path: { accountId, seasonId },
            signal: controller.signal,
            throwOnError: false,
          });

          if (controller.signal.aborted) return;

          const teamSeasons = unwrapApiResult(result, 'Failed to load teams');
          teamsData = (teamSeasons ?? []).map((teamSeason) => {
            const displayName = teamSeason.name ?? teamSeason.team?.webAddress ?? 'Unknown Team';
            return {
              id: teamSeason.id,
              teamId: teamSeason.id,
              overallTeamId: teamSeason.team?.id,
              name: displayName,
              teamName: displayName,
              logoUrl: teamSeason.team?.logoUrl ?? undefined,
              leagueName: teamSeason.league?.name ?? 'Unknown League',
              divisionName: teamSeason.division?.name ?? 'No Division',
            } satisfies Team;
          });
        }

        setTeams(teamsData);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Error loading teams:', err);
        setError('Failed to load teams');
      } finally {
        if (!controller.signal.aborted) {
          setLoading((prev) => ({ ...prev, teams: false }));
        }
      }
    };

    loadTeams();
    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, isAllTime, apiClient]);

  useEffect(() => {
    setSeasonMyTeamIds(new Set());
    setSeasonMyTeamsInitialized(false);

    if (isAllTime || !seasonId || !token) {
      setSeasonMyTeamsInitialized(true);
      return;
    }

    const controller = new AbortController();

    const loadMyTeams = async () => {
      try {
        const result = await apiListMyTeamSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const memberships = unwrapApiResult<RosterSeasonMembershipListType>(
          result,
          'Failed to load your teams',
        );
        setSeasonMyTeamIds(new Set(memberships.map((membership) => membership.teamSeasonId)));
      } catch {
        if (controller.signal.aborted) return;
        setSeasonMyTeamIds(new Set());
      } finally {
        if (!controller.signal.aborted) {
          setSeasonMyTeamsInitialized(true);
        }
      }
    };

    void loadMyTeams();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, isAllTime, token, apiClient]);

  useEffect(() => {
    if (selectedTeamId || teams.length === 0) return;

    const ready = isAllTime ? userTeamsInitialized : seasonMyTeamsInitialized;
    if (!ready) return;

    const overallIds = new Set(
      userTeams.map((team) => team.team?.id).filter((id): id is string => Boolean(id)),
    );
    const myTeam = teams.find((team) =>
      isAllTime
        ? Boolean(team.overallTeamId && overallIds.has(team.overallTeamId))
        : Boolean(team.teamId && seasonMyTeamIds.has(team.teamId)),
    );
    const target = myTeam ?? teams[0];

    if (target?.teamId) {
      setSelectedTeamId(target.teamId);
    }
  }, [
    teams,
    selectedTeamId,
    isAllTime,
    userTeamsInitialized,
    seasonMyTeamsInitialized,
    userTeams,
    seasonMyTeamIds,
  ]);

  useEffect(() => {
    if (!selectedTeamId || !seasonId) return;

    const controller = new AbortController();

    setLoading((prev) => ({ ...prev, batting: true, pitching: true }));

    const loadStats = async () => {
      try {
        let battingResult, pitchingResult;

        if (isAllTime) {
          [battingResult, pitchingResult] = await Promise.all([
            apiListAllTimeTeamBattingStats({
              client: apiClient,
              path: { accountId, teamId: selectedTeamId },
              signal: controller.signal,
              throwOnError: false,
            }),
            apiListAllTimeTeamPitchingStats({
              client: apiClient,
              path: { accountId, teamId: selectedTeamId },
              signal: controller.signal,
              throwOnError: false,
            }),
          ]);
        } else {
          [battingResult, pitchingResult] = await Promise.all([
            apiListTeamSeasonBattingStats({
              client: apiClient,
              path: { accountId, seasonId, teamSeasonId: selectedTeamId },
              signal: controller.signal,
              throwOnError: false,
            }),
            apiListTeamSeasonPitchingStats({
              client: apiClient,
              path: { accountId, seasonId, teamSeasonId: selectedTeamId },
              signal: controller.signal,
              throwOnError: false,
            }),
          ]);
        }

        if (controller.signal.aborted) return;

        const battingData = unwrapApiResult<PlayerBattingStatsType[]>(
          battingResult,
          'Failed to load batting stats',
        );
        setBattingStats(battingData.map((stat) => ({ ...stat })));

        const pitchingData = unwrapApiResult<PlayerPitchingStatsType[]>(
          pitchingResult,
          'Failed to load pitching stats',
        );
        setPitchingStats(pitchingData.map((stat) => ({ ...stat })));
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        console.error('Error loading stats:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load stats');
      } finally {
        if (!controller.signal.aborted) {
          setLoading((prev) => ({ ...prev, batting: false, pitching: false }));
        }
      }
    };

    loadStats();
    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, isAllTime, selectedTeamId, apiClient]);

  useEffect(() => {
    setGames([]);
    setSelectedGameId(null);
    setGamesError(null);

    if (isAllTime || !selectedTeamId || !seasonId) {
      setGamesLoading(false);
      return;
    }

    const controller = new AbortController();
    setGamesLoading(true);

    const loadGames = async () => {
      try {
        const service = new TeamStatsEntryService(null, apiClient);
        const data = await service.listCompletedGames(
          accountId,
          seasonId,
          selectedTeamId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setGames(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setGamesError(err instanceof Error ? err.message : 'Failed to load completed games');
        setGames([]);
      } finally {
        if (!controller.signal.aborted) {
          setGamesLoading(false);
        }
      }
    };

    void loadGames();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, isAllTime, selectedTeamId, apiClient]);

  useEffect(() => {
    if (!selectedGameId || !seasonId || !selectedTeamId) {
      setDisplayedGame(null);
      setGameStatsError(null);
      return;
    }

    const controller = new AbortController();
    setGameStatsError(null);

    const loadGameStats = async () => {
      try {
        const service = new TeamStatsEntryService(null, apiClient);
        const [batting, pitching] = await Promise.all([
          service.getGameBattingStats(
            accountId,
            seasonId,
            selectedTeamId,
            selectedGameId,
            controller.signal,
          ),
          service.getGamePitchingStats(
            accountId,
            seasonId,
            selectedTeamId,
            selectedGameId,
            controller.signal,
          ),
        ]);
        if (controller.signal.aborted) return;
        setDisplayedGame({ gameId: selectedGameId, batting, pitching });
      } catch (err) {
        if (controller.signal.aborted) return;
        setGameStatsError(err instanceof Error ? err.message : 'Failed to load game statistics');
      }
    };

    void loadGameStats();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, selectedTeamId, selectedGameId, apiClient]);

  const handleTeamChange = (event: SelectChangeEvent) => {
    const teamId = event.target.value;
    setSelectedTeamId(teamId);
    setError(null);
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

  const handleExport = async (type: 'batting' | 'pitching') => {
    if (!selectedTeamId) {
      return;
    }

    let result;
    if (isAllTime) {
      result =
        type === 'batting'
          ? await exportAllTimeTeamBattingStatistics({
              client: apiClient,
              path: { accountId, teamId: selectedTeamId },
              parseAs: 'blob',
              throwOnError: false,
            })
          : await exportAllTimeTeamPitchingStatistics({
              client: apiClient,
              path: { accountId, teamId: selectedTeamId },
              parseAs: 'blob',
              throwOnError: false,
            });
    } else {
      result =
        type === 'batting'
          ? await exportTeamBattingStatistics({
              client: apiClient,
              path: { accountId, seasonId, teamSeasonId: selectedTeamId },
              parseAs: 'blob',
              throwOnError: false,
            })
          : await exportTeamPitchingStatistics({
              client: apiClient,
              path: { accountId, seasonId, teamSeasonId: selectedTeamId },
              parseAs: 'blob',
              throwOnError: false,
            });
    }

    const blob = unwrapApiResult(result, 'Failed to export statistics') as Blob;
    const teamSlug = sanitizeDownloadName(selectedTeam?.teamName ?? 'team');
    downloadBlob(blob, `${teamSlug}-${type}-statistics.csv`);
  };

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

  const sortedGames = [...games].sort((a, b) => {
    const dateA = new Date(a.gameDate).getTime();
    const dateB = new Date(b.gameDate).getTime();
    return gameSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const showGameList = !isAllTime;

  const myTeamsList = Array.isArray(teams) ? teams.filter(isMyTeam) : [];
  const otherTeamsList = Array.isArray(teams) ? teams.filter((team) => !isMyTeam(team)) : [];

  const renderTeamMenuItem = (team: Team) => (
    <MenuItem key={team.teamId} value={team.teamId}>
      {isAllTime
        ? `${team.leagueName} [${team.teamName}] [${team.divisionName}]`
        : `${team.teamName} (${team.leagueName} - ${team.divisionName})`}
      {isMyTeam(team) && (
        <StarIcon
          fontSize="small"
          sx={{ ml: 0.5, color: 'warning.main', verticalAlign: 'text-bottom' }}
        />
      )}
    </MenuItem>
  );

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
              {myTeamsList.map(renderTeamMenuItem)}
              {myTeamsList.length > 0 && otherTeamsList.length > 0 && <Divider />}
              {otherTeamsList.map(renderTeamMenuItem)}
            </Select>
          </FormControl>

          {selectedTeam && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedTeam.teamName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {isAllTime
                  ? `${selectedTeam.leagueName} • Seasons: ${selectedTeam.divisionName}`
                  : `${selectedTeam.leagueName} League • ${selectedTeam.divisionName} Division`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedTeamId && (
        <>
          {showGameList && (
            <Box sx={{ mb: 3 }}>
              <GameListCard
                games={sortedGames}
                selectedGameId={selectedGameId}
                onSelectGame={setSelectedGameId}
                sortOrder={gameSortOrder}
                onSortOrderChange={setGameSortOrder}
                loading={gamesLoading}
                error={gamesError}
                canManageStats={false}
              />
            </Box>
          )}

          {/* Tabs */}
          <Paper sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
                pr: 2,
              }}
            >
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="team statistics tabs">
                <Tab label="Batting" id="team-stats-tab-0" />
                <Tab label="Pitching" id="team-stats-tab-1" />
              </Tabs>
              {selectedGameId && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setSelectedGameId(null);
                    setDisplayedGame(null);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  View season totals
                </Button>
              )}
            </Box>

            {gameStatsError && (
              <Alert severity="error" sx={{ m: 2 }}>
                {gameStatsError}
              </Alert>
            )}

            <TabPanel value={tabValue} index={0}>
              {displayedGame ? (
                <BattingStatsViewTable
                  stats={displayedGame.batting}
                  totals={displayedGame.batting.totals}
                />
              ) : (
                <StatisticsTable
                  variant="batting"
                  extendedStats
                  data={sortedBattingStats}
                  loading={loading.batting}
                  emptyMessage="No batting statistics available"
                  getRowKey={(stat) => stat.contactId}
                  sortField={String(battingSortField)}
                  sortOrder={battingSortOrder}
                  onSort={(field) => handleBattingSort(field as keyof PlayerBattingStatsType)}
                  playerLinkLabel="Team Batting Stats"
                  omitFields={['playerNumber']}
                  onExport={() => handleExport('batting')}
                />
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {displayedGame ? (
                <PitchingStatsViewTable
                  stats={displayedGame.pitching}
                  totals={displayedGame.pitching.totals}
                />
              ) : (
                <StatisticsTable
                  variant="pitching"
                  extendedStats
                  data={sortedPitchingStats}
                  loading={loading.pitching}
                  emptyMessage="No pitching statistics available"
                  getRowKey={(stat) => stat.contactId}
                  sortField={String(pitchingSortField)}
                  sortOrder={pitchingSortOrder}
                  onSort={(field) => handlePitchingSort(field as keyof PlayerPitchingStatsType)}
                  playerLinkLabel="Team Pitching Stats"
                  omitFields={['playerNumber']}
                  onExport={() => handleExport('pitching')}
                />
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
