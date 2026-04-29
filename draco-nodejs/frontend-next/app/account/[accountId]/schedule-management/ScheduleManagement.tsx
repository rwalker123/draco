'use client';
import React, { useState, useEffect } from 'react';
import { Box, Button, Fab, FormControlLabel, Switch, useMediaQuery } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccountTimezone, useAccount } from '../../../../context/AccountContext';
import { useApiClient } from '../../../../hooks/useApiClient';
import { updateSeasonScheduleVisibility } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { GameCardData } from '../../../../components/GameCard';
import { getGameSummary } from '../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../utils/gameTransformers';
import { useGameRecapFlow } from '../../../../hooks/useGameRecapFlow';
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
import { getFilteredScheduleSummary } from '../../../../components/schedule/utils/getFilteredScheduleSummary';
import SeasonSummaryWidget from '../../../../components/schedule/SeasonSummaryWidget';
import usePrintAction from '../../../../components/print/usePrintAction';
import SchedulePrintView from '../../../../components/schedule/SchedulePrintView';

interface ScheduleManagementProps {
  accountId: string;
}

const CALENDAR_VIEW_BREAKPOINT = 900;

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const { token } = useAuth();
  const {
    currentSeasonId,
    currentSeasonName,
    currentSeasonScheduleVisible,
    fetchCurrentSeason,
    refetchCurrentSeason,
  } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;
  const apiClient = useApiClient();
  const [visibilityPending, setVisibilityPending] = useState(false);

  useEffect(() => {
    if (accountId) {
      void fetchCurrentSeason();
    }
  }, [accountId, fetchCurrentSeason]);

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

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  const setSuccess = (message: string | null) => {
    if (message) {
      setFeedback({ severity: 'success', message });
    } else {
      setFeedback((prev) => (prev?.severity === 'success' ? null : prev));
    }
  };

  const setError = (message: string | null) => {
    if (message) {
      setFeedback({ severity: 'error', message });
    } else {
      setFeedback((prev) => (prev?.severity === 'error' ? null : prev));
    }
  };

  const handleVisibilityToggle = async () => {
    if (!currentSeasonId || visibilityPending) {
      return;
    }

    setVisibilityPending(true);
    try {
      const result = await updateSeasonScheduleVisibility({
        client: apiClient,
        path: { accountId, seasonId: currentSeasonId },
        body: { scheduleVisible: !currentSeasonScheduleVisible },
        throwOnError: false,
      });
      unwrapApiResult(result, 'Failed to update schedule visibility');
      await refetchCurrentSeason();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule visibility');
    } finally {
      setVisibilityPending(false);
    }
  };

  const {
    games,
    teams,
    locations,
    officials,
    hasOfficials,
    leagues,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
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
    filterDate,
    setFilterDate,
  });

  const leagueTeams = filterLeagueSeasonId
    ? (leagueTeamsCache.get(filterLeagueSeasonId) ?? [])
    : [];

  const filteredSummary = getFilteredScheduleSummary({
    games: filteredGames,
    timeZone,
    teamSeasonId: filterTeamSeasonId || undefined,
    ready: !loadingStaticData,
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

  const convertGameToGameCardDataWithTeams = (game: Game): GameCardData => {
    return convertGameToGameCardData(game, teams, locations);
  };

  const computeInitialGameDate = (): Date => {
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
  };

  const handleAddGameClick = () => {
    const initialDate = computeInitialGameDate();
    setCreateDialogDefaults({
      leagueSeasonId: filterLeagueSeasonId || undefined,
      gameDate: initialDate,
    });
    if (hasOfficials) {
      loadOfficials().catch(console.error);
    }
    openCreateDialog();
  };

  const handleEditGame = (game: Game) => {
    if (hasOfficials) {
      loadOfficials().catch(console.error);
    }
    openEditDialog(game);
  };

  const handleGameResults = (game: Game) => {
    openGameResultsDialog(game);
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const canEditRecapForGameCard = (game: GameCardData): boolean => {
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
      hasRoleInTeam('TeamAdmin', game.homeTeamId) || hasRoleInTeam('TeamManager', game.homeTeamId);
    const canEditVisitor =
      hasRoleInTeam('TeamAdmin', game.visitorTeamId) ||
      hasRoleInTeam('TeamManager', game.visitorTeamId);

    return canEditHome || canEditVisitor;
  };

  const fetchRecapForTeam = async (game: Game, teamSeasonId: string): Promise<string | null> => {
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
  };

  const handleRecapSaved = (game: Game, _teamSeasonId: string, _recap: string) => {
    const updatedGame: Game = {
      ...game,
      hasGameRecap: true,
    };

    upsertGameInCache(updatedGame);
  };

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

  const { triggerPrint } = usePrintAction();

  const printTitle = currentSeasonName ? `Schedule — ${currentSeasonName}` : 'Schedule';

  const handleViewModeChange = (mode: ViewMode) => {
    setManualViewMode(mode === defaultViewMode ? null : mode);
  };

  return (
    <ScheduleLayout
      accountId={accountId}
      title="Schedule Management"
      subtitle="Create, edit, and manage game schedules for your organization."
      breadcrumbs={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AdminBreadcrumbs
            accountId={accountId}
            category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
            currentPage="Schedule Management"
          />
          <Box
            className="print-hidden"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={currentSeasonScheduleVisible ?? false}
                  onChange={handleVisibilityToggle}
                  disabled={visibilityPending || currentSeasonId === null}
                />
              }
              label="Schedule visible to public"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={triggerPrint}
            >
              Print
            </Button>
          </Box>
        </Box>
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
      summaryContent={
        <SeasonSummaryWidget
          summary={filteredSummary}
          loading={false}
          ready={!loadingStaticData}
          games={filteredGames}
          timeZone={timeZone}
        />
      }
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

      <SchedulePrintView games={filteredGames} title={printTitle} timeZone={timeZone} />

      <Fab
        color="primary"
        aria-label="Add game"
        onClick={handleAddGameClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.fab,
        }}
      >
        <AddIcon />
      </Fab>
    </ScheduleLayout>
  );
};

export default ScheduleManagement;
