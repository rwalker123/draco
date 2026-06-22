'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Divider, LinearProgress, Typography } from '@mui/material';
import type {
  SchedulerGameRequest,
  SchedulerGenerateMatchupsRequest,
  SchedulerProblemSpecPreview,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerSolveResult,
} from '@draco/shared-schemas';
import { useSeasonSchedulerOperations } from '../../hooks/useSeasonSchedulerOperations';
import { useSeasonSchedulerConstraintHandlers } from '../../hooks/useSeasonSchedulerConstraintHandlers';
import { useEntityNameMaps } from '../../hooks/useEntityNameMaps';
import { SeasonSchedulerConfigPanel } from './SeasonSchedulerConfigPanel';
import { SeasonSchedulerProposalReview } from './SeasonSchedulerProposalReview';
import { SchedulerFieldsConfig } from './SchedulerFieldsConfig';
import { SchedulerUmpiresConfig } from './SchedulerUmpiresConfig';
import { SchedulerConstraintsConfig } from './SchedulerConstraintsConfig';
import { loadRoundRobinCounts, type LeagueRoundRobinCount } from './SchedulerRoundRobinConfig';
import {
  clearPersistedProposal,
  loadPersistedProposal,
  savePersistedProposal,
} from '../../utils/schedulerProposalStorage';
import {
  buildSolveConstraints,
  cloneDefaultConfig,
  loadConstraintConfig,
  saveConstraintConfig,
  type SchedulerConstraintConfig,
} from '../../utils/schedulerConstraintStorage';

type FieldOption = { id: string; name: string };
type EntityOption = { id: string; name: string };
type UmpiresPerGame = 1 | 2 | 3 | 4;

const parseUmpiresPerGame = (value: number | null | undefined): UmpiresPerGame =>
  value === 1 || value === 2 || value === 3 || value === 4 ? value : 2;

const parseMaxGamesInput = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

const sameIdSet = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
};

const buildScheduleUmpiresKey = (accountId: string, seasonId: string) =>
  `scheduler:scheduleUmpires:${accountId}:${seasonId}`;

const loadScheduleUmpires = (accountId: string, seasonId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(buildScheduleUmpiresKey(accountId, seasonId)) === 'true';
  } catch {
    return false;
  }
};

const saveScheduleUmpires = (accountId: string, seasonId: string, value: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(buildScheduleUmpiresKey(accountId, seasonId), String(value));
  } catch {
    return;
  }
};

interface SeasonSchedulerWidgetProps {
  accountId: string;
  seasonId: string | null;
  canEdit: boolean;
  timeZone: string;
  leagueSeasonIdFilter?: string;
  teamSeasonIdFilter?: string;
  fields: FieldOption[];
  leagues: EntityOption[];
  teams: EntityOption[];
  umpires: EntityOption[];
  getGameSummaryLabel: (gameId: string) => string;
  onApplied: () => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

export const SeasonSchedulerWidget: React.FC<SeasonSchedulerWidgetProps> = ({
  accountId,
  seasonId,
  canEdit,
  timeZone,
  leagueSeasonIdFilter,
  teamSeasonIdFilter,
  fields,
  leagues,
  teams,
  umpires,
  getGameSummaryLabel,
  onApplied,
  setSuccess,
  setError,
}) => {
  const ops = useSeasonSchedulerOperations(accountId, seasonId);
  const {
    getSeasonWindowConfig,
    upsertSeasonWindowConfig,
    getProblemSpecPreview,
    generateMatchups,
    enqueueSeasonRun,
    getSeasonRun,
    applySeason,
    loading,
    error,
    clearError,
  } = ops;

  const getSeasonWindowConfigRef = useRef(getSeasonWindowConfig);

  const constraints = useSeasonSchedulerConstraintHandlers({
    seasonId,
    canEdit,
    ...ops,
    setSuccess,
    setError,
  });

  const [seasonWindowConfig, setSeasonWindowConfig] = useState<SchedulerSeasonWindowConfig | null>(
    null,
  );
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');
  const [leagueSeasonSelection, setLeagueSeasonSelection] = useState<string[] | null>(null);
  const [persistedProposal] = useState(() =>
    seasonId ? loadPersistedProposal(accountId, seasonId) : null,
  );
  const [proposal, setProposal] = useState<SchedulerSolveResult | null>(
    persistedProposal?.proposal ?? null,
  );
  const [proposalFromGenerated, setProposalFromGenerated] = useState(
    persistedProposal?.proposalFromGenerated ?? false,
  );
  const [generatedMatchups, setGeneratedMatchups] = useState<SchedulerGameRequest[] | null>(
    persistedProposal?.generatedMatchups ?? null,
  );
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(
    new Set(persistedProposal?.selectedGameIds ?? []),
  );
  const [specPreview, setSpecPreview] = useState<SchedulerProblemSpecPreview | null>(null);
  const [specPreviewOpen, setSpecPreviewOpen] = useState(false);
  const [umpiresPerGame, setUmpiresPerGame] = useState<UmpiresPerGame>(2);
  const [maxGamesPerUmpirePerDayInput, setMaxGamesPerUmpirePerDayInput] = useState('');
  const [roundRobinCounts, setRoundRobinCounts] = useState<Map<string, LeagueRoundRobinCount>>(
    () => (seasonId ? loadRoundRobinCounts(accountId, seasonId) : new Map()),
  );
  const [scheduleUmpires, setScheduleUmpires] = useState(() =>
    seasonId ? loadScheduleUmpires(accountId, seasonId) : false,
  );
  const [constraintConfig, setConstraintConfig] = useState<SchedulerConstraintConfig>(() =>
    seasonId ? loadConstraintConfig(accountId, seasonId) : cloneDefaultConfig(),
  );
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState<{ processed: number; total: number } | null>(null);
  const pollControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controllerRef = pollControllerRef;
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    if (proposal) {
      savePersistedProposal(accountId, seasonId, {
        proposal,
        proposalFromGenerated,
        generatedMatchups,
        selectedGameIds: Array.from(selectedGameIds),
      });
    } else {
      clearPersistedProposal(accountId, seasonId);
    }
  }, [accountId, seasonId, proposal, proposalFromGenerated, generatedMatchups, selectedGameIds]);

  const { fieldNameById, teamNameById, umpireNameById } = useEntityNameMaps({
    fields,
    teams,
    umpires,
  });
  const leagueNameById = new Map<string, string>(leagues.map((l) => [l.id, l.name]));
  const allLeagueSeasonIds = leagues.map((l) => l.id);
  const leagueIdSet = new Set(allLeagueSeasonIds);
  const normalizedManualLeagues =
    leagueSeasonSelection?.filter((id) => leagueIdSet.has(id)) ?? null;
  const selectedLeagueSeasonIds: string[] =
    normalizedManualLeagues && normalizedManualLeagues.length > 0
      ? normalizedManualLeagues
      : leagueSeasonIdFilter
        ? [leagueSeasonIdFilter]
        : allLeagueSeasonIds;

  const seasonDatesDirty =
    seasonStartDate !== (seasonWindowConfig?.startDate ?? '') ||
    seasonEndDate !== (seasonWindowConfig?.endDate ?? '');

  const savedLeagueSeasonIds = seasonWindowConfig?.leagueSeasonIds ?? [];
  const dirtyLeagueBaseline =
    savedLeagueSeasonIds.length > 0 ? savedLeagueSeasonIds : allLeagueSeasonIds;
  const leagueSelectionDirty =
    allLeagueSeasonIds.length > 0 && !sameIdSet(selectedLeagueSeasonIds, dirtyLeagueBaseline);

  const assignments = proposal?.assignments ?? [];
  const selectedMode: SchedulerSeasonApplyRequest['mode'] =
    !proposal || selectedGameIds.size === assignments.length ? 'all' : 'subset';
  const selectedIdsArray = Array.from(selectedGameIds.values()).sort();

  useEffect(() => {
    if (!canEdit || !seasonId) return;

    const controller = new AbortController();

    const doLoadSeasonWindow = async () => {
      const config = await getSeasonWindowConfigRef.current(controller.signal);
      if (controller.signal.aborted) return;
      setSeasonWindowConfig(config);
      if (config) {
        setSeasonStartDate(config.startDate);
        setSeasonEndDate(config.endDate);
        setUmpiresPerGame(parseUmpiresPerGame(config.umpiresPerGame));
        setMaxGamesPerUmpirePerDayInput(parseMaxGamesInput(config.maxGamesPerUmpirePerDay));
        if (config.leagueSeasonIds && config.leagueSeasonIds.length > 0) {
          setLeagueSeasonSelection(config.leagueSeasonIds);
        }
      }
    };

    doLoadSeasonWindow().catch((err: unknown) => {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : 'Failed to load season window');
    });

    return () => {
      controller.abort();
    };
  }, [canEdit, seasonId, setError]);

  useEffect(() => {
    if (!seasonId) return;
    setRoundRobinCounts(loadRoundRobinCounts(accountId, seasonId));
    setScheduleUmpires(loadScheduleUmpires(accountId, seasonId));
    setConstraintConfig(loadConstraintConfig(accountId, seasonId));
  }, [accountId, seasonId]);

  const handleScheduleUmpiresChange = (value: boolean) => {
    setScheduleUmpires(value);
    if (seasonId) {
      saveScheduleUmpires(accountId, seasonId, value);
    }
  };

  const handleConstraintConfigChange = (next: SchedulerConstraintConfig) => {
    setConstraintConfig(next);
    if (seasonId) {
      saveConstraintConfig(accountId, seasonId, next);
    }
  };

  const handleSaveSeasonWindow = async () => {
    if (!seasonId) return;

    const trimmedMaxGames = maxGamesPerUmpirePerDayInput.trim();
    const maxGamesPerUmpirePerDay = trimmedMaxGames.length > 0 ? Number(trimmedMaxGames) : null;
    if (maxGamesPerUmpirePerDay !== null) {
      if (!Number.isFinite(maxGamesPerUmpirePerDay) || maxGamesPerUmpirePerDay <= 0) {
        throw new Error('Max games/day per umpire must be a positive number');
      }
    }

    const payload: SchedulerSeasonWindowConfigUpsert = {
      seasonId,
      startDate: seasonStartDate.trim(),
      endDate: seasonEndDate.trim(),
      leagueSeasonIds: selectedLeagueSeasonIds,
      umpiresPerGame,
      maxGamesPerUmpirePerDay,
    };

    const updated = await upsertSeasonWindowConfig(payload);
    setSeasonWindowConfig(updated);
    setSeasonStartDate(updated.startDate);
    setSeasonEndDate(updated.endDate);
    setUmpiresPerGame(parseUmpiresPerGame(updated.umpiresPerGame));
    setMaxGamesPerUmpirePerDayInput(parseMaxGamesInput(updated.maxGamesPerUmpirePerDay));
    if (updated.leagueSeasonIds && updated.leagueSeasonIds.length > 0) {
      setLeagueSeasonSelection(updated.leagueSeasonIds);
    }
  };

  const handleCancelSeasonDatesEdits = () => {
    setSeasonStartDate(seasonWindowConfig?.startDate ?? '');
    setSeasonEndDate(seasonWindowConfig?.endDate ?? '');
  };

  const handleCancelLeagueEdits = () => {
    setLeagueSeasonSelection(
      seasonWindowConfig?.leagueSeasonIds && seasonWindowConfig.leagueSeasonIds.length > 0
        ? seasonWindowConfig.leagueSeasonIds
        : null,
    );
  };

  const handlePreviewProblemSpec = async () => {
    try {
      setError(null);
      clearError();
      if (!seasonWindowConfig)
        throw new Error('Season dates are required before previewing the problem spec');
      if (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
        throw new Error('Select at least one league to schedule');
      const preview = await getProblemSpecPreview();
      setSpecPreview(preview);
      setSpecPreviewOpen(true);
      setSuccess(`Loaded problem spec preview (${preview.games.length} games)`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load scheduler problem spec preview',
      );
    }
  };

  const handleGenerateMatchups = async () => {
    pollControllerRef.current?.abort();
    const controller = new AbortController();
    pollControllerRef.current = controller;
    setRunning(true);
    setRunProgress(null);
    try {
      setError(null);
      clearError();
      setProposal(null);
      setProposalFromGenerated(false);
      setGeneratedMatchups(null);

      if (!seasonWindowConfig)
        throw new Error('Season dates are required before generating matchups');
      if (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
        throw new Error('Select at least one league to schedule');

      const leagueCounts = selectedLeagueSeasonIds
        .map((id) => {
          const entry = roundRobinCounts.get(id);
          return {
            leagueSeasonId: id,
            inDivisionGameCount: entry?.inDivisionGameCount ?? 0,
            crossDivisionGameCount: entry?.crossDivisionGameCount ?? 0,
          };
        })
        .filter((entry) => entry.inDivisionGameCount > 0 || entry.crossDivisionGameCount > 0);

      if (leagueCounts.length === 0) {
        setError(
          'Enter at least one game count (in-division or cross-division) for a selected league before generating matchups.',
        );
        return;
      }

      const generateRequest: SchedulerGenerateMatchupsRequest = { leagueCounts };
      const { matchups } = await generateMatchups(generateRequest);

      if (matchups.length === 0) {
        setError('No matchups were generated. Check that your leagues have teams and divisions.');
        return;
      }

      const trimmedMaxGames = maxGamesPerUmpirePerDayInput.trim();
      const maxGamesPerUmpirePerDay =
        trimmedMaxGames.length > 0 ? Number(trimmedMaxGames) : undefined;
      if (maxGamesPerUmpirePerDay !== undefined) {
        if (!Number.isFinite(maxGamesPerUmpirePerDay) || maxGamesPerUmpirePerDay <= 0)
          throw new Error('Max games/day for umpires must be a positive number');
      }

      const solveRequest: SchedulerSeasonSolveRequest = {
        matchups,
        objectives: { primary: 'maximize_scheduled_games' },
        umpiresPerGame: scheduleUmpires ? umpiresPerGame : 0,
        constraints: buildSolveConstraints(constraintConfig, maxGamesPerUmpirePerDay),
      };

      const enqueued = await enqueueSeasonRun(solveRequest);
      if (controller.signal.aborted) return;
      setRunProgress(enqueued.progress);

      while (!controller.signal.aborted) {
        const state = await getSeasonRun(enqueued.runId, controller.signal);
        if (controller.signal.aborted) return;
        setRunProgress(state.progress);

        if (state.status === 'completed') {
          if (!state.result) throw new Error('Schedule run completed without a result');
          const result = state.result;
          setProposal(result);
          setProposalFromGenerated(true);
          setGeneratedMatchups(matchups);
          setSelectedGameIds(new Set(result.assignments.map((a) => a.gameId)));
          setSuccess(
            `Generated matchups placed (${result.metrics.scheduledGames}/${result.metrics.totalGames} scheduled)`,
          );
          return;
        }

        if (state.status === 'failed') {
          throw new Error(state.error ?? 'Schedule generation failed');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to generate matchups');
    } finally {
      if (!controller.signal.aborted) {
        setRunning(false);
        setRunProgress(null);
      }
    }
  };

  const handleApply = async () => {
    if (!proposal) return;
    try {
      setError(null);
      clearError();
      const request: SchedulerSeasonApplyRequest = {
        runId: proposal.runId,
        mode: selectedMode,
        gameIds: selectedMode === 'subset' ? selectedIdsArray : undefined,
        assignments: proposal.assignments,
        constraints: {},
        matchups:
          proposalFromGenerated && generatedMatchups && generatedMatchups.length > 0
            ? generatedMatchups
            : undefined,
      };
      const result = await applySeason(request);

      if (result.status === 'failed') {
        setError(
          result.skipped.length > 0
            ? `No games applied — all ${result.skipped.length} assignments were skipped`
            : 'No games were applied',
        );
        return;
      }

      const message =
        result.status === 'applied'
          ? `Applied ${result.appliedGameIds.length} games`
          : `Applied ${result.appliedGameIds.length} games, skipped ${result.skipped.length}`;
      setProposal(null);
      setProposalFromGenerated(false);
      setGeneratedMatchups(null);
      setSelectedGameIds(new Set());
      setSuccess(message);
      await onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply proposal');
    }
  };

  const handleToggleSelection = (gameId: string) => {
    const next = new Set(selectedGameIds);
    if (next.has(gameId)) {
      next.delete(gameId);
    } else {
      next.add(gameId);
    }
    setSelectedGameIds(next);
  };

  const handleToggleAll = () => {
    if (!proposal) return;
    if (selectedGameIds.size === assignments.length) {
      setSelectedGameIds(new Set());
      return;
    }
    setSelectedGameIds(new Set(assignments.map((a) => a.gameId)));
  };

  const handleAssignmentChange = (updated: SchedulerSolveResult['assignments'][number]) => {
    setProposal((prev) =>
      prev
        ? {
            ...prev,
            assignments: prev.assignments.map((assignment) =>
              assignment.gameId === updated.gameId ? updated : assignment,
            ),
          }
        : prev,
    );
  };

  if (!canEdit) {
    return null;
  }

  const filterLabelParts: string[] = [];
  if (leagues.length > 0 && selectedLeagueSeasonIds.length !== leagues.length) {
    filterLabelParts.push(`leagues ${selectedLeagueSeasonIds.length}/${leagues.length}`);
  }
  if (teamSeasonIdFilter) {
    filterLabelParts.push(`team ${teamSeasonIdFilter}`);
  }
  const filterLabel = filterLabelParts.length ? `Filter: ${filterLabelParts.join(', ')}` : null;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variant="text"
          size="small"
          onClick={handlePreviewProblemSpec}
          disabled={
            !seasonId ||
            !seasonWindowConfig ||
            (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
          }
        >
          Inspect Inputs
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerateMatchups}
          disabled={
            running ||
            !seasonId ||
            !seasonWindowConfig ||
            (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
          }
        >
          {running ? 'Generating…' : 'Generate Schedule'}
        </Button>
      </Box>

      {running && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Generating schedule…
            </Typography>
            {runProgress && runProgress.total > 0 && (
              <Typography variant="caption" color="text.secondary">
                {runProgress.processed}/{runProgress.total} games
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant={runProgress && runProgress.total > 0 ? 'determinate' : 'indeterminate'}
            value={
              runProgress && runProgress.total > 0
                ? Math.min(100, Math.round((runProgress.processed / runProgress.total) * 100))
                : undefined
            }
          />
        </Box>
      )}

      {filterLabel && (
        <Typography variant="caption" color="text.secondary">
          {filterLabel}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <SeasonSchedulerConfigPanel
        accountId={accountId}
        seasonId={seasonId}
        timeZone={timeZone}
        seasonWindowConfig={seasonWindowConfig}
        seasonStartDate={seasonStartDate}
        seasonEndDate={seasonEndDate}
        seasonExclusions={constraints.seasonExclusions}
        teams={teams}
        teamNameById={teamNameById}
        teamExclusions={constraints.teamExclusions}
        leagueExclusions={constraints.leagueExclusions}
        leagues={leagues}
        selectedLeagueSeasonIds={selectedLeagueSeasonIds}
        leagueSeasonIdFilter={leagueSeasonIdFilter}
        leagueSeasonSelection={leagueSeasonSelection}
        leagueNameById={leagueNameById}
        roundRobinCounts={roundRobinCounts}
        dirty={seasonDatesDirty}
        leaguesDirty={leagueSelectionDirty}
        saving={loading}
        onSeasonStartDateChange={setSeasonStartDate}
        onSeasonEndDateChange={setSeasonEndDate}
        onLeagueSelectionChange={setLeagueSeasonSelection}
        onRoundRobinCountsChange={setRoundRobinCounts}
        onCancel={handleCancelSeasonDatesEdits}
        onLeaguesCancel={handleCancelLeagueEdits}
        onSave={() => {
          handleSaveSeasonWindow()
            .then(() => setSuccess('Scheduler settings saved'))
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Failed to save season window'),
            );
        }}
        onCreateSeasonExclusion={constraints.handleCreateSeasonExclusion}
        onEditSeasonExclusion={constraints.handleEditSeasonExclusion}
        onDeleteSeasonExclusion={constraints.handleDeleteSeasonExclusion}
        onCreateTeamExclusion={constraints.handleCreateTeamExclusion}
        onEditTeamExclusion={constraints.handleEditTeamExclusion}
        onDeleteTeamExclusion={constraints.handleDeleteTeamExclusion}
        onCreateLeagueExclusion={constraints.handleCreateLeagueExclusion}
        onEditLeagueExclusion={constraints.handleEditLeagueExclusion}
        onDeleteLeagueExclusion={constraints.handleDeleteLeagueExclusion}
      />

      <Divider sx={{ my: 2 }} />

      <SchedulerFieldsConfig
        accountId={accountId}
        fields={fields}
        setSuccess={setSuccess}
        setError={setError}
      />

      <SchedulerUmpiresConfig
        seasonId={seasonId}
        timeZone={timeZone}
        scheduleUmpires={scheduleUmpires}
        umpiresPerGame={umpiresPerGame}
        maxGamesPerUmpirePerDayInput={maxGamesPerUmpirePerDayInput}
        umpires={umpires}
        umpireNameById={umpireNameById}
        umpireExclusions={constraints.umpireExclusions}
        loading={loading}
        onScheduleUmpiresChange={handleScheduleUmpiresChange}
        onUmpiresPerGameChange={setUmpiresPerGame}
        onMaxGamesPerUmpirePerDayChange={setMaxGamesPerUmpirePerDayInput}
        onCreateUmpireExclusion={constraints.handleCreateUmpireExclusion}
        onEditUmpireExclusion={constraints.handleEditUmpireExclusion}
        onDeleteUmpireExclusion={constraints.handleDeleteUmpireExclusion}
      />

      <SchedulerConstraintsConfig
        seasonId={seasonId}
        config={constraintConfig}
        onChange={handleConstraintConfigChange}
      />

      <SeasonSchedulerProposalReview
        proposal={proposal}
        specPreview={specPreview}
        specPreviewOpen={specPreviewOpen}
        loading={loading}
        timeZone={timeZone}
        selectedGameIds={selectedGameIds}
        fields={fields}
        umpires={umpires}
        maxUmpires={scheduleUmpires ? umpiresPerGame : 0}
        fieldNameById={fieldNameById}
        teamNameById={teamNameById}
        umpireNameById={umpireNameById}
        leagueNameById={leagueNameById}
        generatedMatchups={generatedMatchups}
        getGameSummaryLabel={getGameSummaryLabel}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
        onApply={handleApply}
        onAssignmentChange={handleAssignmentChange}
        onCloseSpecPreview={() => setSpecPreviewOpen(false)}
      />
    </>
  );
};
