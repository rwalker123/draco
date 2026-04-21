'use client';
import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { getTeamSeasonDetails as apiGetTeamSeasonDetails } from '@draco/shared-api-client';
import type { TeamSeasonRecordType } from '@draco/shared-schemas';
import { useAuth } from '../../../../../../../../context/AuthContext';
import { useAccountTimezone, useAccount } from '../../../../../../../../context/AccountContext';
import { useApiClient } from '../../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../../utils/apiResult';
import { GameCardData } from '../../../../../../../../components/GameCard';
import { getGameSummary } from '../../../../../../../../lib/utils';
import { convertGameToGameCardData } from '../../../../../../../../utils/gameTransformers';
import { useGameRecapFlow } from '../../../../../../../../hooks/useGameRecapFlow';
import { useSchedulePermissions } from '../../../../../../../../hooks/useSchedulePermissions';
import {
  ScheduleLayout,
  useScheduleFilters,
  useTeamScheduleData,
  Game,
  FilterType,
  ViewMode,
} from '../../../../../../../../components/schedule';
import { useTeamSeasonSummary } from '../../../../../../../../components/schedule/hooks/useTeamSeasonSummary';
import SeasonSummaryWidget from '../../../../../../../../components/schedule/SeasonSummaryWidget';
import { isGolfLeagueAccountType } from '../../../../../../../../utils/accountTypeUtils';

interface TeamSchedulePageProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const CALENDAR_VIEW_BREAKPOINT = 900;

const TeamSchedulePage: React.FC<TeamSchedulePageProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const { token } = useAuth();
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;
  const apiClient = useApiClient();
  const isGolfLeague = isGolfLeagueAccountType(accountType);

  const [teamName, setTeamName] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const prefersListView = useMediaQuery(`(max-width:${CALENDAR_VIEW_BREAKPOINT}px)`);
  const defaultViewMode = prefersListView ? 'list' : 'calendar';
  const [manualViewMode, setManualViewMode] = useState<ViewMode | null>(null);
  const viewMode = manualViewMode ?? defaultViewMode;

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  const setError = (message: string | null) => {
    if (message) {
      setFeedback({ severity: 'error', message });
    } else {
      setFeedback((prev) => (prev?.severity === 'error' ? null : prev));
    }
  };

  useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    const controller = new AbortController();

    const loadTeamDetails = async () => {
      try {
        const result = await apiGetTeamSeasonDetails({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          signal: controller.signal,
          throwOnError: false,
        });
        if (controller.signal.aborted) return;
        const data = unwrapApiResult<TeamSeasonRecordType>(result, 'Failed to load team details');
        setTeamName(data.name ?? null);
        setSeasonName(data.season?.name ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load team details';
        setFeedback({ severity: 'error', message });
      }
    };

    void loadTeamDetails();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, apiClient]);

  const {
    games,
    locations,
    loadingGames,
    loadingStaticData,
    loadingDateRange,
    earliestGameDate,
    latestGameDate,
    startDate,
    endDate,
    GameDialog,
    supportsTeamSchedule,
  } = useTeamScheduleData({
    accountId,
    seasonId,
    teamSeasonId,
    accountType,
    filterType,
    filterDate,
    onError: setError,
  });

  const updateFilterDate = (date: Date) => {
    setFilterDate(date);
  };

  if (filterDate === undefined && !loadingDateRange) {
    const today = new Date();
    if (earliestGameDate && latestGameDate) {
      const withinRange = today >= earliestGameDate && today <= latestGameDate;
      setFilterDate(withinRange ? today : earliestGameDate);
    } else {
      setFilterDate(today);
    }
  }

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
    filterDate: filterDate ?? new Date(),
    setFilterDate: updateFilterDate,
  });

  const { summary: seasonSummary, loading: loadingSeasonSummary } = useTeamSeasonSummary({
    accountId,
    seasonId,
    teamSeasonId,
    accountType,
    earliestGameDate,
    latestGameDate,
    timeZone,
    onError: setError,
  });

  const { canEditRecap } = useSchedulePermissions({ accountId, teamSeasonId });

  const convertGameToGameCardDataWithTeams = (game: Game): GameCardData => {
    return convertGameToGameCardData(game, [], locations);
  };

  const fetchRecapForTeam = async (game: Game, targetTeamId: string): Promise<string | null> => {
    const recap = await getGameSummary({
      accountId,
      seasonId,
      gameId: game.id,
      teamSeasonId: targetTeamId,
      token: token ?? undefined,
    });

    return recap ?? null;
  };

  const {
    openEditRecap,
    openViewRecap,
    dialogs: recapDialogs,
    error: recapError,
    clearError: clearRecapError,
  } = useGameRecapFlow<Game>({
    accountId,
    seasonId,
    fetchRecap: fetchRecapForTeam,
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setManualViewMode(mode === defaultViewMode ? null : mode);
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedGame(null);
  };

  if (isGolfLeague) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info">The team schedule view is not available for golf leagues.</Alert>
      </Container>
    );
  }

  if (!supportsTeamSchedule && !loadingStaticData) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info">This league does not support the team schedule view.</Alert>
      </Container>
    );
  }

  const isResolvingInitialDate = filterDate === undefined;

  const teamHomeHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  return (
    <ScheduleLayout
      accountId={accountId}
      title={teamName ?? 'Team Schedule'}
      titleExtra={
        seasonName ? (
          <Typography
            variant="body1"
            sx={{ mt: 1, textAlign: 'center', color: 'text.secondary', fontWeight: 'normal' }}
          >
            {seasonName} Season
          </Typography>
        ) : null
      }
      subtitle="Schedule"
      breadcrumbs={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={NextLink} underline="hover" color="inherit" href={teamHomeHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">Schedule</Typography>
          </Breadcrumbs>
        </Box>
      }
      seasonName={null}
      filteredGames={filteredGames}
      teams={[]}
      locations={locations}
      leagues={[]}
      leagueTeams={[]}
      loadingGames={loadingGames || isResolvingInitialDate}
      loadingStaticData={loadingStaticData || isResolvingInitialDate}
      filterType={filterType}
      filterDate={filterDate ?? new Date()}
      filterLeagueSeasonId={filterLeagueSeasonId}
      filterTeamSeasonId={filterTeamSeasonId}
      viewMode={viewMode}
      setFilterType={setFilterType}
      setFilterLeagueSeasonId={setFilterLeagueSeasonId}
      setFilterTeamSeasonId={setFilterTeamSeasonId}
      onViewModeChange={handleViewModeChange}
      clearLeagueTeams={() => {}}
      startDate={startDate}
      endDate={endDate}
      isNavigating={isNavigating}
      navigateToWeek={navigateToWeek}
      navigate={navigate}
      setFilterDate={updateFilterDate}
      timeZone={timeZone}
      convertGameToGameCardData={convertGameToGameCardDataWithTeams}
      canEditRecap={canEditRecap}
      onEditRecap={openEditRecap}
      onViewRecap={openViewRecap}
      onGameClick={handleGameClick}
      feedback={feedback}
      onFeedbackClose={handleFeedbackClose}
      recapError={recapError}
      onRecapErrorClose={clearRecapError}
      showLeagueTeamFilters={false}
      summaryContent={
        <SeasonSummaryWidget
          summary={seasonSummary}
          loading={loadingSeasonSummary}
          ready={!loadingDateRange}
        />
      }
    >
      <GameDialog
        open={viewDialogOpen}
        mode="edit"
        accountId={accountId}
        timeZone={timeZone}
        selectedGame={selectedGame}
        leagues={[]}
        locations={locations}
        leagueTeamsCache={new Map()}
        canEditSchedule={false}
        onClose={handleViewDialogClose}
        onSuccess={() => {}}
        onError={() => {}}
      />

      {recapDialogs}
    </ScheduleLayout>
  );
};

export default TeamSchedulePage;
