'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import WidgetShell from '../ui/WidgetShell';
import type {
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerProblemSpecPreview,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
} from '@draco/shared-schemas';
import { SchedulerFieldAvailabilityRuleDialog } from './SchedulerFieldAvailabilityRuleDialog';
import { SchedulerFieldExclusionDateDialog } from './SchedulerFieldExclusionDateDialog';
import { useSeasonSchedulerOperations } from '../../hooks/useSeasonSchedulerOperations';

type FieldOption = { id: string; name: string };

const DAYS: Array<{ label: string; bit: number }> = [
  { label: 'Mon', bit: 0 },
  { label: 'Tue', bit: 1 },
  { label: 'Wed', bit: 2 },
  { label: 'Thu', bit: 3 },
  { label: 'Fri', bit: 4 },
  { label: 'Sat', bit: 5 },
  { label: 'Sun', bit: 6 },
];

const formatDaysOfWeekMask = (mask: number): string => {
  const selected = DAYS.filter((day) => (mask & (1 << day.bit)) !== 0).map((day) => day.label);
  return selected.length ? selected.join(', ') : 'None';
};

const formatLocalHhmmTo12Hour = (value: string): string => {
  const trimmed = value.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return value;
  }

  const hours24 = Number(match[1]);
  const minutes = match[2] ?? '00';
  if (Number.isNaN(hours24)) {
    return value;
  }

  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${suffix}`;
};

interface SeasonSchedulerWidgetProps {
  accountId: string;
  seasonId: string | null;
  canEdit: boolean;
  timeZone: string;
  leagueSeasonIdFilter?: string;
  teamSeasonIdFilter?: string;
  fields: FieldOption[];
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
  getGameSummaryLabel,
  onApplied,
  setSuccess,
  setError,
}) => {
  const {
    listFieldAvailabilityRules,
    createFieldAvailabilityRule,
    updateFieldAvailabilityRule,
    deleteFieldAvailabilityRule,
    listFieldExclusionDates,
    createFieldExclusionDate,
    updateFieldExclusionDate,
    deleteFieldExclusionDate,
    getProblemSpecPreview,
    solveSeason,
    applySeason,
    loading,
    error,
    clearError,
  } = useSeasonSchedulerOperations(accountId, seasonId);

  const [rules, setRules] = useState<SchedulerFieldAvailabilityRule[]>([]);
  const [exclusions, setExclusions] = useState<SchedulerFieldExclusionDate[]>([]);
  const [proposal, setProposal] = useState<SchedulerSolveResult | null>(null);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [specPreview, setSpecPreview] = useState<SchedulerProblemSpecPreview | null>(null);
  const [specPreviewOpen, setSpecPreviewOpen] = useState(false);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleDialogKey, setRuleDialogKey] = useState('rule_new');
  const [ruleDialogMode, setRuleDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRule, setEditingRule] = useState<SchedulerFieldAvailabilityRule | undefined>(
    undefined,
  );

  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
  const [exclusionDialogKey, setExclusionDialogKey] = useState('exclusion_new');
  const [exclusionDialogMode, setExclusionDialogMode] = useState<'create' | 'edit'>('create');
  const [editingExclusion, setEditingExclusion] = useState<SchedulerFieldExclusionDate | undefined>(
    undefined,
  );

  const assignments = proposal?.assignments ?? [];

  const fieldNameById = useMemo(() => {
    const map = new Map<string, string>();
    fields.forEach((field) => map.set(field.id, field.name));
    return map;
  }, [fields]);

  const formatLocalTimeRange = useCallback(
    (startIso: string, endIso: string): string => {
      const start = new Date(startIso);
      const end = new Date(endIso);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return `${startIso}–${endIso}`;
      }

      try {
        const dateLabel = new Intl.DateTimeFormat('en-US', {
          timeZone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(start);

        const startTime = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(start);

        const endTime = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(end);

        return `${dateLabel} ${startTime}–${endTime}`;
      } catch {
        return `${start.toISOString()}–${end.toISOString()}`;
      }
    },
    [timeZone],
  );

  const selectedMode: SchedulerSeasonApplyRequest['mode'] = useMemo(() => {
    if (!proposal) {
      return 'all';
    }
    if (selectedGameIds.size === assignments.length) {
      return 'all';
    }
    return 'subset';
  }, [assignments.length, proposal, selectedGameIds.size]);

  const selectedIdsArray = useMemo(
    () => Array.from(selectedGameIds.values()).sort(),
    [selectedGameIds],
  );

  const loadRules = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const nextRules = await listFieldAvailabilityRules();
    setRules(nextRules);
  }, [listFieldAvailabilityRules, seasonId]);

  const loadExclusions = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const nextExclusions = await listFieldExclusionDates();
    setExclusions(nextExclusions);
  }, [listFieldExclusionDates, seasonId]);

  useEffect(() => {
    if (!canEdit || !seasonId) {
      return;
    }
    loadRules().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load rules'),
    );
    loadExclusions().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load exclusions'),
    );
  }, [canEdit, loadExclusions, loadRules, seasonId, setError]);

  const handleOpenCreateRule = () => {
    setEditingRule(undefined);
    setRuleDialogMode('create');
    setRuleDialogKey(`new_${Date.now()}`);
    setRuleDialogOpen(true);
  };

  const handleOpenEditRule = (rule: SchedulerFieldAvailabilityRule) => {
    setEditingRule(rule);
    setRuleDialogMode('edit');
    setRuleDialogKey(`edit_${rule.id}`);
    setRuleDialogOpen(true);
  };

  const handleOpenCreateExclusion = () => {
    setEditingExclusion(undefined);
    setExclusionDialogMode('create');
    setExclusionDialogKey(`new_${Date.now()}`);
    setExclusionDialogOpen(true);
  };

  const handleOpenEditExclusion = (exclusion: SchedulerFieldExclusionDate) => {
    setEditingExclusion(exclusion);
    setExclusionDialogMode('edit');
    setExclusionDialogKey(`edit_${exclusion.id}`);
    setExclusionDialogOpen(true);
  };

  const handleDeleteRule = async (rule: SchedulerFieldAvailabilityRule) => {
    try {
      await deleteFieldAvailabilityRule(rule.id);
      await loadRules();
      setSuccess('Rule deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleSaveRule = async (input: SchedulerFieldAvailabilityRuleUpsert) => {
    try {
      if (!seasonId) {
        throw new Error('Missing current season');
      }

      if (ruleDialogMode === 'create') {
        await createFieldAvailabilityRule(input);
        setSuccess('Rule created');
      } else if (editingRule) {
        await updateFieldAvailabilityRule(editingRule.id, input);
        setSuccess('Rule updated');
      }

      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
      throw err;
    }
  };

  const handleDeleteExclusion = async (exclusion: SchedulerFieldExclusionDate) => {
    try {
      await deleteFieldExclusionDate(exclusion.id);
      await loadExclusions();
      setSuccess('Exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exclusion');
    }
  };

  const handleSaveExclusion = async (input: SchedulerFieldExclusionDateUpsert) => {
    try {
      if (!seasonId) {
        throw new Error('Missing current season');
      }

      if (exclusionDialogMode === 'create') {
        await createFieldExclusionDate(input);
        setSuccess('Exclusion created');
      } else if (editingExclusion) {
        await updateFieldExclusionDate(editingExclusion.id, input);
        setSuccess('Exclusion updated');
      }

      await loadExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exclusion');
      throw err;
    }
  };

  const filterProblemSpecGames = useCallback(
    (preview: SchedulerProblemSpecPreview): string[] => {
      let filtered = preview.games;
      if (leagueSeasonIdFilter) {
        filtered = filtered.filter((game) => game.leagueSeasonId === leagueSeasonIdFilter);
      }
      if (teamSeasonIdFilter) {
        filtered = filtered.filter(
          (game) =>
            game.homeTeamSeasonId === teamSeasonIdFilter ||
            game.visitorTeamSeasonId === teamSeasonIdFilter,
        );
      }
      return filtered.map((game) => game.id);
    },
    [leagueSeasonIdFilter, teamSeasonIdFilter],
  );

  const handlePreviewProblemSpec = async () => {
    try {
      setError(null);
      clearError();

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

      let gameIds: SchedulerSeasonSolveRequest['gameIds'];
      if (leagueSeasonIdFilter || teamSeasonIdFilter) {
        const preview = await getProblemSpecPreview();
        setSpecPreview(preview);
        const filteredIds = filterProblemSpecGames(preview);
        if (filteredIds.length === 0) {
          throw new Error('No games match the current schedule filter');
        }
        gameIds = filteredIds;
      }

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
        gameIds,
      };

      const result = await solveSeason(request);
      setProposal(result);
      setSelectedGameIds(new Set(result.assignments.map((assignment) => assignment.gameId)));
      setSuccess(
        `Proposal generated (${result.metrics.scheduledGames}/${result.metrics.totalGames} scheduled)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
    }
  };

  const handleApply = async () => {
    if (!proposal) {
      return;
    }

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
    if (!proposal) {
      return;
    }
    if (selectedGameIds.size === assignments.length) {
      setSelectedGameIds(new Set());
      return;
    }
    setSelectedGameIds(new Set(assignments.map((assignment) => assignment.gameId)));
  };

  if (!canEdit) {
    return null;
  }

  const filterLabel =
    leagueSeasonIdFilter || teamSeasonIdFilter
      ? `Filter: ${leagueSeasonIdFilter ? `league ${leagueSeasonIdFilter}` : 'all leagues'}${
          teamSeasonIdFilter ? `, team ${teamSeasonIdFilter}` : ''
        }`
      : null;

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
            onClick={handleOpenCreateRule}
            disabled={!seasonId || fields.length === 0}
          >
            Add Availability Rule
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenCreateExclusion}
            disabled={!seasonId || fields.length === 0}
          >
            Add Exclusion Date
          </Button>
          <Button variant="outlined" onClick={handlePreviewProblemSpec} disabled={!seasonId}>
            Preview Problem Spec
          </Button>
          <Button variant="contained" onClick={handleSolve} disabled={!seasonId}>
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Availability Rules</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {rules.length} rule(s) configured.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading season…
            </Typography>
          )}
        </Box>

        {rules.length > 0 && (
          <Stack spacing={1}>
            {rules.map((rule) => (
              <Box
                key={rule.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {fieldNameById.get(rule.fieldId) ?? `Field ${rule.fieldId}`}:{' '}
                    {rule.startDate || rule.endDate
                      ? `${rule.startDate ?? '…'}–${rule.endDate ?? '…'}`
                      : 'All dates'}{' '}
                    {formatLocalHhmmTo12Hour(rule.startTimeLocal)}–
                    {formatLocalHhmmTo12Hour(rule.endTimeLocal)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Days={formatDaysOfWeekMask(rule.daysOfWeekMask)}, increment=
                    {rule.startIncrementMinutes}m, {rule.enabled ? 'enabled' : 'disabled'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" onClick={() => handleOpenEditRule(rule)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteRule(rule).catch(() => undefined)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Field Exclusion Dates</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {exclusions.length} exclusion date(s) configured.
            </Typography>
          ) : null}
        </Box>

        {exclusions.length > 0 && (
          <Stack spacing={1}>
            {exclusions.map((exclusion) => (
              <Box
                key={exclusion.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {fieldNameById.get(exclusion.fieldId) ?? `Field ${exclusion.fieldId}`}:{' '}
                    {exclusion.date} {exclusion.enabled ? '' : '(disabled)'}
                  </Typography>
                  {exclusion.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {exclusion.note}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenEditExclusion(exclusion)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteExclusion(exclusion).catch(() => undefined)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle2">Proposal</Typography>
        {!proposal && (
          <Typography variant="body2" color="text.secondary">
            Generate a proposal to see suggested assignments.
          </Typography>
        )}

        {proposal && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Status: {proposal.status}. Scheduled {proposal.metrics.scheduledGames}/
              {proposal.metrics.totalGames}.
            </Typography>

            {proposal.assignments.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No assignments produced.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedGameIds.size === proposal.assignments.length}
                        indeterminate={
                          selectedGameIds.size > 0 &&
                          selectedGameIds.size < proposal.assignments.length
                        }
                        onChange={handleToggleAll}
                      />
                    }
                    label={`Select (${selectedGameIds.size}/${proposal.assignments.length})`}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApply}
                    disabled={selectedGameIds.size === 0}
                  >
                    Apply {selectedMode === 'all' ? 'All' : 'Selected'}
                  </Button>
                </Box>

                <Stack spacing={1}>
                  {proposal.assignments.map((assignment) => (
                    <Box
                      key={assignment.gameId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Checkbox
                        checked={selectedGameIds.has(assignment.gameId)}
                        onChange={() => handleToggleSelection(assignment.gameId)}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {getGameSummaryLabel(assignment.gameId)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`} •{' '}
                          {formatLocalTimeRange(assignment.startTime, assignment.endTime)} •{' '}
                          {assignment.umpireIds.length} umpire(s)
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {proposal.unscheduled.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Unscheduled</Typography>
                <Typography variant="body2" color="text.secondary">
                  {proposal.unscheduled.length} game(s) could not be scheduled.
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {proposal.unscheduled.map((item) => (
                    <Box
                      key={item.gameId}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {getGameSummaryLabel(item.gameId)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.reason}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {loading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2">Working…</Typography>
        </Box>
      )}

      {seasonId && (
        <SchedulerFieldAvailabilityRuleDialog
          key={ruleDialogKey}
          open={ruleDialogOpen}
          mode={ruleDialogMode}
          seasonId={seasonId}
          fields={fields}
          initialRule={editingRule}
          onClose={() => setRuleDialogOpen(false)}
          onSubmit={handleSaveRule}
          loading={loading}
        />
      )}

      {seasonId && (
        <SchedulerFieldExclusionDateDialog
          key={exclusionDialogKey}
          open={exclusionDialogOpen}
          mode={exclusionDialogMode}
          seasonId={seasonId}
          fields={fields}
          initialExclusion={editingExclusion}
          onClose={() => setExclusionDialogOpen(false)}
          onSubmit={handleSaveExclusion}
          loading={loading}
        />
      )}

      <Dialog
        open={specPreviewOpen}
        onClose={() => setSpecPreviewOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Scheduler Problem Spec Preview</DialogTitle>
        <DialogContent dividers>
          {specPreview ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Loaded {specPreview.games.length} game(s).
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflowX: 'auto',
                  fontSize: 12,
                  lineHeight: 1.4,
                  maxHeight: 520,
                }}
              >
                {JSON.stringify(specPreview, null, 2)}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview loaded.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpecPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </WidgetShell>
  );
};
