'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccountTimezone, useAccount } from '../../../../context/AccountContext';
import { GameCardData } from '../../../../components/GameCard';
import { getGameSummary } from '../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../utils/gameTransformers';
import { useGameRecapFlow } from '../../../../hooks/useGameRecapFlow';
import {
  useScheduleData,
  useScheduleFilters,
  ScheduleLayout,
  Game,
  FilterType,
  ViewMode,
} from '../../../../components/schedule';
import { isGolfLeagueAccountType } from '../../../../utils/accountTypeUtils';
import GolfScorecardDialog from '../../../../components/golf/GolfScorecardDialog';

interface ScheduleProps {
  accountId: string;
}

const CALENDAR_VIEW_BREAKPOINT = 900;

const Schedule: React.FC<ScheduleProps> = ({ accountId }) => {
  const { token } = useAuth();
  const { currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;

  useEffect(() => {
    if (accountId) {
      fetchCurrentSeason().catch(console.error);
    }
  }, [accountId, fetchCurrentSeason]);

  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const prefersListView = useMediaQuery(`(max-width:${CALENDAR_VIEW_BREAKPOINT}px)`);
  const defaultViewMode = prefersListView ? 'list' : 'calendar';
  const [manualViewMode, setManualViewMode] = useState<ViewMode | null>(null);
  const viewMode = manualViewMode ?? defaultViewMode;

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const isGolfLeague = isGolfLeagueAccountType(accountType);

  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFeedbackClose = useCallback(() => {
    setFeedback(null);
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
    leagues,
    leagueTeams,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
    loadLeagueTeams,
    clearLeagueTeams,
    startDate,
    endDate,
    GameDialog,
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

  const convertGameToGameCardDataWithTeams = useCallback(
    (game: Game): GameCardData => {
      return convertGameToGameCardData(game, teams, locations);
    },
    [teams, locations],
  );

  const getTeamName = useCallback(
    (teamId: string): string => {
      const team = teams.find((t) => t.id === teamId);
      return team?.name || 'Unknown Team';
    },
    [teams],
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

  const {
    openViewRecap,
    dialogs: recapDialogs,
    error: recapError,
    clearError: clearRecapError,
  } = useGameRecapFlow<Game>({
    accountId,
    resolveSeasonId: (game) => game.season?.id ?? null,
    fetchRecap: fetchRecapForTeam,
    getTeamName: (_game, teamId) => getTeamName(teamId),
  });

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setManualViewMode(mode === defaultViewMode ? null : mode);
    },
    [defaultViewMode],
  );

  const handleGameClick = useCallback(
    (game: Game) => {
      if (isGolfLeague) {
        setSelectedMatchId(game.id);
      } else {
        setSelectedGame(game);
        setViewDialogOpen(true);
      }
    },
    [isGolfLeague],
  );

  const handleViewDialogClose = useCallback(() => {
    setViewDialogOpen(false);
    setSelectedGame(null);
  }, []);

  const handleScorecardClose = useCallback(() => {
    setSelectedMatchId(null);
  }, []);

  return (
    <ScheduleLayout
      accountId={accountId}
      title="Schedule"
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
      onGameClick={handleGameClick}
      feedback={feedback}
      onFeedbackClose={handleFeedbackClose}
      recapError={recapError}
      onRecapErrorClose={clearRecapError}
    >
      {!isGolfLeague && (
        <GameDialog
          open={viewDialogOpen}
          mode="edit"
          accountId={accountId}
          timeZone={timeZone}
          selectedGame={selectedGame}
          leagues={leagues}
          locations={locations}
          leagueTeamsCache={leagueTeamsCache}
          canEditSchedule={false}
          onClose={handleViewDialogClose}
          onSuccess={() => {}}
          onError={() => {}}
        />
      )}

      {isGolfLeague && selectedMatchId && (
        <GolfScorecardDialog
          open={!!selectedMatchId}
          onClose={handleScorecardClose}
          matchId={selectedMatchId}
          accountId={accountId}
        />
      )}

      {recapDialogs}
    </ScheduleLayout>
  );
};

export default Schedule;
