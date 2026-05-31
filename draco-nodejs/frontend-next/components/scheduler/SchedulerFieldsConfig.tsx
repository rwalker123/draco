'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Chip,
  FormControlLabel,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type {
  FieldClosedDateType,
  FieldClosedDateUpsertType,
  FieldOpenHourType,
  FieldScheduleConfigType,
  FieldScheduleConfigUpsertType,
} from '@draco/shared-schemas';
import { useAuth } from '../../context/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import { FieldScheduleConfigService } from '../../services/fieldScheduleConfigService';
import { DAYS } from '../../utils/daysOfWeekUtils';
import { formatLocalHhmmTo12Hour } from '../../utils/schedulerTimeFormat';
import { SchedulerFieldDayEditor } from './SchedulerFieldDayEditor';

type FieldOption = { id: string; name: string };

interface SchedulerFieldsConfigProps {
  accountId: string;
  fields: FieldOption[];
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

interface FieldConfigState {
  config: FieldScheduleConfigType;
  editing: boolean;
  saving: boolean;
  error: string | null;
  draftDays: DraftDayMap;
  draftGameLength: string;
  draftBuffer: string;
  draftClosedDates: DraftClosedDate[];
}

export type DraftDayMap = Map<number, { open: boolean; start: string; end: string }>;

export interface DraftClosedDate {
  key: string;
  date: string;
  note: string;
}

export const buildDraftDays = (openHours: FieldOpenHourType[]): DraftDayMap => {
  const map: DraftDayMap = new Map();
  for (const day of DAYS) {
    map.set(day.bit, { open: false, start: '09:00', end: '21:00' });
  }
  for (const hour of openHours) {
    map.set(hour.dayOfWeek, { open: true, start: hour.startTimeLocal, end: hour.endTimeLocal });
  }
  return map;
};

export const buildDraftClosedDates = (closedDates: FieldClosedDateType[]): DraftClosedDate[] =>
  closedDates.map((cd, i) => ({
    key: `${cd.id}-${i}`,
    date: cd.date,
    note: cd.note ?? '',
  }));

export const buildOpenHoursPayload = (
  draftDays: DraftDayMap,
): FieldScheduleConfigUpsertType['openHours'] => {
  const result: FieldScheduleConfigUpsertType['openHours'] = [];
  for (const day of DAYS) {
    const entry = draftDays.get(day.bit);
    if (entry?.open) {
      result.push({
        dayOfWeek: day.bit,
        startTimeLocal: entry.start,
        endTimeLocal: entry.end,
      });
    }
  }
  return result;
};

export const buildClosedDatesPayload = (
  draftClosedDates: DraftClosedDate[],
): FieldScheduleConfigUpsertType['closedDates'] =>
  draftClosedDates
    .filter((cd) => cd.date.trim().length > 0)
    .map((cd) => {
      const entry: FieldClosedDateUpsertType = { date: cd.date.trim() };
      if (cd.note.trim().length > 0) {
        entry.note = cd.note.trim();
      }
      return entry;
    });

export const applyQuickSetToDays = (
  current: DraftDayMap,
  bitsToOpen: number[],
  startTime: string,
  endTime: string,
): DraftDayMap => {
  const next = new Map(current);
  const openSet = new Set(bitsToOpen);
  for (const day of DAYS) {
    const existing = next.get(day.bit) ?? { open: false, start: startTime, end: endTime };
    if (openSet.has(day.bit)) {
      next.set(day.bit, { open: true, start: startTime, end: endTime });
    } else {
      next.set(day.bit, { ...existing, open: false });
    }
  }
  return next;
};

export const groupOpenHoursLabel = (openHours: FieldOpenHourType[]): string => {
  if (openHours.length === 0) return 'No open hours';
  const sorted = [...openHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const segments: string[] = [];
  let groupStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const sameTime =
      cur.startTimeLocal === prev.startTimeLocal && cur.endTimeLocal === prev.endTimeLocal;
    const consecutive = cur.dayOfWeek === prev.dayOfWeek + 1;
    if (sameTime && consecutive) {
      prev = cur;
    } else {
      segments.push(buildSegmentLabel(groupStart, prev));
      groupStart = cur;
      prev = cur;
    }
  }
  segments.push(buildSegmentLabel(groupStart, prev));
  return segments.join(' · ');
};

const buildSegmentLabel = (start: FieldOpenHourType, end: FieldOpenHourType): string => {
  const startDayLabel = DAYS.find((d) => d.bit === start.dayOfWeek)?.label ?? '';
  const endDayLabel = DAYS.find((d) => d.bit === end.dayOfWeek)?.label ?? '';
  const dayRange =
    start.dayOfWeek === end.dayOfWeek ? startDayLabel : `${startDayLabel}–${endDayLabel}`;
  const timeRange = `${formatLocalHhmmTo12Hour(start.startTimeLocal)}–${formatLocalHhmmTo12Hour(start.endTimeLocal)}`;
  return `${dayRange} ${timeRange}`;
};

export const SchedulerFieldsConfig: React.FC<SchedulerFieldsConfigProps> = ({
  accountId,
  fields,
  setSuccess,
  setError,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const serviceRef = useRef<FieldScheduleConfigService | null>(null);

  useEffect(() => {
    serviceRef.current = new FieldScheduleConfigService(token, apiClient);
  }, [token, apiClient]);

  const [fieldStates, setFieldStates] = useState<Map<string, FieldConfigState>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fields.length === 0) return;

    const controller = new AbortController();

    const loadAll = async () => {
      setLoading(true);
      const service = new FieldScheduleConfigService(token, apiClient);

      try {
        const configs = await service.listFieldScheduleConfigs(accountId, controller.signal);

        if (controller.signal.aborted) return;

        const next = new Map<string, FieldConfigState>();
        for (const config of configs) {
          next.set(config.fieldId, {
            config,
            editing: false,
            saving: false,
            error: null,
            draftDays: buildDraftDays(config.openHours),
            draftGameLength:
              config.gameLengthMinutes != null ? String(config.gameLengthMinutes) : '',
            draftBuffer: String(config.bufferMinutes),
            draftClosedDates: buildDraftClosedDates(config.closedDates),
          });
        }
        setFieldStates(next);
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load field schedule configs');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAll();

    return () => {
      controller.abort();
    };
  }, [accountId, fields, setError, token, apiClient]);

  const updateFieldState = (fieldId: string, patch: Partial<FieldConfigState>) => {
    setFieldStates((prev) => {
      const existing = prev.get(fieldId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(fieldId, { ...existing, ...patch });
      return next;
    });
  };

  const handleToggleEnabled = async (fieldId: string, checked: boolean) => {
    const state = fieldStates.get(fieldId);
    if (!state) return;

    const service = serviceRef.current ?? new FieldScheduleConfigService(token, apiClient);

    const body: FieldScheduleConfigUpsertType = {
      scheduleEnabled: checked,
      gameLengthMinutes: state.config.gameLengthMinutes ?? null,
      bufferMinutes: state.config.bufferMinutes,
      openHours: state.config.openHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTimeLocal: h.startTimeLocal,
        endTimeLocal: h.endTimeLocal,
      })),
      closedDates: state.config.closedDates.map((cd) => ({
        date: cd.date,
        note: cd.note ?? undefined,
      })),
    };

    try {
      updateFieldState(fieldId, { saving: true, error: null });
      const updated = await service.replaceFieldScheduleConfig(accountId, fieldId, body);
      updateFieldState(fieldId, {
        saving: false,
        config: updated,
        draftDays: buildDraftDays(updated.openHours),
        draftGameLength: updated.gameLengthMinutes != null ? String(updated.gameLengthMinutes) : '',
        draftBuffer: String(updated.bufferMinutes),
        draftClosedDates: buildDraftClosedDates(updated.closedDates),
      });
      setSuccess(`Field schedule ${checked ? 'enabled' : 'disabled'}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update field schedule';
      updateFieldState(fieldId, { saving: false, error: message });
      setError(message);
    }
  };

  const handleSave = async (fieldId: string) => {
    const state = fieldStates.get(fieldId);
    if (!state) return;

    const service = serviceRef.current ?? new FieldScheduleConfigService(token, apiClient);

    const trimmedLength = state.draftGameLength.trim();
    const gameLengthMinutes = trimmedLength.length > 0 ? Number(trimmedLength) : null;
    const bufferMinutes = Number(state.draftBuffer.trim() || '0');

    const body: FieldScheduleConfigUpsertType = {
      scheduleEnabled: state.config.scheduleEnabled,
      gameLengthMinutes,
      bufferMinutes,
      openHours: buildOpenHoursPayload(state.draftDays),
      closedDates: buildClosedDatesPayload(state.draftClosedDates),
    };

    try {
      updateFieldState(fieldId, { saving: true, error: null });
      const updated = await service.replaceFieldScheduleConfig(accountId, fieldId, body);
      updateFieldState(fieldId, {
        saving: false,
        editing: false,
        config: updated,
        draftDays: buildDraftDays(updated.openHours),
        draftGameLength: updated.gameLengthMinutes != null ? String(updated.gameLengthMinutes) : '',
        draftBuffer: String(updated.bufferMinutes),
        draftClosedDates: buildDraftClosedDates(updated.closedDates),
        error: null,
      });
      setSuccess('Field schedule configuration saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save field schedule config';
      updateFieldState(fieldId, { saving: false, error: message });
    }
  };

  const handleCancel = (fieldId: string) => {
    const state = fieldStates.get(fieldId);
    if (!state) return;
    updateFieldState(fieldId, {
      editing: false,
      error: null,
      draftDays: buildDraftDays(state.config.openHours),
      draftGameLength:
        state.config.gameLengthMinutes != null ? String(state.config.gameLengthMinutes) : '',
      draftBuffer: String(state.config.bufferMinutes),
      draftClosedDates: buildDraftClosedDates(state.config.closedDates),
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading field configurations…
        </Typography>
      </Box>
    );
  }

  if (fields.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No fields available. Add fields to configure schedule availability.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Fields
      </Typography>
      {fields.map((field) => {
        const state = fieldStates.get(field.id);
        if (!state) return null;

        const summaryLabel = groupOpenHoursLabel(state.config.openHours);
        const lengthLabel =
          state.config.gameLengthMinutes != null
            ? `${state.config.gameLengthMinutes}min games`
            : 'length not set';
        const bufferLabel = `${state.config.bufferMinutes}min buffer`;

        return (
          <Accordion
            key={field.id}
            expanded={state.editing}
            onChange={(_e, expanded) => {
              if (!expanded) {
                handleCancel(field.id);
              } else {
                updateFieldState(field.id, { editing: true });
              }
            }}
            disableGutters
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flex: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.config.scheduleEnabled}
                      disabled={state.saving}
                      onChange={(e) => {
                        e.stopPropagation();
                        void handleToggleEnabled(field.id, e.target.checked);
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {field.name}
                    </Typography>
                  }
                  sx={{ mr: 0 }}
                />
                {state.saving && <CircularProgress size={14} />}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip label={summaryLabel} size="small" variant="outlined" />
                  <Chip label={lengthLabel} size="small" variant="outlined" />
                  <Chip label={bufferLabel} size="small" variant="outlined" />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {state.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {state.error}
                </Alert>
              )}
              <SchedulerFieldDayEditor
                draftDays={state.draftDays}
                draftGameLength={state.draftGameLength}
                draftBuffer={state.draftBuffer}
                draftClosedDates={state.draftClosedDates}
                saving={state.saving}
                onDraftDaysChange={(next) => updateFieldState(field.id, { draftDays: next })}
                onDraftGameLengthChange={(v) => updateFieldState(field.id, { draftGameLength: v })}
                onDraftBufferChange={(v) => updateFieldState(field.id, { draftBuffer: v })}
                onDraftClosedDatesChange={(next) =>
                  updateFieldState(field.id, { draftClosedDates: next })
                }
                onSave={() => void handleSave(field.id)}
                onCancel={() => handleCancel(field.id)}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};
