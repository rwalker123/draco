'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccountTimezone, useAccount } from '../../../../context/AccountContext';
import { GameCardData } from '../../../../components/GameCard';
import { getGameSummary } from '../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../utils/gameTransformers';
import { useGameRecapFlow } from '../../../../hooks/useGameRecapFlow';
import { useMediaQuery } from '@mui/material';
import {
  useScheduleData,
  useScheduleFilters,
  useGameManagement,
  DeleteGameDialog,
  ScheduleLayout,
  Game,
  FilterType,
  ViewMode,
  GameStatus,
} from '../../../../components/schedule';
import { SeasonSchedulerAdapter } from '../../../../components/scheduler/SeasonSchedulerAdapter';
import { AdminBreadcrumbs } from '../../../../components/admin';

interface ScheduleManagementProps {
  accountId: string;
}

const CALENDAR_VIEW_BREAKPOINT = 900;

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const { token } = useAuth();
  const { currentSeasonId, currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;

  const fetchCurrentSeasonRef = useRef(fetchCurrentSeason);
  useEffect(() => {
    fetchCurrentSeasonRef.current = fetchCurrentSeason;
  }, [fetchCurrentSeason]);

  useEffect(() => {
    if (accountId) {
      fetchCurrentSeasonRef.current().catch(console.error);
    }
  }, [accountId]);

  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const prefersListView = useMediaQuery(`(max-width:${CALENDAR_VIEW_BREAKPOINT}px)`);
  const defaultViewMode = prefersListView ? 'list' : 'calendar';
  const [manualViewMode, setManualViewMode] = useState<ViewMode | null>(null);
  const viewMode = manualViewMode ?? defaultViewMode;

  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFeedbackClose = useCallback(() => {
    setFeedback(null);
  }, []);

  const setSuccess = useCallback((message: string | null) => {
    if (message) {
      setFeedback({ severity: 'success', message });
    } else {
      setFeedback((prev) => (prev?.severity === 'success' ? null : prev));
    }
  }, []);

  const setError = useCallback((message: string | null) => {
    if (message) {
      setFeedback({ severity: 'error', message });
    } else {
      setFeedback((prev) => (prev?.severity === 'error' ? null : prev));
    }
  }, []);

  const {
    games,
    teams,
    locations,
    officials,
    hasOfficials,
    leagues,
    leagueTeams,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
    loadLeagueTeams,
    loadOfficials,
    loadGamesData,
    clearLeagueTeams,
    upsertGameInCache,
    removeGameFromCache,
    deleteGame,
    startDate,
    endDate,
    GameDialog,
    ScoreEntryDialog,
  } = useScheduleData({
    accountId,
    accountType,
    filterType,
    filterDate,
    onError: setError,
  });

  const {
    filterLeagueSeasonId,
    filterTeamSeasonId,
    setFilterLeagueSeasonId,
    setFilterTeamSeasonId,
    navigateToWeek,
    navigate,
    isNavigating,
    filteredGames,
  } = useScheduleFilters({
    games,
    leagues,
    leagueTeams,
    loadLeagueTeams,
    filterDate,
    setFilterDate,
  });

  const {
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    gameResultsDialogOpen,
    selectedGame,
    selectedGameForResults,
    setCreateDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setGameResultsDialogOpen,
    handleDeleteSuccess,
    handleGameResultsSuccess,
    setSelectedGame,
    setSelectedGameForResults,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openGameResultsDialog,
  } = useGameManagement({
    accountId,
    upsertGameInCache,
    removeGameFromCache,
    setSuccess,
    setError,
  });

  const [createDialogDefaults, setCreateDialogDefaults] = useState<{
    leagueSeasonId?: string;
    gameDate: Date;
  } | null>(null);

  const convertGameToGameCardDataWithTeams = useCallback(
    (game: Game): GameCardData => {
      return convertGameToGameCardData(game, teams, locations);
    },
    [teams, locations],
  );

  const computeInitialGameDate = useCallback((): Date => {
    switch (filterType) {
      case 'day':
        return new Date(filterDate);
      case 'week':
      case 'month':
      case 'year':
        return new Date(startDate);
      default:
        return new Date();
    }
  }, [filterType, filterDate, startDate]);

  const handleAddGameClick = useCallback(() => {
    const initialDate = computeInitialGameDate();
    setCreateDialogDefaults({
      leagueSeasonId: filterLeagueSeasonId || undefined,
      gameDate: initialDate,
    });
    if (hasOfficials) {
      loadOfficials().catch(console.error);
    }
    openCreateDialog();
  }, [computeInitialGameDate, filterLeagueSeasonId, hasOfficials, loadOfficials, openCreateDialog]);

  const handleEditGame = useCallback(
    (game: Game) => {
      if (hasOfficials) {
        loadOfficials().catch(console.error);
      }
      openEditDialog(game);
    },
    [hasOfficials, loadOfficials, openEditDialog],
  );

  const handleGameResults = useCallback(
    (game: Game) => {
      openGameResultsDialog(game);
    },
    [openGameResultsDialog],
  );

  const getTeamName = useCallback(
    (teamId: string): string => {
      const team = teams.find((t) => t.id === teamId);
      return team?.name || 'Unknown Team';
    },
    [teams],
  );

  const canEditRecapForGameCard = useCallback(
    (game: GameCardData): boolean => {
      if (game.gameStatus !== GameStatus.Completed) {
        return false;
      }

      if (hasRole('Administrator')) {
        return true;
      }

      if (hasRoleInAccount('AccountAdmin', accountId)) {
        return true;
      }

      const canEditHome =
        hasRoleInTeam('TeamAdmin', game.homeTeamId) ||
        hasRoleInTeam('TeamManager', game.homeTeamId);
      const canEditVisitor =
        hasRoleInTeam('TeamAdmin', game.visitorTeamId) ||
        hasRoleInTeam('TeamManager', game.visitorTeamId);

      return canEditHome || canEditVisitor;
    },
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const fetchRecapForTeam = useCallback(
    async (game: Game, teamSeasonId: string): Promise<string | null> => {
      const seasonId = game.season?.id;
      if (!seasonId) {
        throw new Error('Missing season information for the selected game.');
      }

      const recap = await getGameSummary({
        accountId,
        seasonId,
        gameId: game.id,
        teamSeasonId,
        token: token ?? undefined,
      });

      return recap ?? null;
    },
    [accountId, token],
  );

  const handleRecapSaved = useCallback(
    (game: Game, _teamSeasonId: string, _recap: string) => {
      const updatedGame: Game = {
        ...game,
        hasGameRecap: true,
      };

      upsertGameInCache(updatedGame);
    },
    [upsertGameInCache],
  );

  const {
    openEditRecap,
    openViewRecap,
    dialogs: recapDialogs,
    error: recapError,
    clearError: clearRecapError,
  } = useGameRecapFlow<Game>({
    accountId,
    resolveSeasonId: (game) => game.season?.id ?? null,
    fetchRecap: fetchRecapForTeam,
    getTeamName: (_game, teamId) => getTeamName(teamId),
    onRecapSaved: handleRecapSaved,
  });

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setManualViewMode(mode === defaultViewMode ? null : mode);
    },
    [defaultViewMode],
  );

  return (
    <ScheduleLayout
      accountId={accountId}
      title="Schedule Management"
      subtitle="Create, edit, and manage game schedules for your organization."
      breadcrumbs={
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
          currentPage="Schedule Management"
        />
      }
      seasonName={currentSeasonName}
      filteredGames={filteredGames}
      teams={teams}
      locations={locations}
      leagues={leagues}
      leagueTeams={leagueTeams}
      loadingGames={loadingGames}
      loadingStaticData={loadingStaticData}
      filterType={filterType}
      filterDate={filterDate}
      filterLeagueSeasonId={filterLeagueSeasonId}
      filterTeamSeasonId={filterTeamSeasonId}
      viewMode={viewMode}
      setFilterType={setFilterType}
      setFilterLeagueSeasonId={setFilterLeagueSeasonId}
      setFilterTeamSeasonId={setFilterTeamSeasonId}
      onViewModeChange={handleViewModeChange}
      loadLeagueTeams={loadLeagueTeams}
      clearLeagueTeams={clearLeagueTeams}
      startDate={startDate}
      endDate={endDate}
      isNavigating={isNavigating}
      navigateToWeek={navigateToWeek}
      navigate={navigate}
      setFilterDate={setFilterDate}
      timeZone={timeZone}
      convertGameToGameCardData={convertGameToGameCardDataWithTeams}
      onViewRecap={openViewRecap}
      canEditSchedule={true}
      onEditGame={handleEditGame}
      onGameResults={handleGameResults}
      onEditRecap={openEditRecap}
      canEditRecap={canEditRecapForGameCard}
      feedback={feedback}
      onFeedbackClose={handleFeedbackClose}
      recapError={recapError}
      onRecapErrorClose={clearRecapError}
    >
      <SeasonSchedulerAdapter
        accountId={accountId}
        seasonId={currentSeasonId}
        canEdit={true}
        timeZone={timeZone}
        leagueSeasonIdFilter={filterLeagueSeasonId || undefined}
        teamSeasonIdFilter={filterTeamSeasonId || undefined}
        fields={locations}
        umpires={officials}
        leagues={leagues}
        teams={teams}
        games={games}
        onApplied={async () => {
          await loadGamesData();
        }}
        setSuccess={setSuccess}
        setError={setError}
      />

      <GameDialog
        open={createDialogOpen}
        mode="create"
        accountId={accountId}
        timeZone={timeZone}
        leagues={leagues}
        locations={locations}
        officials={officials}
        leagueTeamsCache={leagueTeamsCache}
        canEditSchedule={true}
        defaultLeagueSeasonId={createDialogDefaults?.leagueSeasonId}
        defaultGameDate={createDialogDefaults?.gameDate}
        onClose={() => {
          setCreateDialogOpen(false);
          setCreateDialogDefaults(null);
        }}
        onSuccess={({ message, game }) => {
          setSuccess(message);
          if (game) {
            upsertGameInCache(game);
          }
        }}
        onError={(message) => setError(message)}
      />

      <GameDialog
        open={editDialogOpen}
        mode="edit"
        accountId={accountId}
        timeZone={timeZone}
        selectedGame={selectedGame || undefined}
        leagues={leagues}
        locations={locations}
        officials={officials}
        leagueTeamsCache={leagueTeamsCache}
        canEditSchedule={true}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedGame(null);
        }}
        onSuccess={({ message, game, removed }) => {
          setSuccess(message);
          if (removed && selectedGame) {
            removeGameFromCache(selectedGame.id);
          } else if (game) {
            upsertGameInCache(game);
          }
        }}
        onError={(message) => setError(message)}
        onDelete={() => {
          if (selectedGame) {
            openDeleteDialog(selectedGame);
          }
        }}
      />

      <DeleteGameDialog
        open={deleteDialogOpen}
        selectedGame={selectedGame}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
        onError={setError}
        getTeamName={getTeamName}
        accountId={accountId}
        onDelete={deleteGame}
      />

      <ScoreEntryDialog
        open={gameResultsDialogOpen}
        accountId={accountId}
        seasonId={currentSeasonId ?? undefined}
        onClose={() => {
          setGameResultsDialogOpen(false);
          setSelectedGameForResults(null);
        }}
        selectedGame={selectedGameForResults}
        onSuccess={(payload) => {
          handleGameResultsSuccess(payload);
        }}
        getTeamName={getTeamName}
        timeZone={timeZone}
      />

      {recapDialogs}

      <Fab
        color="primary"
        aria-label="Add game"
        onClick={handleAddGameClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>
    </ScheduleLayout>
  );
};

export default ScheduleManagement;
