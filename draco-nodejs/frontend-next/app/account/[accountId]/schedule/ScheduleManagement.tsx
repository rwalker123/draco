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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { GameCardData } from '../../../../components/GameCard';
import { getGameTypeText } from '../../../../utils/gameUtils';

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
} from '../../../../components/schedule';

interface ScheduleManagementProps {
  accountId: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole } = useRole();
  const { user } = useAuth();
  const { currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);

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
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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
    loadGamesData,
    loadLeagueTeams,
    clearLeagueTeams,
    setSuccess,
    setError,
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
    // Dialog states
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    gameResultsDialogOpen,
    keepDialogOpen,

    // Selected games
    selectedGame,
    selectedGameForResults,
    dialogLeagueSeason,

    // Form state
    formState,

    // Error states
    editDialogError,
    createDialogError,

    // Actions
    setCreateDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setKeepDialogOpen,
    setGameResultsDialogOpen,
    setDialogLeagueSeason,
    setFormState,
    setEditDialogError,
    setCreateDialogError,

    // CRUD operations
    handleCreateGame,
    handleUpdateGame,
    handleDeleteGame,
    handleSaveGameResults,

    // Dialog management
    openEditDialog,
    openGameResultsDialog,
    initializeCreateForm,
  } = useGameManagement({
    accountId,
    loadGamesData,
    setSuccess,
    setError,
    clearLeagueTeams,
  });

  // Convert Game to GameCardData for display
  const convertGameToGameCardData = useCallback(
    (game: Game): GameCardData => {
      const homeTeam = teams.find((team) => team.id === game.homeTeamId);
      const awayTeam = teams.find((team) => team.id === game.visitorTeamId);

      // Use field data from the game object instead of looking it up in fields array
      // The game object already contains the field data with shortName
      const field = game.field;

      return {
        id: game.id,
        date: game.gameDate,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.visitorTeamId,
        homeTeamName: homeTeam?.name || 'Unknown Team',
        awayTeamName: awayTeam?.name || 'Unknown Team',
        homeScore: game.homeScore,
        awayScore: game.visitorScore,
        gameStatus: game.gameStatus,
        gameStatusText: game.gameStatusText,
        gameStatusShortText: game.gameStatusShortText,
        leagueName: game.league?.name || 'Unknown League',
        fieldId: game.fieldId || null,
        fieldName: field?.name || null,
        fieldShortName: field?.shortName || null,
        hasGameRecap: false, // TODO: Implement game recaps
        gameRecaps: [],
        comment: game.comment,
        gameType: game.gameType,
      };
    },
    [teams],
  );

  // Handle create game button click
  const handleAddGameClick = useCallback(() => {
    initializeCreateForm(filterType, filterDate, startDate);
    setCreateDialogOpen(true);
  }, [initializeCreateForm, filterType, filterDate, startDate, setCreateDialogOpen]);

  // Handle edit game
  const handleEditGame = useCallback(
    (game: Game) => {
      openEditDialog(game);
    },
    [openEditDialog],
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
          <ViewModeTabs viewMode={viewMode} onViewModeChange={setViewMode} />
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

            {canEditSchedule && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddGameClick}
                sx={{ ml: 'auto' }}
              >
                Add Game
              </Button>
            )}
          </Box>
        </Paper>

        {/* Schedule View */}
        <ViewFactory
          viewMode={viewMode}
          filterType={filterType}
          loadingGames={loadingGames}
          filteredGames={filteredGames}
          canEditSchedule={!!canEditSchedule}
          onEditGame={handleEditGame}
          onGameResults={handleGameResults}
          convertGameToGameCardData={convertGameToGameCardData}
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
          title="Create New Game"
          error={createDialogError}
          formState={formState}
          setFormState={setFormState}
          data={{
            leagues,
            fields,
            umpires,
            leagueTeamsCache,
            currentSeasonName: currentSeasonName || undefined,
          }}
          state={{
            dialogLeagueSeason,
            keepDialogOpen,
          }}
          setState={(newState) => {
            if ('dialogLeagueSeason' in newState)
              setDialogLeagueSeason(newState.dialogLeagueSeason!);
            if ('keepDialogOpen' in newState) setKeepDialogOpen(newState.keepDialogOpen!);
          }}
          callbacks={{
            onClose: () => setCreateDialogOpen(false),
            onSubmit: handleCreateGame,
            onErrorClear: () => setCreateDialogError(null),
            getTeamName,
            getFieldName: (fieldId?: string) => fields.find((f) => f.id === fieldId)?.name || '',
            getGameTypeText,
            getAvailableUmpires: (_currentPosition: string, currentValue: string) => {
              return umpires.filter(
                (umpire) =>
                  umpire.id !== currentValue &&
                  umpire.id !== formState.umpire1 &&
                  umpire.id !== formState.umpire2 &&
                  umpire.id !== formState.umpire3 &&
                  umpire.id !== formState.umpire4,
              );
            },
          }}
          permissions={{
            canEditSchedule: !!canEditSchedule,
            isAccountAdmin: !!canEditSchedule,
          }}
        />

        <GameDialog
          open={editDialogOpen}
          mode="edit"
          title="Edit Game"
          selectedGame={selectedGame}
          error={editDialogError}
          formState={formState}
          setFormState={setFormState}
          data={{
            leagues,
            fields,
            umpires,
            leagueTeamsCache,
            currentSeasonName: currentSeasonName || undefined,
          }}
          state={{
            dialogLeagueSeason,
            keepDialogOpen: false,
          }}
          setState={(newState) => {
            if ('dialogLeagueSeason' in newState)
              setDialogLeagueSeason(newState.dialogLeagueSeason!);
          }}
          callbacks={{
            onClose: () => setEditDialogOpen(false),
            onSubmit: handleUpdateGame,
            onDelete: handleDeleteGame,
            onErrorClear: () => setEditDialogError(null),
            getTeamName,
            getFieldName: (fieldId?: string) => fields.find((f) => f.id === fieldId)?.name || '',
            getGameTypeText,
            getAvailableUmpires: (_currentPosition: string, currentValue: string) => {
              return umpires.filter(
                (umpire) =>
                  umpire.id !== currentValue &&
                  umpire.id !== formState.umpire1 &&
                  umpire.id !== formState.umpire2 &&
                  umpire.id !== formState.umpire3 &&
                  umpire.id !== formState.umpire4,
              );
            },
          }}
          permissions={{
            canEditSchedule: !!canEditSchedule,
            isAccountAdmin: !!canEditSchedule,
          }}
        />

        <DeleteGameDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          selectedGame={selectedGame}
          onConfirm={handleDeleteGame}
          getTeamName={getTeamName}
        />

        <GameResultsDialog
          open={gameResultsDialogOpen}
          onClose={() => setGameResultsDialogOpen(false)}
          selectedGame={selectedGameForResults}
          onSave={async (gameId, results) => {
            await handleSaveGameResults(
              results as {
                homeScore: number;
                awayScore: number;
                gameStatus: number;
                emailPlayers: boolean;
                postToTwitter: boolean;
                postToBluesky: boolean;
                postToFacebook: boolean;
              },
            );
          }}
          getTeamName={getTeamName}
        />
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;
