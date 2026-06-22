'use client';

import React from 'react';
import { Box, Chip, Divider, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CollapsibleSection } from './CollapsibleSection';
import type {
  SchedulerConstraintConfig,
  SchedulerSoftConstraintKey,
} from '../../utils/schedulerConstraintStorage';

interface SchedulerConstraintsConfigProps {
  seasonId: string | null;
  config: SchedulerConstraintConfig;
  onChange: (config: SchedulerConstraintConfig) => void;
}

const SOFT_LABELS: Record<SchedulerSoftConstraintKey, string> = {
  avoidBackToBackGames: 'Avoid back-to-back games',
  spreadGamesAcrossDays: 'Spread games across days',
  balanceEarlyVsLate: 'Balance early vs. late games',
};

const clampNonNegativeInt = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

interface SortableSoftRowProps {
  softKey: SchedulerSoftConstraintKey;
  config: SchedulerConstraintConfig;
  disabled: boolean;
  onChange: (config: SchedulerConstraintConfig) => void;
}

const SortableSoftRow: React.FC<SortableSoftRowProps> = ({
  softKey,
  config,
  disabled,
  onChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: softKey,
  });

  const enabled =
    softKey === 'avoidBackToBackGames'
      ? config.avoidBackToBackGames.enabled
      : softKey === 'spreadGamesAcrossDays'
        ? config.spreadGamesAcrossDays.enabled
        : config.balanceEarlyVsLate.enabled;

  const handleEnabledChange = (next: boolean) => {
    if (softKey === 'avoidBackToBackGames') {
      onChange({
        ...config,
        avoidBackToBackGames: { ...config.avoidBackToBackGames, enabled: next },
      });
    } else if (softKey === 'spreadGamesAcrossDays') {
      onChange({ ...config, spreadGamesAcrossDays: { enabled: next } });
    } else {
      onChange({ ...config, balanceEarlyVsLate: { enabled: next } });
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        opacity: isDragging ? 0.6 : 1,
        py: 0.5,
      }}
    >
      <Box
        {...(disabled ? {} : attributes)}
        {...(disabled ? {} : listeners)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'default' : 'grab',
          color: 'text.secondary',
          touchAction: 'none',
        }}
        aria-label={`Reorder ${SOFT_LABELS[softKey]}`}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(event) => handleEnabledChange(event.target.checked)}
            disabled={disabled}
          />
        }
        label={SOFT_LABELS[softKey]}
      />
      {softKey === 'avoidBackToBackGames' && enabled && (
        <TextField
          type="number"
          size="small"
          label="Min rest (minutes)"
          value={config.avoidBackToBackGames.minRestMinutes}
          onChange={(event) =>
            onChange({
              ...config,
              avoidBackToBackGames: {
                ...config.avoidBackToBackGames,
                minRestMinutes: clampNonNegativeInt(
                  event.target.value,
                  config.avoidBackToBackGames.minRestMinutes,
                ),
              },
            })
          }
          inputProps={{ min: 0, step: 30 }}
          disabled={disabled}
          sx={{ maxWidth: 180 }}
        />
      )}
    </Box>
  );
};

export const SchedulerConstraintsConfig: React.FC<SchedulerConstraintsConfigProps> = ({
  seasonId,
  config,
  onChange,
}) => {
  const disabled = !seasonId;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const enabledCount =
    (config.avoidBackToBackGames.enabled ? 1 : 0) +
    (config.spreadGamesAcrossDays.enabled ? 1 : 0) +
    (config.balanceEarlyVsLate.enabled ? 1 : 0) +
    (config.maxGamesPerTeamPerDay.enabled ? 1 : 0) +
    (config.requireLightsAfter.enabled ? 1 : 0);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = config.softOrder.indexOf(active.id as SchedulerSoftConstraintKey);
    const newIndex = config.softOrder.indexOf(over.id as SchedulerSoftConstraintKey);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange({ ...config, softOrder: arrayMove(config.softOrder, oldIndex, newIndex) });
  };

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <CollapsibleSection
        title="Scheduling Constraints"
        headerExtra={
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={enabledCount === 0 ? 'None enabled' : `${enabledCount} enabled`}
            />
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2">Optimization preferences</Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reorder — higher in the list means higher priority.
            </Typography>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={config.softOrder} strategy={verticalListSortingStrategy}>
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                  {config.softOrder.map((softKey) => (
                    <SortableSoftRow
                      key={softKey}
                      softKey={softKey}
                      config={config}
                      disabled={disabled}
                      onChange={onChange}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2">Hard limits</Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.maxGamesPerTeamPerDay.enabled}
                    onChange={(event) =>
                      onChange({
                        ...config,
                        maxGamesPerTeamPerDay: {
                          ...config.maxGamesPerTeamPerDay,
                          enabled: event.target.checked,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                }
                label="Limit games per team per day"
              />
              {config.maxGamesPerTeamPerDay.enabled && (
                <TextField
                  type="number"
                  size="small"
                  label="Max games/team/day"
                  value={config.maxGamesPerTeamPerDay.value}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      maxGamesPerTeamPerDay: {
                        ...config.maxGamesPerTeamPerDay,
                        value: Math.max(
                          1,
                          clampNonNegativeInt(
                            event.target.value,
                            config.maxGamesPerTeamPerDay.value,
                          ),
                        ),
                      },
                    })
                  }
                  inputProps={{ min: 1, step: 1 }}
                  disabled={disabled}
                  sx={{ maxWidth: 200 }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.requireLightsAfter.enabled}
                    onChange={(event) =>
                      onChange({
                        ...config,
                        requireLightsAfter: {
                          ...config.requireLightsAfter,
                          enabled: event.target.checked,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                }
                label="Require lights after a set hour"
              />
              {config.requireLightsAfter.enabled && (
                <TextField
                  type="number"
                  size="small"
                  label="Start hour (0–23)"
                  value={config.requireLightsAfter.startHourLocal}
                  onChange={(event) => {
                    const next = clampNonNegativeInt(
                      event.target.value,
                      config.requireLightsAfter.startHourLocal,
                    );
                    onChange({
                      ...config,
                      requireLightsAfter: {
                        ...config.requireLightsAfter,
                        startHourLocal: Math.min(23, next),
                      },
                    });
                  }}
                  inputProps={{ min: 0, max: 23, step: 1 }}
                  disabled={disabled}
                  sx={{ maxWidth: 200 }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>
    </>
  );
};
