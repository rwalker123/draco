'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Tab, Tabs } from '@mui/material';
import type {
  CreateGameBattingStatType,
  CreateGamePitchingStatType,
  GameBattingStatLineType,
  GameBattingStatsType,
  GamePitchingStatLineType,
  GamePitchingStatsType,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
  TeamStatsPlayerSummaryType,
  UpdateGameBattingStatType,
  UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

import AttendanceSection from './AttendanceSection';
import BattingStatsSection from './BattingStatsSection';
import PitchingStatsSection from './PitchingStatsSection';
import SeasonBattingStatsSection from './SeasonBattingStatsSection';
import SeasonPitchingStatsSection from './SeasonPitchingStatsSection';
import UnsavedChangesDialog from './dialogs/UnsavedChangesDialog';
import type {
  EditableGridHandle,
  GameOutcome,
  StatsTabsCardHandle,
  UnsavedChangesDecision,
  UnsavedChangesPrompt,
  UnsavedChangesReason,
} from './types';

export type TabKey = 'batting' | 'pitching' | 'attendance';

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
  onCreateBattingStat: (payload: CreateGameBattingStatType) => Promise<void>;
  onUpdateBattingStat: (statId: string, payload: UpdateGameBattingStatType) => Promise<void>;
  onDeleteBattingStat: (stat: GameBattingStatLineType) => void;
  onCreatePitchingStat: (payload: CreateGamePitchingStatType) => Promise<void>;
  onUpdatePitchingStat: (statId: string, payload: UpdateGamePitchingStatType) => Promise<void>;
  onDeletePitchingStat: (stat: GamePitchingStatLineType) => void;
  onProcessError: (error: Error) => void;
  attendanceOptions: TeamStatsPlayerSummaryType[];
  attendanceSelection: string[];
  onAttendanceToggle: (rosterSeasonId: string, present: boolean) => void;
  lockedAttendanceRosterIds: string[];
  attendanceLoading: boolean;
  attendanceError: string | null;
  pendingAttendanceRosterId: string | null;
  seasonBattingStats: PlayerBattingStatsType[] | null;
  seasonPitchingStats: PlayerPitchingStatsType[] | null;
  seasonLoading: boolean;
  seasonError: string | null;
  gameOutcome: GameOutcome;
  onClearGameSelection?: () => void;
}

const StatsTabsCard = forwardRef<StatsTabsCardHandle, StatsTabsCardProps>(
  (
    {
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
      onCreateBattingStat,
      onUpdateBattingStat,
      onDeleteBattingStat,
      onCreatePitchingStat,
      onUpdatePitchingStat,
      onDeletePitchingStat,
      onProcessError,
      attendanceOptions,
      attendanceSelection,
      onAttendanceToggle,
      lockedAttendanceRosterIds,
      attendanceLoading,
      attendanceError,
      pendingAttendanceRosterId,
      seasonBattingStats,
      seasonPitchingStats,
      seasonLoading,
      seasonError,
      gameOutcome,
      onClearGameSelection,
    },
    ref,
  ) => {
    const [editMode, setEditMode] = useState(false);
    const battingGridRef = useRef<EditableGridHandle | null>(null);
    const pitchingGridRef = useRef<EditableGridHandle | null>(null);

    const [battingDirty, setBattingDirty] = useState(false);
    const [pitchingDirty, setPitchingDirty] = useState(false);

    const [unsavedPrompt, setUnsavedPrompt] = useState<UnsavedChangesPrompt | null>(null);
    const unsavedResolverRef = useRef<((decision: UnsavedChangesDecision) => void) | null>(null);

    useEffect(() => {
      if (!selectedGameId || !canManageStats) {
        setEditMode(false);
      }
    }, [selectedGameId, canManageStats]);

    const showAttendanceTab = canManageStats && Boolean(selectedGameId);

    const availableTabs: TabKey[] = useMemo(
      () => (showAttendanceTab ? ['batting', 'pitching', 'attendance'] : ['batting', 'pitching']),
      [showAttendanceTab],
    );

    const currentTab = availableTabs.includes(tab) ? tab : 'batting';

    const requestUnsavedDecision = useCallback(
      (prompt: UnsavedChangesPrompt) =>
        new Promise<UnsavedChangesDecision>((resolve) => {
          unsavedResolverRef.current = resolve;
          setUnsavedPrompt(prompt);
        }),
      [],
    );

    const handleUnsavedDecision = useCallback((decision: UnsavedChangesDecision) => {
      const resolver = unsavedResolverRef.current;
      unsavedResolverRef.current = null;
      setUnsavedPrompt(null);
      resolver?.(decision);
    }, []);

    const resolveGridDirtyRows = useCallback(
      async (
        gridRef: React.RefObject<EditableGridHandle | null>,
        reason: UnsavedChangesReason,
        tabKey: 'batting' | 'pitching',
      ): Promise<boolean> => {
        const handle = gridRef.current;
        if (!handle || !handle.hasDirtyRow()) {
          return true;
        }

        const info = handle.getDirtyRowInfo();
        if (!info) {
          return true;
        }

        const decision = await requestUnsavedDecision({
          reason,
          playerName: info.playerName,
          tab: tabKey,
        });

        if (decision === 'save') {
          return handle.saveDirtyRow();
        }

        if (decision === 'discard') {
          handle.discardDirtyRow();
          return true;
        }

        return false;
      },
      [requestUnsavedDecision],
    );

    const ensureTabClean = useCallback(
      async (tabKey: TabKey, reason: UnsavedChangesReason) => {
        if (tabKey === 'batting') {
          return resolveGridDirtyRows(battingGridRef, reason, 'batting');
        }
        if (tabKey === 'pitching') {
          return resolveGridDirtyRows(pitchingGridRef, reason, 'pitching');
        }
        return true;
      },
      [resolveGridDirtyRows],
    );

    const attemptTabChange = useCallback(
      async (nextTab: TabKey) => {
        if (nextTab === currentTab) {
          return;
        }

        if (editMode && (currentTab === 'batting' || currentTab === 'pitching')) {
          const ok = await ensureTabClean(currentTab, 'tab-change');
          if (!ok) {
            return;
          }
        }

        onTabChange(nextTab);
      },
      [currentTab, editMode, ensureTabClean, onTabChange],
    );

    const handleTabsChange = useCallback(
      (_event: React.SyntheticEvent, newIndex: number) => {
        const nextTab = availableTabs[newIndex] ?? 'batting';
        void attemptTabChange(nextTab);
      },
      [attemptTabChange, availableTabs],
    );

    const handleToggleEditMode = useCallback(async () => {
      if (!canManageStats || !selectedGameId) {
        return;
      }

      try {
        if (!editMode) {
          setEditMode(true);
          return;
        }

        const battingOk = await resolveGridDirtyRows(battingGridRef, 'exit-edit', 'batting');
        if (!battingOk) {
          return;
        }
        const pitchingOk = await resolveGridDirtyRows(pitchingGridRef, 'exit-edit', 'pitching');
        if (!pitchingOk) {
          return;
        }

        setEditMode(false);
      } catch (error) {
        console.error('Unable to toggle edit mode', error);
        onProcessError(error instanceof Error ? error : new Error('Unable to toggle edit mode.'));
      }
    }, [canManageStats, editMode, onProcessError, resolveGridDirtyRows, selectedGameId]);

    const handleViewSeason = useCallback(async () => {
      if (!onClearGameSelection) {
        return;
      }

      const battingOk = await resolveGridDirtyRows(battingGridRef, 'game-change', 'batting');
      if (!battingOk) {
        return;
      }
      const pitchingOk = await resolveGridDirtyRows(pitchingGridRef, 'game-change', 'pitching');
      if (!pitchingOk) {
        return;
      }

      onClearGameSelection();
    }, [onClearGameSelection, resolveGridDirtyRows]);

    useImperativeHandle(
      ref,
      () => ({
        hasPendingEdits: () => battingDirty || pitchingDirty,
        resolvePendingEdits: async (reason: UnsavedChangesReason) => {
          if (!battingDirty && !pitchingDirty) {
            return true;
          }

          const battingOk = await resolveGridDirtyRows(battingGridRef, reason, 'batting');
          if (!battingOk) {
            return false;
          }
          const pitchingOk = await resolveGridDirtyRows(pitchingGridRef, reason, 'pitching');
          return pitchingOk;
        },
      }),
      [battingDirty, pitchingDirty, resolveGridDirtyRows],
    );

    return (
      <>
        {canManageStats && !selectedGameId && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Select a completed game to enable inline editing and attendance management.
          </Alert>
        )}

        <Card>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              pl: 2,
              pr: 2,
            }}
          >
            <Tabs
              value={availableTabs.indexOf(currentTab)}
              onChange={handleTabsChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Team statistics tabs"
              sx={{ flexGrow: 1 }}
            >
              <Tab label="Batting" />
              <Tab label="Pitching" />
              {showAttendanceTab && <Tab label="Attendance" />}
            </Tabs>
            {canManageStats && selectedGameId && (
              <Button
                variant={editMode ? 'contained' : 'outlined'}
                size="small"
                onClick={() => void handleToggleEditMode()}
                sx={{ ml: 2 }}
              >
                {editMode ? 'Exit edit mode' : 'Edit stats'}
              </Button>
            )}
          </Box>

          <CardContent>
            {selectedGameId ? (
              <>
                {!editMode && onClearGameSelection && (
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleViewSeason}
                      sx={{ textTransform: 'none' }}
                    >
                      View season totals
                    </Button>
                  </Box>
                )}

                {error ? (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                ) : loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress aria-label="Loading game statistics" />
                  </Box>
                ) : (
                  <>
                    {currentTab === 'batting' && (
                      <BattingStatsSection
                        mode={editMode ? 'edit' : 'view'}
                        stats={battingStats}
                        totals={battingTotals}
                        availablePlayers={availableBatters}
                        onCreateStat={onCreateBattingStat}
                        onUpdateStat={onUpdateBattingStat}
                        onDeleteStat={onDeleteBattingStat}
                        onProcessError={onProcessError}
                        onRequestUnsavedDecision={requestUnsavedDecision}
                        onDirtyStateChange={setBattingDirty}
                        gridRef={battingGridRef}
                        showViewSeason={!editMode}
                        onViewSeason={handleViewSeason}
                      />
                    )}

                    {currentTab === 'pitching' && (
                      <PitchingStatsSection
                        mode={editMode ? 'edit' : 'view'}
                        stats={pitchingStats}
                        totals={pitchingTotals}
                        availablePlayers={availablePitchers}
                        onCreateStat={onCreatePitchingStat}
                        onUpdateStat={onUpdatePitchingStat}
                        onDeleteStat={onDeletePitchingStat}
                        onProcessError={onProcessError}
                        onRequestUnsavedDecision={requestUnsavedDecision}
                        onDirtyStateChange={setPitchingDirty}
                        gridRef={pitchingGridRef}
                        showViewSeason={!editMode}
                        onViewSeason={handleViewSeason}
                        gameOutcome={gameOutcome}
                      />
                    )}

                    {currentTab === 'attendance' && showAttendanceTab && (
                      <AttendanceSection
                        options={attendanceOptions}
                        selection={attendanceSelection}
                        lockedRosterIds={lockedAttendanceRosterIds}
                        onToggleAttendance={onAttendanceToggle}
                        loading={attendanceLoading}
                        error={attendanceError}
                        pendingRosterId={pendingAttendanceRosterId}
                        canEdit={canManageStats}
                      />
                    )}
                  </>
                )}
              </>
            ) : seasonError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {seasonError}
              </Alert>
            ) : seasonLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress aria-label="Loading season statistics" />
              </Box>
            ) : (
              <>
                {currentTab === 'batting' && (
                  <SeasonBattingStatsSection stats={seasonBattingStats} />
                )}

                {currentTab === 'pitching' && (
                  <SeasonPitchingStatsSection stats={seasonPitchingStats} />
                )}

                {currentTab === 'attendance' && (
                  <Alert severity="info">
                    Attendance tracking is available once a completed game is selected.
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <UnsavedChangesDialog
          open={Boolean(unsavedPrompt)}
          prompt={unsavedPrompt}
          busyAction={null}
          error={null}
          onDecision={handleUnsavedDecision}
          onClose={() => handleUnsavedDecision('cancel')}
        />
      </>
    );
  },
);

StatsTabsCard.displayName = 'StatsTabsCard';

export default StatsTabsCard;
