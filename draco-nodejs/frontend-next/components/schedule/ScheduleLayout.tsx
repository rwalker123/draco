'use client';
import React from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import NotificationSnackbar from '../common/NotificationSnackbar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AccountPageHeader from '../AccountPageHeader';
import AdPlacement from '../ads/AdPlacement';
import { GameCardData } from '../GameCard';
import { ScheduleLocation } from './types/sportAdapter';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { Game, League, FilterType, ViewMode, NavigationDirection } from '@/types/schedule';
import ScheduleControl from './ScheduleControl';

export interface ScheduleLayoutProps {
  accountId: string;
  currentTeamSeasonId?: string;
  title: string;
  subtitle?: string;
  titleExtra?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  seasonName: string | null;
  filteredGames: Game[];
  teams: TeamSeasonType[];
  locations: ScheduleLocation[];
  leagues: League[];
  leagueTeams: TeamSeasonType[];
  loadingGames: boolean;
  loadingStaticData: boolean;
  filterType: FilterType;
  filterDate: Date;
  filterLeagueSeasonId: string;
  filterTeamSeasonId: string;
  viewMode: ViewMode;
  setFilterType: (type: FilterType) => void;
  setFilterLeagueSeasonId: (id: string) => void;
  setFilterTeamSeasonId: (id: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  clearLeagueTeams: () => void;
  startDate: Date;
  endDate: Date;
  isNavigating: boolean;
  navigateToWeek: (direction: 'prev' | 'next') => void;
  navigate: (direction: NavigationDirection, type?: FilterType) => void;
  setFilterDate: (date: Date) => void;
  timeZone: string;
  convertGameToGameCardData: (game: Game) => GameCardData;
  onViewRecap?: (game: Game) => void;
  onViewStatistics?: (game: Game) => void;
  canEditSchedule?: boolean;
  onGameClick?: (game: Game) => void;
  onEditGame?: (game: Game) => void;
  onGameResults?: (game: Game) => void;
  onEditRecap?: (game: Game) => void;
  canEditRecap?: (game: GameCardData) => boolean;
  feedback: { severity: 'success' | 'error'; message: string } | null;
  onFeedbackClose: () => void;
  recapError?: string | null;
  onRecapErrorClose?: () => void;
  showLeagueTeamFilters?: boolean;
  summaryContent?: React.ReactNode;
  scrollToTodayNonce?: number;
  onScrollToToday?: () => void;
  children?: React.ReactNode;
}

const ScheduleLayout: React.FC<ScheduleLayoutProps> = ({
  accountId,
  currentTeamSeasonId,
  title,
  subtitle,
  titleExtra,
  breadcrumbs,
  seasonName,
  filteredGames,
  leagues,
  leagueTeams,
  loadingGames,
  loadingStaticData,
  filterType,
  filterDate,
  filterLeagueSeasonId,
  filterTeamSeasonId,
  viewMode,
  setFilterType,
  setFilterLeagueSeasonId,
  setFilterTeamSeasonId,
  onViewModeChange,
  clearLeagueTeams,
  startDate,
  endDate,
  isNavigating,
  navigateToWeek,
  navigate,
  setFilterDate,
  timeZone,
  convertGameToGameCardData,
  onViewRecap,
  onViewStatistics,
  canEditSchedule = false,
  onGameClick,
  onEditGame,
  onGameResults,
  onEditRecap,
  canEditRecap,
  feedback,
  onFeedbackClose,
  recapError,
  onRecapErrorClose,
  showLeagueTeamFilters = true,
  summaryContent,
  scrollToTodayNonce,
  onScrollToToday,
  children,
}) => {
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
        <AccountPageHeader accountId={accountId} seasonName={seasonName} showSeasonInfo={true}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
          >
            {title}
          </Typography>
          {titleExtra}
          {subtitle ? (
            <Typography
              variant="body1"
              sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </AccountPageHeader>

        <Container maxWidth={false} sx={{ py: 4 }}>
          <Box sx={{ mb: 3 }}>
            <AdPlacement />
          </Box>
          {breadcrumbs}

          <ScheduleControl
            accountId={accountId}
            currentTeamSeasonId={currentTeamSeasonId}
            filteredGames={filteredGames}
            leagues={leagues}
            leagueTeams={leagueTeams}
            loadingGames={loadingGames}
            filterType={filterType}
            filterDate={filterDate}
            filterLeagueSeasonId={filterLeagueSeasonId}
            filterTeamSeasonId={filterTeamSeasonId}
            viewMode={viewMode}
            setFilterType={setFilterType}
            setFilterLeagueSeasonId={setFilterLeagueSeasonId}
            setFilterTeamSeasonId={setFilterTeamSeasonId}
            onViewModeChange={onViewModeChange}
            clearLeagueTeams={clearLeagueTeams}
            startDate={startDate}
            endDate={endDate}
            isNavigating={isNavigating}
            navigateToWeek={navigateToWeek}
            navigate={navigate}
            setFilterDate={setFilterDate}
            timeZone={timeZone}
            convertGameToGameCardData={convertGameToGameCardData}
            onViewRecap={onViewRecap}
            onViewStatistics={onViewStatistics}
            canEditSchedule={canEditSchedule}
            onGameClick={onGameClick}
            onEditGame={onEditGame}
            onGameResults={onGameResults}
            onEditRecap={onEditRecap}
            canEditRecap={canEditRecap}
            showLeagueTeamFilters={showLeagueTeamFilters}
            summaryContent={summaryContent}
            scrollToTodayNonce={scrollToTodayNonce}
            onScrollToToday={onScrollToToday}
          >
            {children}
          </ScheduleControl>
        </Container>

        {feedback && <NotificationSnackbar notification={feedback} onClose={onFeedbackClose} />}
        {recapError && onRecapErrorClose && (
          <NotificationSnackbar
            notification={{ message: recapError, severity: 'error' }}
            onClose={onRecapErrorClose}
          />
        )}
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleLayout;
