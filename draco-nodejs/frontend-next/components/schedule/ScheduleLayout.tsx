'use client';
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AccountPageHeader from '../AccountPageHeader';
import AdPlacement from '../ads/AdPlacement';
import WidgetShell from '../ui/WidgetShell';
import ViewModeTabs from './filters/ViewModeTabs';
import ViewFactory from './views/ViewFactory';
import { GameCardData } from '../GameCard';
import { ScheduleLocation } from './types/sportAdapter';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { Game, League, FilterType, ViewMode, NavigationDirection } from '@/types/schedule';

export interface ScheduleLayoutProps {
  accountId: string;
  title: string;
  subtitle?: string;
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
  loadLeagueTeams: (leagueId: string) => void;
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
  children?: React.ReactNode;
}

const ScheduleLayout: React.FC<ScheduleLayoutProps> = ({
  accountId,
  title,
  subtitle,
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
  loadLeagueTeams,
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
          {breadcrumbs}
          <AdPlacement />

          <Paper
            elevation={1}
            sx={{
              mb: 3,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <ViewModeTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </Paper>

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
                      setFilterTeamSeasonId('');
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
                        {team.name ?? 'Unknown Team'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </WidgetShell>

          {children}

          <ViewFactory
            viewMode={viewMode}
            filterType={filterType}
            loadingGames={loadingGames}
            filteredGames={filteredGames}
            timeZone={timeZone}
            canEditSchedule={canEditSchedule}
            onEditGame={onEditGame ?? onGameClick ?? (() => {})}
            onGameResults={onGameResults ?? (() => {})}
            onEditRecap={onEditRecap}
            onViewRecap={onViewRecap}
            convertGameToGameCardData={convertGameToGameCardData}
            canEditRecap={canEditRecap}
            filterDate={filterDate}
            setFilterType={setFilterType}
            setFilterDate={setFilterDate}
            setStartDate={() => {}}
            setEndDate={() => {}}
            startDate={startDate}
            endDate={endDate}
            isNavigating={isNavigating}
            navigateToWeek={navigateToWeek}
            navigate={navigate}
          />
        </Container>

        {feedback && (
          <Snackbar
            open
            autoHideDuration={6000}
            onClose={onFeedbackClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={onFeedbackClose}
              severity={feedback.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {feedback.message}
            </Alert>
          </Snackbar>
        )}

        {recapError && onRecapErrorClose && (
          <Snackbar
            open
            autoHideDuration={6000}
            onClose={onRecapErrorClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={onRecapErrorClose}
              severity="error"
              variant="filled"
              sx={{ width: '100%' }}
            >
              {recapError}
            </Alert>
          </Snackbar>
        )}
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleLayout;
