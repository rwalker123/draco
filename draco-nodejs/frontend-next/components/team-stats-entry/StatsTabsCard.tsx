'use client';

import React from 'react';
import { Alert, Box, Card, CardContent, Tabs, Tab, CircularProgress } from '@mui/material';
import type {
  GameBattingStatLineType,
  GameBattingStatsType,
  GamePitchingStatLineType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import BattingStatsSection from './BattingStatsSection';
import PitchingStatsSection from './PitchingStatsSection';
import AttendanceSection from './AttendanceSection';

export const TabIndexMap = {
  batting: 0,
  pitching: 1,
  attendance: 2,
} as const;

export type TabKey = keyof typeof TabIndexMap;

interface StatsTabsCardProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  canManageStats: boolean;
  loading: boolean;
  error: string | null;
  selectedGameId: string | null;
  battingStats: GameBattingStatsType | null;
  pitchingStats: GamePitchingStatsType | null;
  battingTotals: GameBattingStatsType['totals'] | null;
  pitchingTotals: GamePitchingStatsType['totals'] | null;
  availableBatters: TeamStatsPlayerSummaryType[];
  availablePitchers: TeamStatsPlayerSummaryType[];
  onAddBatter: () => void;
  onEditBatter: (stat: GameBattingStatLineType) => void;
  onDeleteBatter: (stat: GameBattingStatLineType) => void;
  onAddPitcher: () => void;
  onEditPitcher: (stat: GamePitchingStatLineType) => void;
  onDeletePitcher: (stat: GamePitchingStatLineType) => void;
  attendanceOptions: TeamStatsPlayerSummaryType[];
  attendanceSelection: string[];
  onAttendanceSelectionChange: (selection: string[]) => void;
  lockedAttendanceRosterIds: string[];
  attendanceLoading: boolean;
  attendanceError: string | null;
  attendanceSaving: boolean;
}

const StatsTabsCard: React.FC<StatsTabsCardProps> = ({
  tab,
  onTabChange,
  canManageStats,
  loading,
  error,
  selectedGameId,
  battingStats,
  pitchingStats,
  battingTotals,
  pitchingTotals,
  availableBatters,
  availablePitchers,
  onAddBatter,
  onEditBatter,
  onDeleteBatter,
  onAddPitcher,
  onEditPitcher,
  onDeletePitcher,
  attendanceOptions,
  attendanceSelection,
  onAttendanceSelectionChange,
  lockedAttendanceRosterIds,
  attendanceLoading,
  attendanceError,
  attendanceSaving,
}) => {
  const handleTabChange = (_event: React.SyntheticEvent, newIndex: number) => {
    if (newIndex === TabIndexMap.pitching) {
      onTabChange('pitching');
    } else if (newIndex === TabIndexMap.attendance && canManageStats) {
      onTabChange('attendance');
    } else {
      onTabChange('batting');
    }
  };

  return (
    <Card>
      <Tabs
        value={TabIndexMap[tab]}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
        aria-label="Game statistics tabs"
      >
        <Tab label="Batting" />
        <Tab label="Pitching" />
        {canManageStats && <Tab label="Attendance" />}
      </Tabs>

      <CardContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} aria-label="Loading statistics" />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && selectedGameId && (
          <>
            {tab === 'batting' && (
              <BattingStatsSection
                canManage={canManageStats}
                stats={battingStats}
                totals={battingTotals}
                availablePlayers={availableBatters}
                onAdd={onAddBatter}
                onEdit={onEditBatter}
                onDelete={onDeleteBatter}
              />
            )}

            {tab === 'pitching' && (
              <PitchingStatsSection
                canManage={canManageStats}
                stats={pitchingStats}
                totals={pitchingTotals}
                availablePlayers={availablePitchers}
                onAdd={onAddPitcher}
                onEdit={onEditPitcher}
                onDelete={onDeletePitcher}
              />
            )}

            {tab === 'attendance' && canManageStats && (
              <AttendanceSection
                options={attendanceOptions}
                selection={attendanceSelection}
                lockedRosterIds={lockedAttendanceRosterIds}
                onSelectionChange={onAttendanceSelectionChange}
                loading={attendanceLoading}
                error={attendanceError}
                saving={attendanceSaving}
                canEdit={canManageStats}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsTabsCard;
