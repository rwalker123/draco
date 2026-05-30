'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
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
import { formatLocalHhmmTo12Hour, formatLocalTimeRange } from '../../utils/schedulerTimeFormat';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ConstraintListSection, ListRowActions, listRowSx } from './ConstraintListSection';

type EntityOption = { id: string; name: string };
type FieldOption = { id: string; name: string };

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
  const ruleDialog = useConstraintDialog<
    SchedulerFieldAvailabilityRule,
    SchedulerFieldAvailabilityRuleUpsert
  >(onCreateRule, onEditRule);
  const exclusionDialog = useConstraintDialog<
    SchedulerFieldExclusionDate,
    SchedulerFieldExclusionDateUpsert
  >(onCreateExclusion, onEditExclusion);
  const seasonExclusionDialog = useConstraintDialog<
    SchedulerSeasonExclusion,
    SchedulerSeasonExclusionUpsert
  >(onCreateSeasonExclusion, onEditSeasonExclusion);
  const teamExclusionDialog = useConstraintDialog<
    SchedulerTeamExclusion,
    SchedulerTeamExclusionUpsert
  >(onCreateTeamExclusion, onEditTeamExclusion);
  const umpireExclusionDialog = useConstraintDialog<
    SchedulerUmpireExclusion,
    SchedulerUmpireExclusionUpsert
  >(onCreateUmpireExclusion, onEditUmpireExclusion);

  const timeRange = (start: string, end: string) => formatLocalTimeRange(start, end, timeZone);

  const renderRule = (rule: SchedulerFieldAvailabilityRule) => (
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
          Days={formatDaysOfWeekMask(rule.daysOfWeekMask)}, {rule.enabled ? 'enabled' : 'disabled'}
        </Typography>
      </Box>
      <ListRowActions
        onEdit={() => ruleDialog.openEdit(rule)}
        onDelete={() => onDeleteRule(rule).catch(() => undefined)}
      />
    </Box>
  );

  const renderFieldExclusion = (excl: SchedulerFieldExclusionDate) => (
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
        onEdit={() => exclusionDialog.openEdit(excl)}
        onDelete={() => onDeleteExclusion(excl).catch(() => undefined)}
      />
    </Box>
  );

  const renderWindowRow = <
    T extends {
      id: string;
      startTime: string;
      endTime: string;
      enabled: boolean;
      note?: string | null;
    },
  >(
    excl: T,
    prefix: string | undefined,
    openEdit: (e: T) => void,
    onDelete: (e: T) => Promise<void>,
  ) => (
    <Box key={excl.id} sx={listRowSx}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {prefix ? `${prefix} • ` : ''}
          {timeRange(excl.startTime, excl.endTime)} {excl.enabled ? '' : '(disabled)'}
        </Typography>
        {excl.note && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {excl.note}
          </Typography>
        )}
      </Box>
      <ListRowActions
        onEdit={() => openEdit(excl)}
        onDelete={() => onDelete(excl).catch(() => undefined)}
      />
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant="outlined"
          onClick={ruleDialog.openCreate}
          disabled={!seasonId || fields.length === 0}
        >
          Add Availability Rule
        </Button>
        <Button
          variant="outlined"
          onClick={exclusionDialog.openCreate}
          disabled={!seasonId || fields.length === 0}
        >
          Add Exclusion Date
        </Button>
        <Button variant="outlined" onClick={seasonExclusionDialog.openCreate} disabled={!seasonId}>
          Add Season Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={teamExclusionDialog.openCreate}
          disabled={!seasonId || teams.length === 0}
        >
          Add Team Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={umpireExclusionDialog.openCreate}
          disabled={!seasonId || umpires.length === 0}
        >
          Add Umpire Exclusion
        </Button>
      </Box>

      <ConstraintListSection
        title="Availability Rules"
        seasonId={seasonId}
        items={rules}
        unitLabel="rule(s)"
        renderRow={renderRule}
      />

      <ConstraintListSection
        title="Field Exclusion Dates"
        seasonId={seasonId}
        items={exclusions}
        renderRow={renderFieldExclusion}
      />

      <ConstraintListSection
        title="Season Exclusion Windows"
        seasonId={seasonId}
        items={seasonExclusions}
        renderRow={(excl) =>
          renderWindowRow(excl, undefined, seasonExclusionDialog.openEdit, onDeleteSeasonExclusion)
        }
      />

      <ConstraintListSection
        title="Team Exclusion Windows"
        seasonId={seasonId}
        items={teamExclusions}
        renderRow={(excl) =>
          renderWindowRow(
            excl,
            teamNameById.get(excl.teamSeasonId) ?? `Team ${excl.teamSeasonId}`,
            teamExclusionDialog.openEdit,
            onDeleteTeamExclusion,
          )
        }
      />

      <ConstraintListSection
        title="Umpire Exclusion Windows"
        seasonId={seasonId}
        items={umpireExclusions}
        renderRow={(excl) =>
          renderWindowRow(
            excl,
            umpireNameById.get(excl.umpireId) ?? `Umpire ${excl.umpireId}`,
            umpireExclusionDialog.openEdit,
            onDeleteUmpireExclusion,
          )
        }
      />

      {seasonId && (
        <>
          <SchedulerFieldAvailabilityRuleDialog
            key={`field-availability-${ruleDialog.dialogKey}`}
            open={ruleDialog.open}
            mode={ruleDialog.mode}
            seasonId={seasonId}
            fields={fields}
            initialRule={ruleDialog.editing}
            onClose={ruleDialog.close}
            onSubmit={ruleDialog.handleSave}
            loading={loading}
          />
          <SchedulerFieldExclusionDateDialog
            key={`field-exclusion-${exclusionDialog.dialogKey}`}
            open={exclusionDialog.open}
            mode={exclusionDialog.mode}
            seasonId={seasonId}
            fields={fields}
            initialExclusion={exclusionDialog.editing}
            onClose={exclusionDialog.close}
            onSubmit={exclusionDialog.handleSave}
            loading={loading}
          />
          <SchedulerSeasonExclusionDialog
            key={`season-exclusion-${seasonExclusionDialog.dialogKey}`}
            open={seasonExclusionDialog.open}
            mode={seasonExclusionDialog.mode}
            seasonId={seasonId}
            initialExclusion={seasonExclusionDialog.editing}
            onClose={seasonExclusionDialog.close}
            onSubmit={seasonExclusionDialog.handleSave}
            loading={loading}
          />
          <SchedulerTeamExclusionDialog
            key={`team-exclusion-${teamExclusionDialog.dialogKey}`}
            open={teamExclusionDialog.open}
            mode={teamExclusionDialog.mode}
            seasonId={seasonId}
            teams={teams}
            initialExclusion={teamExclusionDialog.editing}
            onClose={teamExclusionDialog.close}
            onSubmit={teamExclusionDialog.handleSave}
            loading={loading}
          />
          <SchedulerUmpireExclusionDialog
            key={`umpire-exclusion-${umpireExclusionDialog.dialogKey}`}
            open={umpireExclusionDialog.open}
            mode={umpireExclusionDialog.mode}
            seasonId={seasonId}
            umpires={umpires}
            initialExclusion={umpireExclusionDialog.editing}
            onClose={umpireExclusionDialog.close}
            onSubmit={umpireExclusionDialog.handleSave}
            loading={loading}
          />
        </>
      )}
    </>
  );
};
