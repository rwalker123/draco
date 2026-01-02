'use client';

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Box, Button, Card, CardContent, Tab, Tabs } from '@mui/material';
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
import GameRecapSection, { type GameRecapSectionHandle } from './GameRecapSection';
import UnsavedChangesDialog from './dialogs/UnsavedChangesDialog';
import type {
  EditableGridHandle,
  GameOutcome,
  StatsTabsCardHandle,
  UnsavedChangesDecision,
  UnsavedChangesPrompt,
  UnsavedChangesReason,
} from './types';

export type TabKey = 'batting' | 'pitching' | 'recap' | 'attendance';

interface StatsTabsCardProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  canManageStats: boolean;
  enableAttendanceTracking: boolean;
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
  recapContent: string | null;
  recapLoading: boolean;
  recapError: string | null;
  onRecapSave: (content: string) => Promise<void>;
}

const StatsTabsCard = forwardRef<StatsTabsCardHandle, StatsTabsCardProps>(
  (
    {
      tab,
      onTabChange,
      canManageStats,
      enableAttendanceTracking,
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
      recapContent,
      recapLoading,
      recapError,
      onRecapSave,
    },
    ref,
  ) => {
    const [editModeEnabled, setEditModeEnabled] = useState(false);
    const battingGridRef = useRef<EditableGridHandle | null>(null);
    const pitchingGridRef = useRef<EditableGridHandle | null>(null);
    const recapSectionRef = useRef<GameRecapSectionHandle | null>(null);

    const [battingDirty, setBattingDirty] = useState(false);
    const [pitchingDirty, setPitchingDirty] = useState(false);

    const [unsavedPrompt, setUnsavedPrompt] = useState<UnsavedChangesPrompt | null>(null);
    const unsavedResolverRef = useRef<((decision: UnsavedChangesDecision) => void) | null>(null);

    const editMode = Boolean(editModeEnabled && selectedGameId && canManageStats);

    const showAttendanceTab = enableAttendanceTracking && canManageStats && Boolean(selectedGameId);
    const showRecapTab = Boolean(selectedGameId);

    const availableTabs: TabKey[] = useMemo(() => {
      const tabs: TabKey[] = ['batting', 'pitching'];
      if (showRecapTab) {
        tabs.push('recap');
      }
      if (showAttendanceTab) {
        tabs.push('attendance');
      }
      return tabs;
    }, [showRecapTab, showAttendanceTab]);

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
        if (tabKey === 'recap') {
          const handle = recapSectionRef.current;
          if (!handle || !handle.hasDirtyContent()) {
            return true;
          }

          const decision = await requestUnsavedDecision({
            reason,
            playerName: 'Game Recap',
            tab: 'recap',
          });

          if (decision === 'save') {
            return handle.saveContent();
          }
          if (decision === 'discard') {
            handle.discardContent();
            return true;
          }
          return false;
        }
        return true;
      },
      [requestUnsavedDecision, resolveGridDirtyRows],
    );

    const attemptTabChange = useCallback(
      async (nextTab: TabKey) => {
        if (nextTab === currentTab) {
          return;
        }

        if (
          editMode &&
          (currentTab === 'batting' || currentTab === 'pitching' || currentTab === 'recap')
        ) {
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
          setEditModeEnabled(true);
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
        const recapOk = await ensureTabClean('recap', 'exit-edit');
        if (!recapOk) {
          return;
        }

        setEditModeEnabled(false);
      } catch (error) {
        console.error('Unable to toggle edit mode', error);
        onProcessError(error instanceof Error ? error : new Error('Unable to toggle edit mode.'));
      }
    }, [
      canManageStats,
      editMode,
      ensureTabClean,
      onProcessError,
      resolveGridDirtyRows,
      selectedGameId,
    ]);

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
      const recapOk = await ensureTabClean('recap', 'game-change');
      if (!recapOk) {
        return;
      }

      onClearGameSelection();
    }, [ensureTabClean, onClearGameSelection, resolveGridDirtyRows]);

    useImperativeHandle(
      ref,
      () => ({
        hasPendingEdits: () => {
          const recapDirty = recapSectionRef.current?.hasDirtyContent() ?? false;
          return battingDirty || pitchingDirty || recapDirty;
        },
        resolvePendingEdits: async (reason: UnsavedChangesReason) => {
          const battingOk = await resolveGridDirtyRows(battingGridRef, reason, 'batting');
          if (!battingOk) {
            return false;
          }
          const pitchingOk = await resolveGridDirtyRows(pitchingGridRef, reason, 'pitching');
          if (!pitchingOk) {
            return false;
          }
          const recapOk = await ensureTabClean('recap', reason);
          if (!recapOk) {
            return false;
          }
          return true;
        },
      }),
      [battingDirty, pitchingDirty, ensureTabClean, resolveGridDirtyRows],
    );

    return (
      <>
        {canManageStats && !selectedGameId && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Select a completed game to enter statistics.
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
              {showRecapTab && <Tab label="Recap" />}
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

                    {currentTab === 'recap' && showRecapTab && (
                      <GameRecapSection
                        ref={recapSectionRef}
                        gameId={selectedGameId}
                        initialContent={recapContent}
                        loading={recapLoading}
                        error={recapError}
                        editMode={editMode}
                        canEdit={canManageStats}
                        onSave={onRecapSave}
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
              <Alert severity="info" sx={{ mb: 3 }}>
                Loading season statistics…
              </Alert>
            ) : (
              <>
                {currentTab === 'batting' && (
                  <SeasonBattingStatsSection stats={seasonBattingStats} />
                )}

                {currentTab === 'pitching' && (
                  <SeasonPitchingStatsSection stats={seasonPitchingStats} />
                )}

                {currentTab === 'recap' && (
                  <Alert severity="info">
                    Game recaps are available once a completed game is selected.
                  </Alert>
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
