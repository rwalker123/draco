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
import { useAccountTimezone } from '../../../../context/AccountContext';
import { GameCardData } from '../../../../components/GameCard';
import { getGameTypeText } from '../../../../utils/gameUtils';
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
} from '../../../../components/schedule';

interface ScheduleManagementProps {
  accountId: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole } = useRole();
  const { user } = useAuth();
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
    loadUmpires,
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
    handleDeleteGame,
    handleSaveGameResults,
    setSelectedGame,
    setSelectedGameForResults,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openGameResultsDialog,
  } = useGameManagement({
    accountId,
    loadGamesData,
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
      return convertGameToGameCardData(game, teams);
    },
    [teams],
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
          timeZone={timeZone}
          canEditSchedule={!!canEditSchedule}
          onEditGame={handleEditGame}
          onGameResults={handleGameResults}
          convertGameToGameCardData={convertGameToGameCardDataWithTeams}
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
          onSuccess={({ message }) => {
            setSuccess(message);
            loadGamesData();
          }}
          onError={(message) => setError(message)}
          getTeamName={getTeamName}
          getFieldName={getFieldNameById}
          getGameTypeText={getGameTypeText}
        />

        <GameDialog
          open={editDialogOpen}
          mode="edit"
          title="Edit Game"
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
          onSuccess={({ message }) => {
            setSuccess(message);
            loadGamesData();
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
          onClose={() => setDeleteDialogOpen(false)}
          selectedGame={selectedGame}
          onConfirm={handleDeleteGame}
          getTeamName={getTeamName}
        />

        <GameResultsDialog
          open={gameResultsDialogOpen}
          onClose={() => {
            setGameResultsDialogOpen(false);
            setSelectedGameForResults(null);
          }}
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
          timeZone={timeZone}
        />
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;
