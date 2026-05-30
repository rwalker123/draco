'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Divider, Typography } from '@mui/material';
import WidgetShell from '../ui/WidgetShell';
import type {
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
import { SeasonSchedulerConstraintLists } from './SeasonSchedulerConstraintLists';
import { SeasonSchedulerProposalReview } from './SeasonSchedulerProposalReview';
import { loadRoundRobinCounts, type LeagueRoundRobinCount } from './SchedulerRoundRobinConfig';

type FieldOption = { id: string; name: string };
type EntityOption = { id: string; name: string };
type UmpiresPerGame = 1 | 2 | 3 | 4;

const parseUmpiresPerGame = (value: number | null | undefined): UmpiresPerGame =>
  value === 1 || value === 2 || value === 3 || value === 4 ? value : 2;

const parseMaxGamesInput = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

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
    solveSeason,
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
  const [proposal, setProposal] = useState<SchedulerSolveResult | null>(null);
  const [proposalFromGenerated, setProposalFromGenerated] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [specPreview, setSpecPreview] = useState<SchedulerProblemSpecPreview | null>(null);
  const [specPreviewOpen, setSpecPreviewOpen] = useState(false);
  const [umpiresPerGame, setUmpiresPerGame] = useState<UmpiresPerGame>(2);
  const [maxGamesPerUmpirePerDayInput, setMaxGamesPerUmpirePerDayInput] = useState('');
  const [roundRobinCounts, setRoundRobinCounts] = useState<Map<string, LeagueRoundRobinCount>>(
    () => (seasonId ? loadRoundRobinCounts(accountId, seasonId) : new Map()),
  );

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

  const filterProblemSpecGames = (preview: SchedulerProblemSpecPreview): string[] => {
    let filtered = preview.games;
    if (leagues.length > 0 && selectedLeagueSeasonIds.length !== leagues.length) {
      const leagueSet = new Set(selectedLeagueSeasonIds);
      filtered = filtered.filter((game) => leagueSet.has(game.leagueSeasonId));
    }
    if (teamSeasonIdFilter) {
      filtered = filtered.filter(
        (game) =>
          game.homeTeamSeasonId === teamSeasonIdFilter ||
          game.visitorTeamSeasonId === teamSeasonIdFilter,
      );
    }
    return filtered.map((game) => game.id);
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

  const handleSolve = async () => {
    try {
      setError(null);
      clearError();
      setProposal(null);
      setProposalFromGenerated(false);
      if (!seasonWindowConfig)
        throw new Error('Season dates are required before generating a proposal');
      if (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
        throw new Error('Select at least one league to schedule');

      let gameIds: SchedulerSeasonSolveRequest['gameIds'];
      const shouldFilterByLeagueSelection =
        leagues.length > 0 &&
        selectedLeagueSeasonIds.length > 0 &&
        selectedLeagueSeasonIds.length !== leagues.length;

      const preview = await getProblemSpecPreview();
      setSpecPreview(preview);

      if (teamSeasonIdFilter || shouldFilterByLeagueSelection) {
        const filteredIds = filterProblemSpecGames(preview);
        if (filteredIds.length === 0) throw new Error('No games match the current schedule filter');
        gameIds = filteredIds;
      }

      const trimmedMaxGames = maxGamesPerUmpirePerDayInput.trim();
      const maxGamesPerUmpirePerDay =
        trimmedMaxGames.length > 0 ? Number(trimmedMaxGames) : undefined;
      if (maxGamesPerUmpirePerDay !== undefined) {
        if (!Number.isFinite(maxGamesPerUmpirePerDay) || maxGamesPerUmpirePerDay <= 0)
          throw new Error('Max games/day for umpires must be a positive number');
      }

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
        gameIds,
        umpiresPerGame,
        constraints:
          maxGamesPerUmpirePerDay !== undefined
            ? { hard: { maxGamesPerUmpirePerDay: Math.floor(maxGamesPerUmpirePerDay) } }
            : undefined,
      };

      const result = await solveSeason(request);
      setProposal(result);
      setSelectedGameIds(new Set(result.assignments.map((a) => a.gameId)));
      setSuccess(
        `Proposal generated (${result.metrics.scheduledGames}/${result.metrics.totalGames} scheduled)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
    }
  };

  const handleGenerateMatchups = async () => {
    try {
      setError(null);
      clearError();
      setProposal(null);
      setProposalFromGenerated(false);

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
        umpiresPerGame,
        constraints:
          maxGamesPerUmpirePerDay !== undefined
            ? { hard: { maxGamesPerUmpirePerDay: Math.floor(maxGamesPerUmpirePerDay) } }
            : undefined,
      };

      const result = await solveSeason(solveRequest);
      setProposal(result);
      setProposalFromGenerated(true);
      setSelectedGameIds(new Set(result.assignments.map((a) => a.gameId)));
      setSuccess(
        `Generated matchups placed (${result.metrics.scheduledGames}/${result.metrics.totalGames} scheduled)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate matchups');
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
      };
      const result = await applySeason(request);
      const message =
        result.status === 'applied'
          ? `Applied ${result.appliedGameIds.length} games`
          : `Applied ${result.appliedGameIds.length} games, skipped ${result.skipped.length}`;
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
    <WidgetShell accent="primary" sx={{ mb: 3, px: 3, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h6">Scheduler</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a proposal and then apply all or selected games (no optimistic updates).
          </Typography>
          {filterLabel && (
            <Typography variant="caption" color="text.secondary">
              {filterLabel}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handlePreviewProblemSpec}
            disabled={
              !seasonId ||
              !seasonWindowConfig ||
              (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
            }
          >
            Preview Problem Spec
          </Button>
          <Button
            variant="outlined"
            onClick={handleGenerateMatchups}
            disabled={
              !seasonId ||
              !seasonWindowConfig ||
              (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
            }
          >
            Generate Matchups
          </Button>
          <Button
            variant="contained"
            onClick={handleSolve}
            disabled={
              !seasonId ||
              !seasonWindowConfig ||
              (leagues.length > 0 && selectedLeagueSeasonIds.length === 0)
            }
          >
            Generate Proposal
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <SeasonSchedulerConfigPanel
        accountId={accountId}
        seasonId={seasonId}
        seasonWindowConfig={seasonWindowConfig}
        seasonStartDate={seasonStartDate}
        seasonEndDate={seasonEndDate}
        umpiresPerGame={umpiresPerGame}
        maxGamesPerUmpirePerDayInput={maxGamesPerUmpirePerDayInput}
        leagues={leagues}
        umpires={umpires}
        selectedLeagueSeasonIds={selectedLeagueSeasonIds}
        leagueSeasonIdFilter={leagueSeasonIdFilter}
        leagueSeasonSelection={leagueSeasonSelection}
        leagueNameById={leagueNameById}
        roundRobinCounts={roundRobinCounts}
        onSeasonStartDateChange={setSeasonStartDate}
        onSeasonEndDateChange={setSeasonEndDate}
        onUmpiresPerGameChange={setUmpiresPerGame}
        onMaxGamesPerUmpirePerDayChange={setMaxGamesPerUmpirePerDayInput}
        onLeagueSelectionChange={setLeagueSeasonSelection}
        onRoundRobinCountsChange={setRoundRobinCounts}
        onSave={() => {
          handleSaveSeasonWindow()
            .then(() => setSuccess('Scheduler settings saved'))
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Failed to save season window'),
            );
        }}
      />

      <Divider sx={{ my: 2 }} />

      <SeasonSchedulerConstraintLists
        seasonId={seasonId}
        timeZone={timeZone}
        fields={fields}
        teams={teams}
        umpires={umpires}
        rules={constraints.rules}
        exclusions={constraints.exclusions}
        seasonExclusions={constraints.seasonExclusions}
        teamExclusions={constraints.teamExclusions}
        umpireExclusions={constraints.umpireExclusions}
        fieldNameById={fieldNameById}
        teamNameById={teamNameById}
        umpireNameById={umpireNameById}
        loading={loading}
        onCreateRule={constraints.handleCreateRule}
        onEditRule={constraints.handleEditRule}
        onDeleteRule={constraints.handleDeleteRule}
        onCreateExclusion={constraints.handleCreateExclusion}
        onEditExclusion={constraints.handleEditExclusion}
        onDeleteExclusion={constraints.handleDeleteExclusion}
        onCreateSeasonExclusion={constraints.handleCreateSeasonExclusion}
        onEditSeasonExclusion={constraints.handleEditSeasonExclusion}
        onDeleteSeasonExclusion={constraints.handleDeleteSeasonExclusion}
        onCreateTeamExclusion={constraints.handleCreateTeamExclusion}
        onEditTeamExclusion={constraints.handleEditTeamExclusion}
        onDeleteTeamExclusion={constraints.handleDeleteTeamExclusion}
        onCreateUmpireExclusion={constraints.handleCreateUmpireExclusion}
        onEditUmpireExclusion={constraints.handleEditUmpireExclusion}
        onDeleteUmpireExclusion={constraints.handleDeleteUmpireExclusion}
      />

      <Divider sx={{ my: 2 }} />

      <SeasonSchedulerProposalReview
        proposal={proposal}
        specPreview={specPreview}
        specPreviewOpen={specPreviewOpen}
        loading={loading}
        timeZone={timeZone}
        selectedGameIds={selectedGameIds}
        fieldNameById={fieldNameById}
        teamNameById={teamNameById}
        umpireNameById={umpireNameById}
        leagueNameById={leagueNameById}
        proposalFromGenerated={proposalFromGenerated}
        getGameSummaryLabel={getGameSummaryLabel}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
        onApply={handleApply}
        onCloseSpecPreview={() => setSpecPreviewOpen(false)}
      />
    </WidgetShell>
  );
};
