'use client';
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import WidgetShell from '../ui/WidgetShell';
import ViewModeTabs from './filters/ViewModeTabs';
import ViewFactory from './views/ViewFactory';
import LeagueTeamFilter from './LeagueTeamFilter';
import { GameCardData } from '../GameCard';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { Game, League, FilterType, ViewMode, NavigationDirection } from '@/types/schedule';

export interface ScheduleControlProps {
  accountId: string;
  currentTeamSeasonId?: string;
  filteredGames: Game[];
  leagues: League[];
  leagueTeams: TeamSeasonType[];
  loadingGames: boolean;
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
  showLeagueTeamFilters?: boolean;
  readOnly?: boolean;
  summaryContent?: React.ReactNode;
  scrollToTodayNonce?: number;
  onScrollToToday?: () => void;
  children?: React.ReactNode;
}

const ScheduleControl: React.FC<ScheduleControlProps> = ({
  accountId,
  currentTeamSeasonId,
  filteredGames,
  leagues,
  leagueTeams,
  loadingGames,
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
  showLeagueTeamFilters = true,
  readOnly = false,
  summaryContent,
  scrollToTodayNonce,
  onScrollToToday,
  children,
}) => {
  return (
    <>
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

          {showLeagueTeamFilters ? (
            <LeagueTeamFilter
              leagues={leagues}
              teams={leagueTeams.map((team) => ({
                id: team.id,
                name: team.name,
                divisionName: team.division?.name,
              }))}
              leagueValue={filterLeagueSeasonId}
              teamValue={filterTeamSeasonId}
              onLeagueChange={(leagueId) => {
                setFilterLeagueSeasonId(leagueId);
                if (!leagueId) {
                  clearLeagueTeams();
                }
              }}
              onTeamChange={setFilterTeamSeasonId}
            />
          ) : null}
        </Box>
      </WidgetShell>

      {summaryContent}

      {children}

      <ViewFactory
        viewMode={viewMode}
        filterType={filterType}
        accountId={accountId}
        currentTeamSeasonId={currentTeamSeasonId}
        loadingGames={loadingGames}
        filteredGames={filteredGames}
        timeZone={timeZone}
        canEditSchedule={canEditSchedule}
        readOnly={readOnly}
        onEditGame={onEditGame ?? onGameClick ?? (() => {})}
        onGameResults={onGameResults ?? (() => {})}
        onEditRecap={onEditRecap}
        onViewRecap={onViewRecap}
        onViewStatistics={onViewStatistics}
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
        scrollToTodayNonce={scrollToTodayNonce}
        onScrollToToday={onScrollToToday}
      />
    </>
  );
};

export default ScheduleControl;
