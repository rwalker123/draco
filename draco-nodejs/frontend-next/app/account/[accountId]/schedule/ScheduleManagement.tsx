'use client';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  Fab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import EnterGameRecapDialog from '../../../../components/EnterGameRecapDialog';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccountTimezone } from '../../../../context/AccountContext';
import { GameCardData } from '../../../../components/GameCard';
import { getGameTypeText } from '../../../../utils/gameUtils';
import { getGameSummary } from '../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../utils/gameTransformers';

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
import { UpsertGameRecapType } from '@draco/shared-schemas';

interface ScheduleManagementProps {
  accountId: string;
}

type TeamOption = {
  id: string;
  name: string;
};

type PendingRecapAction =
  | {
      mode: 'edit';
      game: Game;
      teamOptions: TeamOption[];
    }
  | {
      mode: 'view';
      game: Game;
      teamOptions: TeamOption[];
      availableRecaps: Array<{ teamId: string; recap: string }>;
    };

const CALENDAR_VIEW_BREAKPOINT = 900;

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const { user, token } = useAuth();
  const { currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
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
  const [viewMode, setViewMode] = useState<ViewMode>(() => (prefersListView ? 'list' : 'calendar'));
  const [viewModeManuallySelected, setViewModeManuallySelected] = useState(false);
  const defaultViewMode = prefersListView ? 'list' : 'calendar';

  // Default to list view on narrow screens, but respect any manual user selection.
  useEffect(() => {
    if (viewMode === defaultViewMode) {
      if (viewModeManuallySelected) {
        setViewModeManuallySelected(false);
      }
      return;
    }

    if (!viewModeManuallySelected) {
      setViewMode(defaultViewMode);
    }
  }, [defaultViewMode, viewMode, viewModeManuallySelected]);

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
    error,
    success,
    loadLeagueTeams,
    loadUmpires,
    clearLeagueTeams,
    setSuccess,
    setError,
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

  const [recapDialogOpen, setRecapDialogOpen] = useState(false);
  const [recapSelectedGame, setRecapSelectedGame] = useState<Game | null>(null);
  const [recapTeamSeasonId, setRecapTeamSeasonId] = useState<string | null>(null);
  const [recapInitialRecap, setRecapInitialRecap] = useState('');
  const [recapReadOnly, setRecapReadOnly] = useState(false);
  const [recapErrorMessage, setRecapErrorMessage] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [pendingRecapAction, setPendingRecapAction] = useState<PendingRecapAction | null>(null);

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

  const determineEditableTeams = useCallback(
    (game: Game): TeamOption[] => {
      if (game.gameStatus !== GameStatus.Completed) {
        return [];
      }

      const isAdministrator =
        hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId);

      const homeTeamId = game.homeTeamId;
      const visitorTeamId = game.visitorTeamId;

      const options: TeamOption[] = [];

      const canEditHome =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', homeTeamId) ||
        hasRoleInTeam('TeamManager', homeTeamId);
      const canEditVisitor =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', visitorTeamId) ||
        hasRoleInTeam('TeamManager', visitorTeamId);

      if (canEditHome) {
        options.push({ id: homeTeamId, name: getTeamName(homeTeamId) });
      }

      if (canEditVisitor) {
        if (!options.some((option) => option.id === visitorTeamId)) {
          options.push({ id: visitorTeamId, name: getTeamName(visitorTeamId) });
        }
      }

      return options;
    },
    [accountId, getTeamName, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const loadRecap = useCallback(
    async (game: Game, teamSeasonId: string) => {
      const seasonId = game.season?.id;
      if (!seasonId) {
        setRecapErrorMessage('Missing season information for the selected game.');
        setRecapInitialRecap('');
        return;
      }

      setRecapLoading(true);
      try {
        const recap = await getGameSummary({
          accountId,
          seasonId,
          gameId: game.id,
          teamSeasonId,
          token: token ?? undefined,
        });
        setRecapInitialRecap(recap || '');
        setRecapErrorMessage(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load game summary';
        if (
          message.toLowerCase().includes('no recap found') ||
          message.toLowerCase().includes('not found')
        ) {
          setRecapInitialRecap('');
          setRecapErrorMessage(null);
        } else {
          setRecapErrorMessage(message);
        }
      } finally {
        setRecapLoading(false);
      }
    },
    [accountId, token],
  );

  const openRecapDialog = useCallback(
    (game: Game, teamSeasonId: string, options: { readOnly: boolean; initialRecap?: string }) => {
      setRecapSelectedGame(game);
      setRecapTeamSeasonId(teamSeasonId);
      setRecapReadOnly(options.readOnly);
      setRecapInitialRecap(options.initialRecap ?? '');
      setRecapErrorMessage(null);
      setRecapDialogOpen(true);
      setRecapLoading(false);

      if (options.initialRecap === undefined) {
        void loadRecap(game, teamSeasonId);
      }
    },
    [loadRecap],
  );

  const handleEditGameRecap = useCallback(
    (game: Game) => {
      const editableTeams = determineEditableTeams(game);

      if (editableTeams.length === 0) {
        setRecapErrorMessage('You do not have permission to edit this game recap.');
        return;
      }

      if (editableTeams.length === 1) {
        openRecapDialog(game, editableTeams[0].id, { readOnly: false });
        return;
      }

      setPendingRecapAction({
        mode: 'edit',
        game,
        teamOptions: editableTeams,
      });
    },
    [determineEditableTeams, openRecapDialog],
  );

  const handleViewGameRecap = useCallback(
    async (game: Game) => {
      if (!game.hasGameRecap) {
        setRecapErrorMessage('No recap available for this game.');
        return;
      }

      const seasonId = game.season?.id;
      if (!seasonId) {
        setRecapErrorMessage('Missing season information for the selected game.');
        return;
      }

      const candidateTeams: TeamOption[] = [
        { id: game.homeTeamId, name: getTeamName(game.homeTeamId) },
        { id: game.visitorTeamId, name: getTeamName(game.visitorTeamId) },
      ];

      setRecapLoading(true);
      try {
        const results = await Promise.all(
          candidateTeams.map(async (team) => {
            try {
              const recap = await getGameSummary({
                accountId,
                seasonId,
                gameId: game.id,
                teamSeasonId: team.id,
                token: token ?? undefined,
              });
              return recap !== undefined && recap !== null
                ? { teamId: team.id, teamName: team.name, recap: recap }
                : null;
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to load game summary';
              if (
                message.toLowerCase().includes('no recap found') ||
                message.toLowerCase().includes('not found')
              ) {
                return null;
              }
              throw err;
            }
          }),
        );

        const available = results.filter(
          (value): value is { teamId: string; teamName: string; recap: string } => value !== null,
        );

        if (available.length === 0) {
          setRecapErrorMessage('No recap available for this game.');
          return;
        }

        if (available.length === 1) {
          const recap = available[0];
          openRecapDialog(game, recap.teamId, {
            readOnly: true,
            initialRecap: recap.recap,
          });
          return;
        }

        setPendingRecapAction({
          mode: 'view',
          game,
          teamOptions: available.map(({ teamId, teamName }) => ({
            id: teamId,
            name: teamName,
          })),
          availableRecaps: available.map(({ teamId, recap }) => ({ teamId, recap })),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load game summary';
        setRecapErrorMessage(message);
      } finally {
        setRecapLoading(false);
      }
    },
    [accountId, getTeamName, openRecapDialog, token],
  );

  const handleTeamSelection = useCallback(
    (teamId: string) => {
      if (!pendingRecapAction) {
        return;
      }

      if (pendingRecapAction.mode === 'edit') {
        openRecapDialog(pendingRecapAction.game, teamId, { readOnly: false });
      } else {
        const recap = pendingRecapAction.availableRecaps.find((entry) => entry.teamId === teamId);
        openRecapDialog(pendingRecapAction.game, teamId, {
          readOnly: true,
          initialRecap: recap?.recap ?? '',
        });
      }

      setPendingRecapAction(null);
    },
    [openRecapDialog, pendingRecapAction],
  );

  const handleCloseRecapDialog = useCallback(() => {
    setRecapDialogOpen(false);
    setRecapSelectedGame(null);
    setRecapTeamSeasonId(null);
    setRecapInitialRecap('');
    setRecapReadOnly(false);
    setRecapErrorMessage(null);
  }, []);

  const handleRecapSuccess = useCallback(
    (_recap: UpsertGameRecapType) => {
      if (!recapSelectedGame) {
        return;
      }

      const updatedGame: Game = {
        ...recapSelectedGame,
        hasGameRecap: true,
      };

      setRecapSelectedGame(updatedGame);
      upsertGameInCache(updatedGame);
      setRecapErrorMessage(null);
    },
    [recapSelectedGame, upsertGameInCache],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      setViewModeManuallySelected(mode !== defaultViewMode);
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
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Schedule Management
              </Typography>

              {user && !canEditSchedule && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
                  Read-only mode - Contact an administrator for editing permissions
                </Typography>
              )}
            </Box>
          </Box>
        </AccountPageHeader>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* View Mode Tabs */}
        <Paper sx={{ mb: 3 }}>
          <ViewModeTabs viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </Paper>

        {/* Filter Controls */}
        <Paper sx={{ mb: 3, p: 2 }}>
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
        </Paper>

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
          onEditRecap={handleEditGameRecap}
          onViewRecap={handleViewGameRecap}
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

        <Dialog
          open={Boolean(pendingRecapAction)}
          onClose={() => setPendingRecapAction(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {pendingRecapAction?.mode === 'edit'
              ? 'Select Team to Manage Recap'
              : 'Select Team Recap to View'}
          </DialogTitle>
          <DialogContent dividers>
            <List>
              {pendingRecapAction?.teamOptions.map((team) => (
                <ListItemButton
                  key={team.id}
                  onClick={() => handleTeamSelection(team.id)}
                  disabled={recapLoading}
                >
                  <ListItemText primary={team.name} />
                </ListItemButton>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingRecapAction(null)} disabled={recapLoading}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {recapSelectedGame && recapTeamSeasonId && recapSelectedGame.season?.id && (
          <EnterGameRecapDialog
            open={recapDialogOpen}
            onClose={handleCloseRecapDialog}
            accountId={accountId}
            seasonId={recapSelectedGame.season.id}
            gameId={recapSelectedGame.id}
            teamSeasonId={recapTeamSeasonId}
            initialRecap={recapInitialRecap}
            teamName={getTeamName(recapTeamSeasonId)}
            gameDate={recapSelectedGame.gameDate}
            homeScore={recapSelectedGame.homeScore}
            visitorScore={recapSelectedGame.visitorScore}
            homeTeamName={getTeamName(recapSelectedGame.homeTeamId)}
            visitorTeamName={getTeamName(recapSelectedGame.visitorTeamId)}
            readOnly={recapReadOnly}
            onSuccess={handleRecapSuccess}
            onError={(message) => setRecapErrorMessage(message)}
          />
        )}

        {recapDialogOpen && recapErrorMessage && (
          <Alert
            severity="error"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: (theme) => theme.zIndex.snackbar,
            }}
          >
            {recapErrorMessage}
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
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;
