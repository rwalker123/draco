'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import WidgetShell from '../ui/WidgetShell';
import type {
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerProblemSpecPreview,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerFieldAvailabilityRuleDialog } from './SchedulerFieldAvailabilityRuleDialog';
import { SchedulerFieldExclusionDateDialog } from './SchedulerFieldExclusionDateDialog';
import { SchedulerSeasonExclusionDialog } from './SchedulerSeasonExclusionDialog';
import { SchedulerTeamExclusionDialog } from './SchedulerTeamExclusionDialog';
import { SchedulerUmpireExclusionDialog } from './SchedulerUmpireExclusionDialog';
import { useSeasonSchedulerOperations } from '../../hooks/useSeasonSchedulerOperations';

type FieldOption = { id: string; name: string };
type EntityOption = { id: string; name: string };
type UmpiresPerGame = 1 | 2 | 3 | 4;

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

const formatIsoDateKey = (isoString: string, timeZone: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const formatLocalDateHeader = (isoString: string, timeZone: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
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
  const {
    getSeasonWindowConfig,
    upsertSeasonWindowConfig,
    listSeasonExclusions,
    createSeasonExclusion,
    updateSeasonExclusion,
    deleteSeasonExclusion,
    listTeamExclusions,
    createTeamExclusion,
    updateTeamExclusion,
    deleteTeamExclusion,
    listUmpireExclusions,
    createUmpireExclusion,
    updateUmpireExclusion,
    deleteUmpireExclusion,
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
  const [seasonWindowConfig, setSeasonWindowConfig] = useState<SchedulerSeasonWindowConfig | null>(
    null,
  );
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');
  const [leagueSeasonSelection, setLeagueSeasonSelection] = useState<string[] | null>(null);
  const [seasonExclusions, setSeasonExclusions] = useState<SchedulerSeasonExclusion[]>([]);
  const [teamExclusions, setTeamExclusions] = useState<SchedulerTeamExclusion[]>([]);
  const [umpireExclusions, setUmpireExclusions] = useState<SchedulerUmpireExclusion[]>([]);
  const [proposal, setProposal] = useState<SchedulerSolveResult | null>(null);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [specPreview, setSpecPreview] = useState<SchedulerProblemSpecPreview | null>(null);
  const [specPreviewOpen, setSpecPreviewOpen] = useState(false);
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());
  const [umpiresPerGame, setUmpiresPerGame] = useState<UmpiresPerGame>(2);
  const [maxGamesPerUmpirePerDayInput, setMaxGamesPerUmpirePerDayInput] = useState('');

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

  const [seasonExclusionDialogOpen, setSeasonExclusionDialogOpen] = useState(false);
  const [seasonExclusionDialogKey, setSeasonExclusionDialogKey] = useState('season_exclusion_new');
  const [seasonExclusionDialogMode, setSeasonExclusionDialogMode] = useState<'create' | 'edit'>(
    'create',
  );
  const [editingSeasonExclusion, setEditingSeasonExclusion] = useState<
    SchedulerSeasonExclusion | undefined
  >(undefined);

  const [teamExclusionDialogOpen, setTeamExclusionDialogOpen] = useState(false);
  const [teamExclusionDialogKey, setTeamExclusionDialogKey] = useState('team_exclusion_new');
  const [teamExclusionDialogMode, setTeamExclusionDialogMode] = useState<'create' | 'edit'>(
    'create',
  );
  const [editingTeamExclusion, setEditingTeamExclusion] = useState<
    SchedulerTeamExclusion | undefined
  >(undefined);

  const [umpireExclusionDialogOpen, setUmpireExclusionDialogOpen] = useState(false);
  const [umpireExclusionDialogKey, setUmpireExclusionDialogKey] = useState('umpire_exclusion_new');
  const [umpireExclusionDialogMode, setUmpireExclusionDialogMode] = useState<'create' | 'edit'>(
    'create',
  );
  const [editingUmpireExclusion, setEditingUmpireExclusion] = useState<
    SchedulerUmpireExclusion | undefined
  >(undefined);

  const assignments = proposal?.assignments ?? [];

  const fieldNameById = useMemo(() => {
    const map = new Map<string, string>();
    fields.forEach((field) => map.set(field.id, field.name));
    return map;
  }, [fields]);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [teams]);

  const umpireNameById = useMemo(() => {
    const map = new Map<string, string>();
    umpires.forEach((umpire) => map.set(umpire.id, umpire.name));
    return map;
  }, [umpires]);

  const schedulerUmpireNameById = useMemo(() => {
    const map = new Map<string, string>();
    (specPreview?.umpires ?? []).forEach((umpire) => {
      if (umpire.name) {
        map.set(umpire.id, umpire.name);
      }
    });
    return map;
  }, [specPreview]);

  const leagueNameById = useMemo(() => {
    const map = new Map<string, string>();
    leagues.forEach((league) => map.set(league.id, league.name));
    return map;
  }, [leagues]);

  const allLeagueSeasonIds = useMemo(() => leagues.map((league) => league.id), [leagues]);

  const selectedLeagueSeasonIds = useMemo(() => {
    const leagueIdSet = new Set(allLeagueSeasonIds);
    const normalizedManual = leagueSeasonSelection?.filter((id) => leagueIdSet.has(id)) ?? null;

    if (normalizedManual && normalizedManual.length > 0) {
      return normalizedManual;
    }

    if (leagueSeasonIdFilter) {
      return [leagueSeasonIdFilter];
    }

    return allLeagueSeasonIds;
  }, [allLeagueSeasonIds, leagueSeasonIdFilter, leagueSeasonSelection]);

  const gameRequestById = useMemo(() => {
    const map = new Map<string, SchedulerProblemSpecPreview['games'][number]>();
    if (!specPreview) {
      return map;
    }
    specPreview.games.forEach((game) => {
      map.set(game.id, game);
    });
    return map;
  }, [specPreview]);

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

        const tzLabel = new Intl.DateTimeFormat('en-US', {
          timeZone,
          timeZoneName: 'short',
        })
          .formatToParts(start)
          .find((part) => part.type === 'timeZoneName')?.value;

        return `${dateLabel} • ${startTime} – ${endTime}${tzLabel ? ` (${tzLabel})` : ''}`;
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

  const loadSeasonWindow = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const config = await getSeasonWindowConfig();
    setSeasonWindowConfig(config);
    if (config) {
      setSeasonStartDate(config.startDate);
      setSeasonEndDate(config.endDate);
      if (
        config.umpiresPerGame &&
        (config.umpiresPerGame === 1 ||
          config.umpiresPerGame === 2 ||
          config.umpiresPerGame === 3 ||
          config.umpiresPerGame === 4)
      ) {
        setUmpiresPerGame(config.umpiresPerGame);
      } else {
        setUmpiresPerGame(2);
      }

      const maxGames = config.maxGamesPerUmpirePerDay;
      setMaxGamesPerUmpirePerDayInput(
        typeof maxGames === 'number' && Number.isFinite(maxGames) ? String(maxGames) : '',
      );

      if (config.leagueSeasonIds && config.leagueSeasonIds.length > 0) {
        setLeagueSeasonSelection(config.leagueSeasonIds);
      }
    }
  }, [getSeasonWindowConfig, seasonId]);

  const loadSeasonExclusions = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const next = await listSeasonExclusions();
    setSeasonExclusions(next);
  }, [listSeasonExclusions, seasonId]);

  const loadTeamExclusions = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const next = await listTeamExclusions();
    setTeamExclusions(next);
  }, [listTeamExclusions, seasonId]);

  const loadUmpireExclusions = useCallback(async () => {
    if (!seasonId) {
      return;
    }
    const next = await listUmpireExclusions();
    setUmpireExclusions(next);
  }, [listUmpireExclusions, seasonId]);

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
    loadSeasonWindow().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load season window'),
    );
    loadSeasonExclusions().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load season exclusions'),
    );
    loadTeamExclusions().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load team exclusions'),
    );
    loadUmpireExclusions().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load umpire exclusions'),
    );
  }, [
    canEdit,
    loadExclusions,
    loadRules,
    loadSeasonExclusions,
    loadSeasonWindow,
    loadTeamExclusions,
    loadUmpireExclusions,
    seasonId,
    setError,
  ]);

  const handleSaveSeasonWindow = async () => {
    if (!seasonId) {
      return;
    }

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
    if (
      updated.umpiresPerGame &&
      (updated.umpiresPerGame === 1 ||
        updated.umpiresPerGame === 2 ||
        updated.umpiresPerGame === 3 ||
        updated.umpiresPerGame === 4)
    ) {
      setUmpiresPerGame(updated.umpiresPerGame);
    }
    const nextMaxGames = updated.maxGamesPerUmpirePerDay;
    setMaxGamesPerUmpirePerDayInput(
      typeof nextMaxGames === 'number' && Number.isFinite(nextMaxGames) ? String(nextMaxGames) : '',
    );
    if (updated.leagueSeasonIds && updated.leagueSeasonIds.length > 0) {
      setLeagueSeasonSelection(updated.leagueSeasonIds);
    }
  };

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

  const handleOpenCreateSeasonExclusion = () => {
    setEditingSeasonExclusion(undefined);
    setSeasonExclusionDialogMode('create');
    setSeasonExclusionDialogKey(`new_${Date.now()}`);
    setSeasonExclusionDialogOpen(true);
  };

  const handleOpenEditSeasonExclusion = (exclusion: SchedulerSeasonExclusion) => {
    setEditingSeasonExclusion(exclusion);
    setSeasonExclusionDialogMode('edit');
    setSeasonExclusionDialogKey(`edit_${exclusion.id}`);
    setSeasonExclusionDialogOpen(true);
  };

  const handleOpenCreateTeamExclusion = () => {
    setEditingTeamExclusion(undefined);
    setTeamExclusionDialogMode('create');
    setTeamExclusionDialogKey(`new_${Date.now()}`);
    setTeamExclusionDialogOpen(true);
  };

  const handleOpenEditTeamExclusion = (exclusion: SchedulerTeamExclusion) => {
    setEditingTeamExclusion(exclusion);
    setTeamExclusionDialogMode('edit');
    setTeamExclusionDialogKey(`edit_${exclusion.id}`);
    setTeamExclusionDialogOpen(true);
  };

  const handleOpenCreateUmpireExclusion = () => {
    setEditingUmpireExclusion(undefined);
    setUmpireExclusionDialogMode('create');
    setUmpireExclusionDialogKey(`new_${Date.now()}`);
    setUmpireExclusionDialogOpen(true);
  };

  const handleOpenEditUmpireExclusion = (exclusion: SchedulerUmpireExclusion) => {
    setEditingUmpireExclusion(exclusion);
    setUmpireExclusionDialogMode('edit');
    setUmpireExclusionDialogKey(`edit_${exclusion.id}`);
    setUmpireExclusionDialogOpen(true);
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

  const handleDeleteSeasonExclusion = async (exclusion: SchedulerSeasonExclusion) => {
    try {
      await deleteSeasonExclusion(exclusion.id);
      await loadSeasonExclusions();
      setSuccess('Season exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete season exclusion');
    }
  };

  const handleSaveSeasonExclusion = async (input: SchedulerSeasonExclusionUpsert) => {
    try {
      if (!seasonId) {
        throw new Error('Missing current season');
      }

      if (seasonExclusionDialogMode === 'create') {
        await createSeasonExclusion(input);
        setSuccess('Season exclusion created');
      } else if (editingSeasonExclusion) {
        await updateSeasonExclusion(editingSeasonExclusion.id, input);
        setSuccess('Season exclusion updated');
      }

      await loadSeasonExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save season exclusion');
      throw err;
    }
  };

  const handleDeleteTeamExclusion = async (exclusion: SchedulerTeamExclusion) => {
    try {
      await deleteTeamExclusion(exclusion.id);
      await loadTeamExclusions();
      setSuccess('Team exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team exclusion');
    }
  };

  const handleSaveTeamExclusion = async (input: SchedulerTeamExclusionUpsert) => {
    try {
      if (!seasonId) {
        throw new Error('Missing current season');
      }

      if (teamExclusionDialogMode === 'create') {
        await createTeamExclusion(input);
        setSuccess('Team exclusion created');
      } else if (editingTeamExclusion) {
        await updateTeamExclusion(editingTeamExclusion.id, input);
        setSuccess('Team exclusion updated');
      }

      await loadTeamExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team exclusion');
      throw err;
    }
  };

  const handleDeleteUmpireExclusion = async (exclusion: SchedulerUmpireExclusion) => {
    try {
      await deleteUmpireExclusion(exclusion.id);
      await loadUmpireExclusions();
      setSuccess('Umpire exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete umpire exclusion');
    }
  };

  const handleSaveUmpireExclusion = async (input: SchedulerUmpireExclusionUpsert) => {
    try {
      if (!seasonId) {
        throw new Error('Missing current season');
      }

      if (umpireExclusionDialogMode === 'create') {
        await createUmpireExclusion(input);
        setSuccess('Umpire exclusion created');
      } else if (editingUmpireExclusion) {
        await updateUmpireExclusion(editingUmpireExclusion.id, input);
        setSuccess('Umpire exclusion updated');
      }

      await loadUmpireExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save umpire exclusion');
      throw err;
    }
  };

  const filterProblemSpecGames = useCallback(
    (preview: SchedulerProblemSpecPreview): string[] => {
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
    },
    [leagues.length, selectedLeagueSeasonIds, teamSeasonIdFilter],
  );

  const handlePreviewProblemSpec = async () => {
    try {
      setError(null);
      clearError();

      if (!seasonWindowConfig) {
        throw new Error('Season dates are required before previewing the problem spec');
      }

      if (leagues.length > 0 && selectedLeagueSeasonIds.length === 0) {
        throw new Error('Select at least one league to schedule');
      }

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
      setExpandedGameIds(new Set());

      if (!seasonWindowConfig) {
        throw new Error('Season dates are required before generating a proposal');
      }

      if (leagues.length > 0 && selectedLeagueSeasonIds.length === 0) {
        throw new Error('Select at least one league to schedule');
      }

      let gameIds: SchedulerSeasonSolveRequest['gameIds'];
      const shouldFilterByLeagueSelection =
        leagues.length > 0 &&
        selectedLeagueSeasonIds.length > 0 &&
        selectedLeagueSeasonIds.length !== leagues.length;

      const preview = await getProblemSpecPreview();
      setSpecPreview(preview);

      if (teamSeasonIdFilter || shouldFilterByLeagueSelection) {
        const filteredIds = filterProblemSpecGames(preview);
        if (filteredIds.length === 0) {
          throw new Error('No games match the current schedule filter');
        }
        gameIds = filteredIds;
      }

      const trimmedMaxGames = maxGamesPerUmpirePerDayInput.trim();
      const maxGamesPerUmpirePerDay =
        trimmedMaxGames.length > 0 ? Number(trimmedMaxGames) : undefined;
      if (maxGamesPerUmpirePerDay !== undefined) {
        if (!Number.isFinite(maxGamesPerUmpirePerDay) || maxGamesPerUmpirePerDay <= 0) {
          throw new Error('Max games/day for umpires must be a positive number');
        }
      }

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
        gameIds,
        umpiresPerGame,
        constraints:
          maxGamesPerUmpirePerDay !== undefined
            ? {
                hard: {
                  maxGamesPerUmpirePerDay: Math.floor(maxGamesPerUmpirePerDay),
                },
              }
            : undefined,
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

  const toggleExpanded = (gameId: string) => {
    setExpandedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const groupedAssignments = useMemo(() => {
    if (!proposal) {
      return [];
    }

    const groups = new Map<string, { dateLabel: string; assignments: typeof assignments }>();
    proposal.assignments.forEach((assignment) => {
      const dateKey = formatIsoDateKey(assignment.startTime, timeZone);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.assignments.push(assignment);
      } else {
        groups.set(dateKey, {
          dateLabel: formatLocalDateHeader(assignment.startTime, timeZone),
          assignments: [assignment],
        });
      }
    });

    const sortedKeys = Array.from(groups.keys()).sort();
    return sortedKeys.map((dateKey) => {
      const group = groups.get(dateKey) ?? { dateLabel: dateKey, assignments: [] };
      const sortedGroup = [...group.assignments].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      return { dateKey, dateLabel: group.dateLabel, assignments: sortedGroup };
    });
  }, [proposal, timeZone]);

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
          <Button variant="outlined" onClick={handleOpenCreateSeasonExclusion} disabled={!seasonId}>
            Add Season Exclusion
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenCreateTeamExclusion}
            disabled={!seasonId || teams.length === 0}
          >
            Add Team Exclusion
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenCreateUmpireExclusion}
            disabled={!seasonId || umpires.length === 0}
          >
            Add Umpire Exclusion
          </Button>
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Season Dates</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {seasonWindowConfig
                ? `Configured: ${seasonWindowConfig.startDate}–${seasonWindowConfig.endDate}`
                : 'Not configured. Set start/end dates to enable scheduling.'}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading season…
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Season Start"
            type="date"
            size="small"
            value={seasonStartDate}
            onChange={(event) => setSeasonStartDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!seasonId}
          />
          <TextField
            label="Season End"
            type="date"
            size="small"
            value={seasonEndDate}
            onChange={(event) => setSeasonEndDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!seasonId}
          />
          <Button
            variant="contained"
            onClick={() => {
              handleSaveSeasonWindow()
                .then(() => setSuccess('Scheduler settings saved'))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : 'Failed to save season window'),
                );
            }}
            disabled={
              !seasonId || seasonStartDate.trim().length === 0 || seasonEndDate.trim().length === 0
            }
          >
            Save Scheduler Settings
          </Button>
        </Box>

        {seasonId && !seasonWindowConfig && (
          <Alert severity="warning">
            Season dates are required before generating a proposal or preview.
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Leagues to Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            {leagues.length > 0
              ? `${selectedLeagueSeasonIds.length}/${leagues.length} league(s) selected.`
              : 'No leagues found for this season.'}
          </Typography>
          {leagueSeasonIdFilter && leagueSeasonSelection === null && (
            <Typography variant="caption" color="text.secondary">
              Defaulted from the schedule page league filter.
            </Typography>
          )}
        </Box>

        {leagues.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 320 }}>
              <InputLabel id="scheduler-leagues-filter">Leagues</InputLabel>
              <Select
                labelId="scheduler-leagues-filter"
                label="Leagues"
                multiple
                value={selectedLeagueSeasonIds}
                onChange={(event) => {
                  const next = Array.isArray(event.target.value)
                    ? event.target.value
                    : String(event.target.value).split(',');
                  if (next.length === 0) {
                    return;
                  }
                  setLeagueSeasonSelection(next);
                }}
                renderValue={(selected) =>
                  selected.map((id) => leagueNameById.get(id) ?? `League ${id}`).join(', ')
                }
              >
                {leagues.map((league) => (
                  <MenuItem key={league.id} value={league.id}>
                    {league.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" onClick={() => setLeagueSeasonSelection(allLeagueSeasonIds)}>
              Select All
            </Button>
          </Box>
        )}

        {leagues.length > 0 && selectedLeagueSeasonIds.length === 0 && (
          <Alert severity="warning">Select at least one league to schedule.</Alert>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Umpires Per Game</Typography>
          <Typography variant="body2" color="text.secondary">
            Sets the required umpire count for each scheduled game (applies to proposal generation
            only).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={!seasonId}>
            <InputLabel id="scheduler-umpires-per-game">Umpires</InputLabel>
            <Select
              labelId="scheduler-umpires-per-game"
              label="Umpires"
              value={umpiresPerGame}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (next === 1 || next === 2 || next === 3 || next === 4) {
                  setUmpiresPerGame(next);
                }
              }}
            >
              <MenuItem value={1}>1 per game</MenuItem>
              <MenuItem value={2}>2 per game</MenuItem>
              <MenuItem value={3}>3 per game</MenuItem>
              <MenuItem value={4}>4 per game</MenuItem>
            </Select>
          </FormControl>
          {umpires.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {umpires.length} umpire(s) available for assignment.
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Umpire Max Games/Day</Typography>
          <Typography variant="body2" color="text.secondary">
            Optional global limit applied during proposal generation (leave blank for no limit).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Max games/day per umpire"
            type="number"
            size="small"
            value={maxGamesPerUmpirePerDayInput}
            onChange={(event) => setMaxGamesPerUmpirePerDayInput(event.target.value)}
            inputProps={{ min: 1, step: 1 }}
            disabled={!seasonId}
          />
        </Box>
      </Box>

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
                    Days={formatDaysOfWeekMask(rule.daysOfWeekMask)},{' '}
                    {rule.enabled ? 'enabled' : 'disabled'}
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

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Season Exclusion Windows</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {seasonExclusions.length} exclusion window(s) configured.
            </Typography>
          ) : null}
        </Box>

        {seasonExclusions.length > 0 && (
          <Stack spacing={1}>
            {seasonExclusions.map((exclusion) => (
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
                    {formatLocalTimeRange(exclusion.startTime, exclusion.endTime)}{' '}
                    {exclusion.enabled ? '' : '(disabled)'}
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
                    onClick={() => handleOpenEditSeasonExclusion(exclusion)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteSeasonExclusion(exclusion).catch(() => undefined)}
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
          <Typography variant="subtitle2">Team Exclusion Windows</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {teamExclusions.length} exclusion window(s) configured.
            </Typography>
          ) : null}
        </Box>

        {teamExclusions.length > 0 && (
          <Stack spacing={1}>
            {teamExclusions.map((exclusion) => (
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
                    {teamNameById.get(exclusion.teamSeasonId) ?? `Team ${exclusion.teamSeasonId}`} •{' '}
                    {formatLocalTimeRange(exclusion.startTime, exclusion.endTime)}{' '}
                    {exclusion.enabled ? '' : '(disabled)'}
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
                    onClick={() => handleOpenEditTeamExclusion(exclusion)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteTeamExclusion(exclusion).catch(() => undefined)}
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
          <Typography variant="subtitle2">Umpire Exclusion Windows</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {umpireExclusions.length} exclusion window(s) configured.
            </Typography>
          ) : null}
        </Box>

        {umpireExclusions.length > 0 && (
          <Stack spacing={1}>
            {umpireExclusions.map((exclusion) => (
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
                    {umpireNameById.get(exclusion.umpireId) ?? `Umpire ${exclusion.umpireId}`} •{' '}
                    {formatLocalTimeRange(exclusion.startTime, exclusion.endTime)}{' '}
                    {exclusion.enabled ? '' : '(disabled)'}
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
                    onClick={() => handleOpenEditUmpireExclusion(exclusion)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteUmpireExclusion(exclusion).catch(() => undefined)}
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
                  {groupedAssignments.map((group) => (
                    <Box
                      key={group.dateKey}
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {group.dateLabel}
                      </Typography>

                      {group.assignments.map((assignment) => {
                        const game = gameRequestById.get(assignment.gameId);
                        const home =
                          (game?.homeTeamSeasonId
                            ? teamNameById.get(game.homeTeamSeasonId)
                            : null) ?? 'Unknown Home';
                        const visitor =
                          (game?.visitorTeamSeasonId
                            ? teamNameById.get(game.visitorTeamSeasonId)
                            : null) ?? 'Unknown Visitor';
                        const title = game ? `${home} vs ${visitor}` : `Game ${assignment.gameId}`;

                        const leagueLabel =
                          game?.leagueSeasonId && leagueNameById.get(game.leagueSeasonId)
                            ? leagueNameById.get(game.leagueSeasonId)
                            : null;

                        const umpireNames = assignment.umpireIds
                          .map(
                            (id) =>
                              schedulerUmpireNameById.get(id) ??
                              umpireNameById.get(id) ??
                              `Umpire ${id}`,
                          )
                          .filter((name) => name.trim().length > 0);

                        const secondaryParts: string[] = [];
                        if (leagueLabel) {
                          secondaryParts.push(leagueLabel);
                        }
                        secondaryParts.push(
                          `Field: ${fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`}`,
                        );
                        secondaryParts.push(
                          formatLocalTimeRange(assignment.startTime, assignment.endTime),
                        );
                        if (umpireNames.length === 1) {
                          secondaryParts.push(`Umpire: ${umpireNames[0]}`);
                        } else if (umpireNames.length > 1) {
                          secondaryParts.push(`Umpires: ${umpireNames.join(', ')}`);
                        } else {
                          secondaryParts.push('Umpire: Unassigned');
                        }

                        const expanded = expandedGameIds.has(assignment.gameId);

                        return (
                          <Box
                            key={assignment.gameId}
                            sx={{
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                              }}
                            >
                              <Checkbox
                                checked={selectedGameIds.has(assignment.gameId)}
                                onChange={() => handleToggleSelection(assignment.gameId)}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                  {title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {secondaryParts.join(' • ')}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                aria-label={expanded ? 'Collapse details' : 'Expand details'}
                                onClick={() => toggleExpanded(assignment.gameId)}
                              >
                                {expanded ? (
                                  <ExpandLess fontSize="small" />
                                ) : (
                                  <ExpandMore fontSize="small" />
                                )}
                              </IconButton>
                            </Box>

                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ px: 2, pb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Game ID: {assignment.gameId}
                                </Typography>
                                {game && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    Home Team Season ID: {game.homeTeamSeasonId} • Visitor Team
                                    Season ID: {game.visitorTeamSeasonId}
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Start (UTC): {assignment.startTime} • End (UTC):{' '}
                                  {assignment.endTime}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Field ID: {assignment.fieldId} • Umpire IDs:{' '}
                                  {assignment.umpireIds.length
                                    ? assignment.umpireIds.join(', ')
                                    : 'None'}
                                </Typography>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
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

      {seasonId && (
        <SchedulerSeasonExclusionDialog
          key={seasonExclusionDialogKey}
          open={seasonExclusionDialogOpen}
          mode={seasonExclusionDialogMode}
          seasonId={seasonId}
          initialExclusion={editingSeasonExclusion}
          onClose={() => setSeasonExclusionDialogOpen(false)}
          onSubmit={handleSaveSeasonExclusion}
          loading={loading}
        />
      )}

      {seasonId && (
        <SchedulerTeamExclusionDialog
          key={teamExclusionDialogKey}
          open={teamExclusionDialogOpen}
          mode={teamExclusionDialogMode}
          seasonId={seasonId}
          teams={teams}
          initialExclusion={editingTeamExclusion}
          onClose={() => setTeamExclusionDialogOpen(false)}
          onSubmit={handleSaveTeamExclusion}
          loading={loading}
        />
      )}

      {seasonId && (
        <SchedulerUmpireExclusionDialog
          key={umpireExclusionDialogKey}
          open={umpireExclusionDialogOpen}
          mode={umpireExclusionDialogMode}
          seasonId={seasonId}
          umpires={umpires}
          initialExclusion={editingUmpireExclusion}
          onClose={() => setUmpireExclusionDialogOpen(false)}
          onSubmit={handleSaveUmpireExclusion}
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
