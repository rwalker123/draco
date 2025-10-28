'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import { SportsBaseball, Timeline } from '@mui/icons-material';
import {
  GameAttendanceSchema,
  type GameAttendanceType,
  type GameBattingStatLineType,
  type GameBattingStatsType,
  type GamePitchingStatLineType,
  type GamePitchingStatsType,
  type TeamCompletedGameType,
  type TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import { useAuth } from '../../../../../../../../context/AuthContext';
import { useRole } from '../../../../../../../../context/RoleContext';
import { useApiClient } from '../../../../../../../../hooks/useApiClient';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import TeamInfoCard from '../../../../../../../../components/TeamInfoCard';
import TeamAvatar from '../../../../../../../../components/TeamAvatar';
import { TeamStatsEntryService } from '../../../../../../../../services/teamStatsEntryService';
import GameListCard, {
  type SortOrder,
} from '../../../../../../../../components/team-stats-entry/GameListCard';
import GameOverviewCard from '../../../../../../../../components/team-stats-entry/GameOverviewCard';
import StatsTabsCard, {
  type TabKey,
} from '../../../../../../../../components/team-stats-entry/StatsTabsCard';
import {
  AddBattingStatDialog,
  EditBattingStatDialog,
} from '../../../../../../../../components/team-stats-entry/dialogs/AddBattingStatDialog';
import {
  AddPitchingStatDialog,
  EditPitchingStatDialog,
} from '../../../../../../../../components/team-stats-entry/dialogs/AddPitchingStatDialog';
import AsyncConfirmDialog from '../../../../../../../../components/team-stats-entry/dialogs/AsyncConfirmDialog';
import { emptyAttendance } from '../../../../../../../../components/team-stats-entry/constants';

interface TeamStatEntryPageProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

type SnackbarState = {
  message: string;
  severity: 'success' | 'error';
} | null;

const TeamStatEntryPage: React.FC<TeamStatEntryPageProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const { token } = useAuth();
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const apiClient = useApiClient();

  const statsService = useMemo(
    () => new TeamStatsEntryService(token, apiClient),
    [apiClient, token],
  );

  const canManageStats = useMemo(
    () =>
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId),
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId],
  );

  const [teamHeaderData, setTeamHeaderData] = useState<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    accountName: string;
    logoUrl?: string;
  } | null>(null);

  const [games, setGames] = useState<TeamCompletedGameType[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const [battingStats, setBattingStats] = useState<GameBattingStatsType | null>(null);
  const [pitchingStats, setPitchingStats] = useState<GamePitchingStatsType | null>(null);
  const [, setAttendance] = useState<GameAttendanceType>(emptyAttendance);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [tabValue, setTabValue] = useState<TabKey>('batting');
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);

  const [addBattingOpen, setAddBattingOpen] = useState(false);
  const [editBattingTarget, setEditBattingTarget] = useState<GameBattingStatLineType | null>(null);
  const [deleteBattingTarget, setDeleteBattingTarget] = useState<GameBattingStatLineType | null>(
    null,
  );

  const [addPitchingOpen, setAddPitchingOpen] = useState(false);
  const [editPitchingTarget, setEditPitchingTarget] = useState<GamePitchingStatLineType | null>(
    null,
  );
  const [deletePitchingTarget, setDeletePitchingTarget] = useState<GamePitchingStatLineType | null>(
    null,
  );

  const [attendanceSelection, setAttendanceSelection] = useState<string[]>([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const sortedGames = useMemo(() => {
    const next = [...games];
    next.sort((a, b) => {
      const dateA = new Date(a.gameDate).getTime();
      const dateB = new Date(b.gameDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return next;
  }, [games, sortOrder]);

  const selectedGame = useMemo(
    () => sortedGames.find((game) => game.gameId === selectedGameId) ?? null,
    [selectedGameId, sortedGames],
  );

  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const data = await statsService.listCompletedGames(accountId, seasonId, teamSeasonId);
        if (!active) return;

        setGames(data);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load completed games.';
        setGamesError(message);
        setGames([]);
      } finally {
        if (active) {
          setGamesLoading(false);
        }
      }
    };

    void loadGames();

    return () => {
      active = false;
    };
  }, [accountId, seasonId, teamSeasonId, statsService]);

  useEffect(() => {
    if (!sortedGames.length) {
      setSelectedGameId(null);
      return;
    }

    if (!selectedGameId || !sortedGames.some((game) => game.gameId === selectedGameId)) {
      setSelectedGameId(sortedGames[0].gameId);
    }
  }, [sortedGames, selectedGameId]);

  const refreshStats = useCallback(
    async (gameId: string) => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const [batting, pitching] = await Promise.all([
          statsService.getGameBattingStats(accountId, seasonId, teamSeasonId, gameId),
          statsService.getGamePitchingStats(accountId, seasonId, teamSeasonId, gameId),
        ]);

        setBattingStats(batting);
        setPitchingStats(pitching);

        const lockedRosterIdsForGame = new Set<string>();
        batting.stats.forEach((stat) => {
          if (stat.rosterSeasonId) {
            lockedRosterIdsForGame.add(stat.rosterSeasonId);
          }
        });
        pitching.stats.forEach((stat) => {
          if (stat.rosterSeasonId) {
            lockedRosterIdsForGame.add(stat.rosterSeasonId);
          }
        });

        if (canManageStats) {
          try {
            setAttendanceLoading(true);
            const attendanceData = await statsService.getGameAttendance(
              accountId,
              seasonId,
              teamSeasonId,
              gameId,
            );
            setAttendance(attendanceData);
            const combinedSelection = Array.from(
              new Set([...attendanceData.playerIds, ...lockedRosterIdsForGame]),
            );
            setAttendanceSelection(combinedSelection);
            setAttendanceError(null);
          } catch (attendanceErr) {
            const message =
              attendanceErr instanceof Error ? attendanceErr.message : 'Unable to load attendance.';
            setAttendanceError(message);
            setAttendance(emptyAttendance);
            setAttendanceSelection(Array.from(lockedRosterIdsForGame));
          } finally {
            setAttendanceLoading(false);
          }
        } else {
          setAttendance(emptyAttendance);
          setAttendanceSelection(Array.from(lockedRosterIdsForGame));
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load statistics for the selected game.';
        setStatsError(message);
        setBattingStats(null);
        setPitchingStats(null);
      } finally {
        setStatsLoading(false);
      }
    },
    [accountId, canManageStats, seasonId, statsService, teamSeasonId],
  );

  useEffect(() => {
    if (!selectedGameId) {
      setBattingStats(null);
      setPitchingStats(null);
      setAttendance(emptyAttendance);
      setAttendanceSelection([]);
      return;
    }

    void refreshStats(selectedGameId);
  }, [refreshStats, selectedGameId]);

  const playerSummaryMap = useMemo(() => {
    const map = new Map<string, TeamStatsPlayerSummaryType>();

    const addSummary = (summary: TeamStatsPlayerSummaryType) => {
      if (!summary?.rosterSeasonId) {
        return;
      }
      map.set(summary.rosterSeasonId, summary);
    };

    if (battingStats) {
      battingStats.availablePlayers?.forEach(addSummary);
      battingStats.stats.forEach((stat) => {
        addSummary({
          rosterSeasonId: stat.rosterSeasonId,
          playerId: stat.playerId,
          contactId: stat.contactId,
          playerName: stat.playerName,
          playerNumber: stat.playerNumber ?? null,
          photoUrl: null,
        });
      });
    }

    if (pitchingStats) {
      pitchingStats.availablePlayers?.forEach(addSummary);
      pitchingStats.stats.forEach((stat) => {
        addSummary({
          rosterSeasonId: stat.rosterSeasonId,
          playerId: stat.playerId,
          contactId: stat.contactId,
          playerName: stat.playerName,
          playerNumber: stat.playerNumber ?? null,
          photoUrl: null,
        });
      });
    }

    return map;
  }, [battingStats, pitchingStats]);

  const availableBattingPlayers = battingStats?.availablePlayers ?? [];
  const availablePitchingPlayers = pitchingStats?.availablePlayers ?? [];

  const attendanceOptions = useMemo(() => {
    const summaries = Array.from(playerSummaryMap.values());
    summaries.sort((a, b) => a.playerName.localeCompare(b.playerName));
    return summaries;
  }, [playerSummaryMap]);

  const handleSortOrderChange = (order: SortOrder) => {
    setSortOrder(order);
  };

  const handleGameSelect = (gameId: string) => {
    if (selectedGameId === gameId) {
      return;
    }
    setSelectedGameId(gameId);
  };

  const handleTabChange = (nextTab: TabKey) => {
    if (nextTab === 'attendance' && !canManageStats) {
      setTabValue('batting');
      return;
    }
    setTabValue(nextTab);
  };

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ message, severity });
  }, []);

  const handleBattingDialogSuccess = async (message: string) => {
    if (!selectedGameId) {
      return;
    }
    showSnackbar(message);
    await refreshStats(selectedGameId);
  };

  const handleBattingDialogError = (message: string) => {
    showSnackbar(message, 'error');
  };

  const handleDeleteBatting = async (statId: string) => {
    if (!selectedGameId) return;
    try {
      await statsService.deleteGameBattingStat(
        accountId,
        seasonId,
        teamSeasonId,
        selectedGameId,
        statId,
      );
      showSnackbar('Batting stat removed.');
      await refreshStats(selectedGameId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete batting stat.';
      showSnackbar(message, 'error');
    }
  };

  const handlePitchingDialogSuccess = async (message: string) => {
    if (!selectedGameId) {
      return;
    }
    showSnackbar(message);
    await refreshStats(selectedGameId);
  };

  const handlePitchingDialogError = (message: string) => {
    showSnackbar(message, 'error');
  };

  const handleDeletePitching = async (statId: string) => {
    if (!selectedGameId) return;
    try {
      await statsService.deleteGamePitchingStat(
        accountId,
        seasonId,
        teamSeasonId,
        selectedGameId,
        statId,
      );
      showSnackbar('Pitching stat removed.');
      await refreshStats(selectedGameId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete pitching stat.';
      showSnackbar(message, 'error');
    }
  };

  const lockedAttendanceRosterIds = useMemo(() => {
    const ids = new Set<string>();
    battingStats?.stats.forEach((stat) => {
      if (stat.rosterSeasonId) {
        ids.add(stat.rosterSeasonId);
      }
    });
    pitchingStats?.stats.forEach((stat) => {
      if (stat.rosterSeasonId) {
        ids.add(stat.rosterSeasonId);
      }
    });
    return Array.from(ids);
  }, [battingStats, pitchingStats]);

  const handleSaveAttendance = useCallback(
    async (overrideSelection?: string[]) => {
      if (!selectedGameId) return;
      if (!canManageStats) return;
      try {
        setAttendanceSaving(true);
        setAttendanceError(null);

        const selectionToPersist = overrideSelection ?? attendanceSelection;
        const validSelection = GameAttendanceSchema.safeParse({ playerIds: selectionToPersist });
        if (!validSelection.success) {
          showSnackbar('Attendance selection is invalid. Please review your selections.', 'error');
          setAttendanceSaving(false);
          return;
        }

        const updated = await statsService.updateGameAttendance(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          validSelection.data,
        );

        setAttendance(updated);
        const combined = Array.from(new Set([...updated.playerIds, ...lockedAttendanceRosterIds]));
        setAttendanceSelection(combined);
        showSnackbar('Attendance updated successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update attendance.';
        setAttendanceError(message);
        showSnackbar(message, 'error');
      } finally {
        setAttendanceSaving(false);
      }
    },
    [
      accountId,
      attendanceSelection,
      lockedAttendanceRosterIds,
      canManageStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      statsService,
      teamSeasonId,
    ],
  );

  const battingTotals = battingStats?.totals ?? null;
  const pitchingTotals = pitchingStats?.totals ?? null;

  const handleAttendanceSelectionChange = useCallback(
    (nextSelection: string[]) => {
      if (!canManageStats) {
        return;
      }
      const combined = Array.from(new Set([...nextSelection, ...lockedAttendanceRosterIds]));
      setAttendanceSelection(combined);
      void handleSaveAttendance(combined);
    },
    [canManageStats, handleSaveAttendance, lockedAttendanceRosterIds],
  );

  useEffect(() => {
    if (!lockedAttendanceRosterIds.length) {
      return;
    }

    setAttendanceSelection((current) => {
      const set = new Set(current);
      let changed = false;
      lockedAttendanceRosterIds.forEach((id) => {
        if (!set.has(id)) {
          set.add(id);
          changed = true;
        }
      });

      return changed ? Array.from(set) : current;
    });
  }, [lockedAttendanceRosterIds]);

  useEffect(() => {
    if (!canManageStats && tabValue === 'attendance') {
      setTabValue('batting');
    }
  }, [canManageStats, tabValue]);

  const handleTeamDataLoaded = useCallback(
    (data: {
      teamName: string;
      leagueName: string;
      seasonName: string;
      accountName: string;
      logoUrl?: string;
      record?: { wins: number; losses: number; ties: number };
      teamId?: string;
    }) => {
      setTeamHeaderData((previous) => {
        if (
          previous &&
          previous.teamName === data.teamName &&
          previous.leagueName === data.leagueName &&
          previous.seasonName === data.seasonName &&
          previous.accountName === data.accountName &&
          previous.logoUrl === data.logoUrl
        ) {
          return previous;
        }

        return {
          teamName: data.teamName,
          leagueName: data.leagueName,
          seasonName: data.seasonName,
          accountName: data.accountName,
          logoUrl: data.logoUrl,
        };
      });
    },
    [],
  );

  return (
    <main className="min-h-screen bg-background">
      <Box>
        <AccountPageHeader accountId={accountId} style={{ marginBottom: 1 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
            sx={{ textAlign: 'center' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <TeamAvatar
                name={teamHeaderData?.teamName ?? 'Team Statistics'}
                logoUrl={teamHeaderData?.logoUrl}
                size={60}
                alt={
                  teamHeaderData?.teamName
                    ? `${teamHeaderData.teamName} logo`
                    : 'Team statistics logo'
                }
              />
              <Stack spacing={0.5} alignItems="flex-start">
                {teamHeaderData?.leagueName && (
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {teamHeaderData.leagueName}
                  </Typography>
                )}
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {teamHeaderData?.teamName ?? 'Team Statistics & Game Entry'}
                </Typography>
              </Stack>
            </Box>

            {teamHeaderData?.seasonName && (
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'medium' }}
              >
                {teamHeaderData.seasonName} Season
              </Typography>
            )}

            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 640 }}>
              Review box scores for every completed game and, if you are a team administrator, keep
              batting, pitching, and attendance records up to date.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              <Button
                component={Link}
                href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`}
                variant="outlined"
                color="inherit"
                startIcon={<Timeline />}
              >
                Back to Team Overview
              </Button>
              <Button
                component={Link}
                href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/schedule`}
                variant="outlined"
                color="inherit"
                startIcon={<SportsBaseball />}
              >
                View Full Schedule
              </Button>
            </Box>
          </Box>
        </AccountPageHeader>

        <Box sx={{ mt: 4 }}>
          <TeamInfoCard
            accountId={accountId}
            seasonId={seasonId}
            teamSeasonId={teamSeasonId}
            onTeamDataLoaded={handleTeamDataLoaded}
          />
        </Box>

        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 320px) minmax(0, 1fr)' },
            alignItems: 'stretch',
          }}
        >
          <Box>
            <GameListCard
              games={sortedGames}
              selectedGameId={selectedGameId}
              onSelectGame={handleGameSelect}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange}
              loading={gamesLoading}
              error={gamesError}
            />
          </Box>

          <Stack spacing={3}>
            <GameOverviewCard
              game={selectedGame}
              onRefresh={selectedGameId ? () => void refreshStats(selectedGameId) : undefined}
              refreshing={statsLoading}
            />

            <StatsTabsCard
              tab={tabValue}
              onTabChange={handleTabChange}
              canManageStats={canManageStats}
              loading={statsLoading}
              error={statsError}
              selectedGameId={selectedGameId}
              battingStats={battingStats}
              pitchingStats={pitchingStats}
              battingTotals={battingTotals}
              pitchingTotals={pitchingTotals}
              availableBatters={availableBattingPlayers}
              availablePitchers={availablePitchingPlayers}
              onAddBatter={() => setAddBattingOpen(true)}
              onEditBatter={setEditBattingTarget}
              onDeleteBatter={setDeleteBattingTarget}
              onAddPitcher={() => setAddPitchingOpen(true)}
              onEditPitcher={setEditPitchingTarget}
              onDeletePitcher={setDeletePitchingTarget}
              attendanceOptions={attendanceOptions}
              attendanceSelection={attendanceSelection}
              onAttendanceSelectionChange={handleAttendanceSelectionChange}
              lockedAttendanceRosterIds={lockedAttendanceRosterIds}
              attendanceLoading={attendanceLoading}
              attendanceError={attendanceError}
              attendanceSaving={attendanceSaving}
            />
          </Stack>
        </Box>

        <AddBattingStatDialog
          open={addBattingOpen}
          onClose={() => setAddBattingOpen(false)}
          availablePlayers={availableBattingPlayers}
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          gameId={selectedGameId}
          service={statsService}
          onSuccess={({ message }) => void handleBattingDialogSuccess(message)}
          onError={handleBattingDialogError}
        />

        <EditBattingStatDialog
          stat={editBattingTarget}
          onClose={() => setEditBattingTarget(null)}
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          gameId={selectedGameId}
          service={statsService}
          onSuccess={({ message }) => void handleBattingDialogSuccess(message)}
          onError={handleBattingDialogError}
        />

        <AsyncConfirmDialog
          open={Boolean(deleteBattingTarget)}
          title="Remove batting stat"
          description="This will remove the player's batting line from this game."
          confirmLabel="Delete"
          confirmColor="error"
          onClose={() => setDeleteBattingTarget(null)}
          onConfirm={async () => {
            if (!deleteBattingTarget) return;
            await handleDeleteBatting(deleteBattingTarget.statId);
          }}
        />

        <AddPitchingStatDialog
          open={addPitchingOpen}
          onClose={() => setAddPitchingOpen(false)}
          availablePlayers={availablePitchingPlayers}
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          gameId={selectedGameId}
          service={statsService}
          onSuccess={({ message }) => void handlePitchingDialogSuccess(message)}
          onError={handlePitchingDialogError}
        />

        <EditPitchingStatDialog
          stat={editPitchingTarget}
          onClose={() => setEditPitchingTarget(null)}
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          gameId={selectedGameId}
          service={statsService}
          onSuccess={({ message }) => void handlePitchingDialogSuccess(message)}
          onError={handlePitchingDialogError}
        />

        <AsyncConfirmDialog
          open={Boolean(deletePitchingTarget)}
          title="Remove pitching stat"
          description="This will remove the player's pitching line from this game."
          confirmLabel="Delete"
          confirmColor="error"
          onClose={() => setDeletePitchingTarget(null)}
          onConfirm={async () => {
            if (!deletePitchingTarget) return;
            await handleDeletePitching(deletePitchingTarget.statId);
          }}
        />

        {snackbar && (
          <Snackbar
            open
            autoHideDuration={4000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar(null)}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </main>
  );
};

export default TeamStatEntryPage;
