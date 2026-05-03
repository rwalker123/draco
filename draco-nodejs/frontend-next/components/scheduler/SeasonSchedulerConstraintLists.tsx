'use client';

import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type {
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
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
import { formatDaysOfWeekMask } from '../../utils/daysOfWeekUtils';

type EntityOption = { id: string; name: string };
type FieldOption = { id: string; name: string };

const formatLocalHhmmTo12Hour = (value: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return value;
  const hours24 = Number(match[1]);
  if (Number.isNaN(hours24)) return value;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${match[2] ?? '00'} ${suffix}`;
};

const formatLocalTimeRange = (startIso: string, endIso: string, timeZone: string): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startIso}–${endIso}`;
  try {
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', { timeZone, ...opts }).format(d);
    const dateLabel = fmt(start, { weekday: 'short', month: 'short', day: 'numeric' });
    const startTime = fmt(start, { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = fmt(end, { hour: 'numeric', minute: '2-digit', hour12: true });
    const tzLabel = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(start)
      .find((p) => p.type === 'timeZoneName')?.value;
    return `${dateLabel} • ${startTime} – ${endTime}${tzLabel ? ` (${tzLabel})` : ''}`;
  } catch {
    return `${start.toISOString()}–${end.toISOString()}`;
  }
};

const listRowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  p: 1,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
} as const;

interface ConstraintSectionProps {
  title: string;
  seasonId: string | null;
  count: number;
  children: React.ReactNode;
}

const ConstraintSection: React.FC<ConstraintSectionProps> = ({
  title,
  seasonId,
  count,
  children,
}) => (
  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box>
      <Typography variant="subtitle2">{title}</Typography>
      {seasonId && (
        <Typography variant="body2" color="text.secondary">
          {count} {title === 'Availability Rules' ? 'rule(s)' : 'entry(s)'} configured.
        </Typography>
      )}
    </Box>
    {children}
  </Box>
);

interface ListRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

const ListRowActions: React.FC<ListRowActionsProps> = ({ onEdit, onDelete }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button size="small" variant="outlined" onClick={onEdit}>
      Edit
    </Button>
    <Button size="small" color="error" variant="outlined" onClick={onDelete}>
      Delete
    </Button>
  </Box>
);

interface SeasonSchedulerConstraintListsProps {
  seasonId: string | null;
  timeZone: string;
  fields: FieldOption[];
  teams: EntityOption[];
  umpires: EntityOption[];
  rules: SchedulerFieldAvailabilityRule[];
  exclusions: SchedulerFieldExclusionDate[];
  seasonExclusions: SchedulerSeasonExclusion[];
  teamExclusions: SchedulerTeamExclusion[];
  umpireExclusions: SchedulerUmpireExclusion[];
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  loading: boolean;
  onCreateRule: (input: SchedulerFieldAvailabilityRuleUpsert) => Promise<void>;
  onEditRule: (id: string, input: SchedulerFieldAvailabilityRuleUpsert) => Promise<void>;
  onDeleteRule: (rule: SchedulerFieldAvailabilityRule) => Promise<void>;
  onCreateExclusion: (input: SchedulerFieldExclusionDateUpsert) => Promise<void>;
  onEditExclusion: (id: string, input: SchedulerFieldExclusionDateUpsert) => Promise<void>;
  onDeleteExclusion: (exclusion: SchedulerFieldExclusionDate) => Promise<void>;
  onCreateSeasonExclusion: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onEditSeasonExclusion: (id: string, input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onDeleteSeasonExclusion: (exclusion: SchedulerSeasonExclusion) => Promise<void>;
  onCreateTeamExclusion: (input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onEditTeamExclusion: (id: string, input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onDeleteTeamExclusion: (exclusion: SchedulerTeamExclusion) => Promise<void>;
  onCreateUmpireExclusion: (input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onEditUmpireExclusion: (id: string, input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onDeleteUmpireExclusion: (exclusion: SchedulerUmpireExclusion) => Promise<void>;
}

export const SeasonSchedulerConstraintLists: React.FC<SeasonSchedulerConstraintListsProps> = ({
  seasonId,
  timeZone,
  fields,
  teams,
  umpires,
  rules,
  exclusions,
  seasonExclusions,
  teamExclusions,
  umpireExclusions,
  fieldNameById,
  teamNameById,
  umpireNameById,
  loading,
  onCreateRule,
  onEditRule,
  onDeleteRule,
  onCreateExclusion,
  onEditExclusion,
  onDeleteExclusion,
  onCreateSeasonExclusion,
  onEditSeasonExclusion,
  onDeleteSeasonExclusion,
  onCreateTeamExclusion,
  onEditTeamExclusion,
  onDeleteTeamExclusion,
  onCreateUmpireExclusion,
  onEditUmpireExclusion,
  onDeleteUmpireExclusion,
}) => {
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

  const openCreateRule = () => {
    setEditingRule(undefined);
    setRuleDialogMode('create');
    setRuleDialogKey(`new_${Date.now()}`);
    setRuleDialogOpen(true);
  };

  const openEditRule = (rule: SchedulerFieldAvailabilityRule) => {
    setEditingRule(rule);
    setRuleDialogMode('edit');
    setRuleDialogKey(`edit_${rule.id}`);
    setRuleDialogOpen(true);
  };

  const openCreateExclusion = () => {
    setEditingExclusion(undefined);
    setExclusionDialogMode('create');
    setExclusionDialogKey(`new_${Date.now()}`);
    setExclusionDialogOpen(true);
  };

  const openEditExclusion = (excl: SchedulerFieldExclusionDate) => {
    setEditingExclusion(excl);
    setExclusionDialogMode('edit');
    setExclusionDialogKey(`edit_${excl.id}`);
    setExclusionDialogOpen(true);
  };

  const openCreateSeasonExclusion = () => {
    setEditingSeasonExclusion(undefined);
    setSeasonExclusionDialogMode('create');
    setSeasonExclusionDialogKey(`new_${Date.now()}`);
    setSeasonExclusionDialogOpen(true);
  };

  const openEditSeasonExclusion = (excl: SchedulerSeasonExclusion) => {
    setEditingSeasonExclusion(excl);
    setSeasonExclusionDialogMode('edit');
    setSeasonExclusionDialogKey(`edit_${excl.id}`);
    setSeasonExclusionDialogOpen(true);
  };

  const openCreateTeamExclusion = () => {
    setEditingTeamExclusion(undefined);
    setTeamExclusionDialogMode('create');
    setTeamExclusionDialogKey(`new_${Date.now()}`);
    setTeamExclusionDialogOpen(true);
  };

  const openEditTeamExclusion = (excl: SchedulerTeamExclusion) => {
    setEditingTeamExclusion(excl);
    setTeamExclusionDialogMode('edit');
    setTeamExclusionDialogKey(`edit_${excl.id}`);
    setTeamExclusionDialogOpen(true);
  };

  const openCreateUmpireExclusion = () => {
    setEditingUmpireExclusion(undefined);
    setUmpireExclusionDialogMode('create');
    setUmpireExclusionDialogKey(`new_${Date.now()}`);
    setUmpireExclusionDialogOpen(true);
  };

  const openEditUmpireExclusion = (excl: SchedulerUmpireExclusion) => {
    setEditingUmpireExclusion(excl);
    setUmpireExclusionDialogMode('edit');
    setUmpireExclusionDialogKey(`edit_${excl.id}`);
    setUmpireExclusionDialogOpen(true);
  };

  const handleSaveRule = async (input: SchedulerFieldAvailabilityRuleUpsert) => {
    if (ruleDialogMode === 'create') await onCreateRule(input);
    else if (editingRule) await onEditRule(editingRule.id, input);
  };

  const handleSaveExclusion = async (input: SchedulerFieldExclusionDateUpsert) => {
    if (exclusionDialogMode === 'create') await onCreateExclusion(input);
    else if (editingExclusion) await onEditExclusion(editingExclusion.id, input);
  };

  const handleSaveSeasonExclusion = async (input: SchedulerSeasonExclusionUpsert) => {
    if (seasonExclusionDialogMode === 'create') await onCreateSeasonExclusion(input);
    else if (editingSeasonExclusion) await onEditSeasonExclusion(editingSeasonExclusion.id, input);
  };

  const handleSaveTeamExclusion = async (input: SchedulerTeamExclusionUpsert) => {
    if (teamExclusionDialogMode === 'create') await onCreateTeamExclusion(input);
    else if (editingTeamExclusion) await onEditTeamExclusion(editingTeamExclusion.id, input);
  };

  const handleSaveUmpireExclusion = async (input: SchedulerUmpireExclusionUpsert) => {
    if (umpireExclusionDialogMode === 'create') await onCreateUmpireExclusion(input);
    else if (editingUmpireExclusion) await onEditUmpireExclusion(editingUmpireExclusion.id, input);
  };

  const timeRange = (start: string, end: string) => formatLocalTimeRange(start, end, timeZone);

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant="outlined"
          onClick={openCreateRule}
          disabled={!seasonId || fields.length === 0}
        >
          Add Availability Rule
        </Button>
        <Button
          variant="outlined"
          onClick={openCreateExclusion}
          disabled={!seasonId || fields.length === 0}
        >
          Add Exclusion Date
        </Button>
        <Button variant="outlined" onClick={openCreateSeasonExclusion} disabled={!seasonId}>
          Add Season Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={openCreateTeamExclusion}
          disabled={!seasonId || teams.length === 0}
        >
          Add Team Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={openCreateUmpireExclusion}
          disabled={!seasonId || umpires.length === 0}
        >
          Add Umpire Exclusion
        </Button>
      </Box>

      <ConstraintSection title="Availability Rules" seasonId={seasonId} count={rules.length}>
        {rules.length > 0 && (
          <Stack spacing={1}>
            {rules.map((rule) => (
              <Box key={rule.id} sx={listRowSx}>
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
                <ListRowActions
                  onEdit={() => openEditRule(rule)}
                  onDelete={() => onDeleteRule(rule).catch(() => undefined)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </ConstraintSection>

      <ConstraintSection
        title="Field Exclusion Dates"
        seasonId={seasonId}
        count={exclusions.length}
      >
        {exclusions.length > 0 && (
          <Stack spacing={1}>
            {exclusions.map((excl) => (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {fieldNameById.get(excl.fieldId) ?? `Field ${excl.fieldId}`}: {excl.date}{' '}
                    {excl.enabled ? '' : '(disabled)'}
                  </Typography>
                  {excl.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {excl.note}
                    </Typography>
                  )}
                </Box>
                <ListRowActions
                  onEdit={() => openEditExclusion(excl)}
                  onDelete={() => onDeleteExclusion(excl).catch(() => undefined)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </ConstraintSection>

      <ConstraintSection
        title="Season Exclusion Windows"
        seasonId={seasonId}
        count={seasonExclusions.length}
      >
        {seasonExclusions.length > 0 && (
          <Stack spacing={1}>
            {seasonExclusions.map((excl) => (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {timeRange(excl.startTime, excl.endTime)} {excl.enabled ? '' : '(disabled)'}
                  </Typography>
                  {excl.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {excl.note}
                    </Typography>
                  )}
                </Box>
                <ListRowActions
                  onEdit={() => openEditSeasonExclusion(excl)}
                  onDelete={() => onDeleteSeasonExclusion(excl).catch(() => undefined)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </ConstraintSection>

      <ConstraintSection
        title="Team Exclusion Windows"
        seasonId={seasonId}
        count={teamExclusions.length}
      >
        {teamExclusions.length > 0 && (
          <Stack spacing={1}>
            {teamExclusions.map((excl) => (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {teamNameById.get(excl.teamSeasonId) ?? `Team ${excl.teamSeasonId}`} •{' '}
                    {timeRange(excl.startTime, excl.endTime)} {excl.enabled ? '' : '(disabled)'}
                  </Typography>
                  {excl.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {excl.note}
                    </Typography>
                  )}
                </Box>
                <ListRowActions
                  onEdit={() => openEditTeamExclusion(excl)}
                  onDelete={() => onDeleteTeamExclusion(excl).catch(() => undefined)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </ConstraintSection>

      <ConstraintSection
        title="Umpire Exclusion Windows"
        seasonId={seasonId}
        count={umpireExclusions.length}
      >
        {umpireExclusions.length > 0 && (
          <Stack spacing={1}>
            {umpireExclusions.map((excl) => (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {umpireNameById.get(excl.umpireId) ?? `Umpire ${excl.umpireId}`} •{' '}
                    {timeRange(excl.startTime, excl.endTime)} {excl.enabled ? '' : '(disabled)'}
                  </Typography>
                  {excl.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {excl.note}
                    </Typography>
                  )}
                </Box>
                <ListRowActions
                  onEdit={() => openEditUmpireExclusion(excl)}
                  onDelete={() => onDeleteUmpireExclusion(excl).catch(() => undefined)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </ConstraintSection>

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
    </>
  );
};
