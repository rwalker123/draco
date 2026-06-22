'use client';

import React from 'react';
import {
  Box,
  Checkbox,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import {
  formatLocalTimeRange,
  utcIsoToZonedInputValue,
  zonedInputValueToUtcIso,
} from '../../utils/schedulerTimeFormat';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];
type Option = { id: string; name: string };

interface ProposalAssignmentRowProps {
  assignment: Assignment;
  game: GameRequest | undefined;
  timeZone: string;
  selected: boolean;
  expanded: boolean;
  fields: Option[];
  umpires: Option[];
  maxUmpires: number;
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  schedulerUmpireNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  onToggleSelection: () => void;
  onToggleExpanded: () => void;
  onAssignmentChange: (assignment: Assignment) => void;
}

export const ProposalAssignmentRow: React.FC<ProposalAssignmentRowProps> = ({
  assignment,
  game,
  timeZone,
  selected,
  expanded,
  fields,
  umpires,
  maxUmpires,
  fieldNameById,
  teamNameById,
  umpireNameById,
  schedulerUmpireNameById,
  leagueNameById,
  onToggleSelection,
  onToggleExpanded,
  onAssignmentChange,
}) => {
  const home =
    (game?.homeTeamSeasonId ? teamNameById.get(game.homeTeamSeasonId) : null) ?? 'Unknown Home';
  const visitor =
    (game?.visitorTeamSeasonId ? teamNameById.get(game.visitorTeamSeasonId) : null) ??
    'Unknown Visitor';
  const title = game ? `${home} vs ${visitor}` : `Game ${assignment.gameId}`;

  const leagueLabel =
    game?.leagueSeasonId && leagueNameById.get(game.leagueSeasonId)
      ? leagueNameById.get(game.leagueSeasonId)
      : null;

  const umpireNames = assignment.umpireIds
    .map((id) => schedulerUmpireNameById.get(id) ?? umpireNameById.get(id) ?? `Umpire ${id}`)
    .filter((name) => name.trim().length > 0);

  const secondaryParts: string[] = [];
  if (leagueLabel) secondaryParts.push(leagueLabel);
  secondaryParts.push(
    `Field: ${fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`}`,
  );
  secondaryParts.push(formatLocalTimeRange(assignment.startTime, assignment.endTime, timeZone));
  if (maxUmpires > 0) {
    if (umpireNames.length === 1) secondaryParts.push(`Umpire: ${umpireNames[0]}`);
    else if (umpireNames.length > 1) secondaryParts.push(`Umpires: ${umpireNames.join(', ')}`);
    else secondaryParts.push('Umpire: Unassigned');
  }

  const detailsId = `proposal-assignment-details-${assignment.gameId}`;

  const handleFieldChange = (event: SelectChangeEvent) => {
    onAssignmentChange({ ...assignment, fieldId: event.target.value });
  };

  const handleUmpiresChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const ids = (typeof value === 'string' ? value.split(',') : value).filter(
      (id) => id.length > 0,
    );
    onAssignmentChange({ ...assignment, umpireIds: ids.slice(0, maxUmpires) });
  };

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextStartIso = zonedInputValueToUtcIso(event.target.value, timeZone);
    if (!nextStartIso) return;
    const previousStart = new Date(assignment.startTime).getTime();
    const previousEnd = new Date(assignment.endTime).getTime();
    const durationMs =
      Number.isFinite(previousStart) && Number.isFinite(previousEnd) && previousEnd > previousStart
        ? previousEnd - previousStart
        : 0;
    const nextEndIso = new Date(new Date(nextStartIso).getTime() + durationMs).toISOString();
    onAssignmentChange({ ...assignment, startTime: nextStartIso, endTime: nextEndIso });
  };

  const startInputValue = utcIsoToZonedInputValue(assignment.startTime, timeZone);

  return (
    <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <Checkbox
          checked={selected}
          onChange={onToggleSelection}
          inputProps={{ 'aria-label': `Select assignment: ${title}` }}
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
          aria-label={
            expanded ? `Collapse edit controls for ${title}` : `Expand edit controls for ${title}`
          }
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggleExpanded}
        >
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit id={detailsId}>
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id={`${detailsId}-field-label`}>Field</InputLabel>
              <Select
                labelId={`${detailsId}-field-label`}
                label="Field"
                value={assignment.fieldId}
                onChange={handleFieldChange}
              >
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {maxUmpires > 0 && (
              <FormControl size="small" fullWidth>
                <InputLabel id={`${detailsId}-umpires-label`}>Umpires</InputLabel>
                <Select
                  labelId={`${detailsId}-umpires-label`}
                  label="Umpires"
                  multiple
                  value={assignment.umpireIds}
                  onChange={handleUmpiresChange}
                  renderValue={(selectedIds) =>
                    selectedIds.length === 0
                      ? 'Unassigned'
                      : selectedIds
                          .map(
                            (id) =>
                              schedulerUmpireNameById.get(id) ??
                              umpireNameById.get(id) ??
                              `Umpire ${id}`,
                          )
                          .join(', ')
                  }
                >
                  {umpires.map((umpire) => (
                    <MenuItem
                      key={umpire.id}
                      value={umpire.id}
                      disabled={
                        assignment.umpireIds.length >= maxUmpires &&
                        !assignment.umpireIds.includes(umpire.id)
                      }
                    >
                      <Checkbox checked={assignment.umpireIds.includes(umpire.id)} />
                      <ListItemText primary={umpire.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Start"
              type="datetime-local"
              size="small"
              fullWidth
              value={startInputValue}
              onChange={handleStartChange}
              InputLabelProps={{ shrink: true }}
              helperText="Times are shown in the league time zone. End time shifts with the same game length."
            />

            <Typography variant="caption" color="text.secondary" display="block">
              Game ID: {assignment.gameId}
            </Typography>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
