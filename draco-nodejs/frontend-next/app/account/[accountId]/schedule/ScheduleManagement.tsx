'use client';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  useMediaQuery,
  Fab,
  Paper,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import AdPlacement from '../../../../components/ads/AdPlacement';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccountTimezone } from '../../../../context/AccountContext';
import { GameCardData } from '../../../../components/GameCard';
import { getGameTypeText } from '../../../../utils/gameUtils';
import { getGameSummary } from '../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../utils/gameTransformers';
import { useGameRecapFlow } from '../../../../hooks/useGameRecapFlow';

// Import modular schedule components
import {
  useScheduleData,
  useScheduleFilters,
  useGameManagement,
  ViewFactory,
  ViewModeTabs,
  GameDialog,
  DeleteGameDialog,
  GameResultsDialog,
  Game,
  FilterType,
  ViewMode,
  GameStatus,
} from '../../../../components/schedule';
import WidgetShell from '../../../../components/ui/WidgetShell';
import { useTheme } from '@mui/material/styles';
import { SeasonSchedulerAdapter } from '../../../../components/scheduler/SeasonSchedulerAdapter';

interface ScheduleManagementProps {
  accountId: string;
}

const CALENDAR_VIEW_BREAKPOINT = 900;

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const theme = useTheme();
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const { user, token } = useAuth();
  const { currentSeasonId, currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();

  // Fetch current season when component mounts
  useEffect(() => {
    if (accountId) {
      fetchCurrentSeason().catch(console.error);
    }
  }, [accountId, fetchCurrentSeason]);

  // Check if user has edit permissions for schedule management
  const canEditSchedule =
    user &&
    (hasRole('Administrator') ||
      hasRole('AccountAdmin', { accountId }) ||
      hasRole('LeagueAdmin', { accountId }));

  // Initialize filter states
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const prefersListView = useMediaQuery(`(max-width:${CALENDAR_VIEW_BREAKPOINT}px)`);
  const defaultViewMode = prefersListView ? 'list' : 'calendar';
  const [manualViewMode, setManualViewMode] = useState<ViewMode | null>(null);
  const viewMode = manualViewMode ?? defaultViewMode;

  // Snackbar feedback state
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
      setFeedback(null);
    }
  }, []);

  const setError = useCallback((message: string | null) => {
    if (message) {
      setFeedback({ severity: 'error', message });
    } else {
      setFeedback(null);
    }
  }, []);

  // Use modular schedule hooks
  const {
    games,
    teams,
    fields,
    umpires,
    leagues,
    leagueTeams,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
    loadLeagueTeams,
    loadUmpires,
    loadGamesData,
    clearLeagueTeams,
    upsertGameInCache,
    removeGameFromCache,
    startDate,
    endDate,
  } = useScheduleData({
    accountId,
    filterType,
    filterDate,
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

  // Convert Game to GameCardData for display using the unified transformer
  const convertGameToGameCardDataWithTeams = useCallback(
    (game: Game): GameCardData => {
      return convertGameToGameCardData(game, teams, fields);
    },
    [teams, fields],
  );

  const getFieldNameById = useCallback(
    (fieldId?: string) => fields.find((field) => field.id === fieldId)?.name || '',
    [fields],
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

  // Handle create game button click
  const handleAddGameClick = useCallback(() => {
    const initialDate = computeInitialGameDate();
    setCreateDialogDefaults({
      leagueSeasonId: filterLeagueSeasonId || undefined,
      gameDate: initialDate,
    });
    loadUmpires().catch(console.error);
    openCreateDialog();
  }, [computeInitialGameDate, filterLeagueSeasonId, loadUmpires, openCreateDialog]);

  // Handle edit game
  const handleEditGame = useCallback(
    (game: Game) => {
      loadUmpires().catch(console.error);
      openEditDialog(game);
    },
    [loadUmpires, openEditDialog],
  );

  // Handle game results
  const handleGameResults = useCallback(
    (game: Game) => {
      openGameResultsDialog(game);
    },
    [openGameResultsDialog],
  );

  // Get team name helper
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

  const editDialogTitle = canEditSchedule ? 'Edit Game' : 'View Game';

  if (loadingStaticData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <main className="min-h-screen bg-background">
        <AccountPageHeader
          accountId={accountId}
          style={{ marginBottom: 1 }}
          seasonName={currentSeasonName}
          showSeasonInfo={true}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{ color: theme.palette.widget.headerText, fontWeight: 'bold' }}
              >
                Schedule Management
              </Typography>
            </Box>
          </Box>
        </AccountPageHeader>
        <AdPlacement wrapperSx={{ mt: 2 }} />

        {/* View Mode Tabs */}
        <Paper
          elevation={1}
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <ViewModeTabs viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </Paper>

        {/* Filter Controls */}
        <WidgetShell
          accent="info"
          sx={{
            mb: 3,
            px: 3,
            py: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
              Time Period:
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['day', 'week', 'month', 'year'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilterType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </Box>

            {/* League Filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
                League:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={filterLeagueSeasonId}
                  onChange={(e) => {
                    const leagueId = e.target.value;
                    setFilterLeagueSeasonId(leagueId);
                    // Clear team filter when league changes
                    setFilterTeamSeasonId('');
                    // Load teams for the selected league
                    if (leagueId) {
                      loadLeagueTeams(leagueId);
                    } else {
                      clearLeagueTeams();
                    }
                  }}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>All Leagues</em>
                  </MenuItem>
                  {leagues.map((league) => (
                    <MenuItem key={league.id} value={league.id}>
                      {league.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Team Filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
                Team:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={filterTeamSeasonId}
                  onChange={(e) => setFilterTeamSeasonId(e.target.value)}
                  displayEmpty
                  disabled={!filterLeagueSeasonId}
                >
                  <MenuItem value="">
                    <em>All Teams</em>
                  </MenuItem>
                  {leagueTeams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </WidgetShell>

        <SeasonSchedulerAdapter
          accountId={accountId}
          seasonId={currentSeasonId}
          canEdit={Boolean(canEditSchedule)}
          timeZone={timeZone}
          leagueSeasonIdFilter={filterLeagueSeasonId || undefined}
          teamSeasonIdFilter={filterTeamSeasonId || undefined}
          fields={fields}
          umpires={umpires}
          leagues={leagues}
          teams={teams}
          games={games}
          onApplied={async () => {
            await loadGamesData();
          }}
          setSuccess={setSuccess}
          setError={setError}
        />

        {/* Schedule View */}
        <ViewFactory
          viewMode={viewMode}
          filterType={filterType}
          loadingGames={loadingGames}
          filteredGames={filteredGames}
          timeZone={timeZone}
          canEditSchedule={!!canEditSchedule}
          onEditGame={handleEditGame}
          onGameResults={handleGameResults}
          onEditRecap={openEditRecap}
          onViewRecap={openViewRecap}
          convertGameToGameCardData={convertGameToGameCardDataWithTeams}
          canEditRecap={canEditRecapForGameCard}
          filterDate={filterDate}
          setFilterType={setFilterType}
          setFilterDate={setFilterDate}
          setStartDate={() => {}} // Handled by useScheduleData
          setEndDate={() => {}} // Handled by useScheduleData
          startDate={startDate}
          endDate={endDate}
          isNavigating={isNavigating}
          navigateToWeek={navigateToWeek}
          navigate={navigate}
        />

        {/* Dialogs */}
        <GameDialog
          open={createDialogOpen}
          mode="create"
          title="Add Game"
          accountId={accountId}
          timeZone={timeZone}
          leagues={leagues}
          fields={fields}
          umpires={umpires}
          leagueTeamsCache={leagueTeamsCache}
          currentSeasonName={currentSeasonName || undefined}
          canEditSchedule={!!canEditSchedule}
          isAccountAdmin={!!canEditSchedule}
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
          getTeamName={getTeamName}
          getFieldName={getFieldNameById}
          getGameTypeText={getGameTypeText}
        />

        <GameDialog
          open={editDialogOpen}
          mode="edit"
          title={editDialogTitle}
          accountId={accountId}
          timeZone={timeZone}
          selectedGame={selectedGame || undefined}
          leagues={leagues}
          fields={fields}
          umpires={umpires}
          leagueTeamsCache={leagueTeamsCache}
          currentSeasonName={currentSeasonName || undefined}
          canEditSchedule={!!canEditSchedule}
          isAccountAdmin={!!canEditSchedule}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedGame(null);
          }}
          onSuccess={({ message, game }) => {
            setSuccess(message);
            if (game) {
              upsertGameInCache(game);
            }
          }}
          onError={(message) => setError(message)}
          onDelete={() => {
            if (selectedGame) {
              openDeleteDialog(selectedGame);
            }
          }}
          getTeamName={getTeamName}
          getFieldName={getFieldNameById}
          getGameTypeText={getGameTypeText}
        />

        <DeleteGameDialog
          open={deleteDialogOpen}
          selectedGame={selectedGame}
          onClose={() => setDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
          onError={setError}
          getTeamName={getTeamName}
          accountId={accountId}
        />

        <GameResultsDialog
          open={gameResultsDialogOpen}
          accountId={accountId}
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

        {recapError && (
          <Alert
            severity="error"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: (theme) => theme.zIndex.snackbar,
            }}
            onClose={clearRecapError}
          >
            {recapError}
          </Alert>
        )}

        {canEditSchedule ? (
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
        ) : null}

        <Snackbar
          open={Boolean(feedback)}
          autoHideDuration={6000}
          onClose={handleFeedbackClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {feedback ? (
            <Alert
              onClose={handleFeedbackClose}
              severity={feedback.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {feedback.message}
            </Alert>
          ) : undefined}
        </Snackbar>
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;
