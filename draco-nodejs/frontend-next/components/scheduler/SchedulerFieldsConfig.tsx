'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  Paper,
  Popover,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { FieldScheduleConfigType, FieldScheduleConfigUpsertType } from '@draco/shared-schemas';
import { useAuth } from '../../context/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import { FieldScheduleConfigService } from '../../services/fieldScheduleConfigService';
import {
  buildDraftClosedDates,
  buildDraftDays,
  configToUpsert,
  DEFAULT_SCHEDULER_GAME_LENGTH_MINUTES,
  formatClosedDateLabel,
  formatMinutesAsHoursMinutes,
  groupOpenHoursLabel,
  isMissingOpenHours,
} from './schedulerFieldConfigHelpers';
import { SchedulerFieldOpenHoursPopover } from './SchedulerFieldOpenHoursPopover';
import { SchedulerFieldClosedDatesPopover } from './SchedulerFieldClosedDatesPopover';
import { SchedulerFieldGameLengthPopover } from './SchedulerFieldGameLengthPopover';
import { SchedulerFieldValuePopover } from './SchedulerFieldValuePopover';

export * from './schedulerFieldConfigHelpers';

type FieldOption = { id: string; name: string };

type PopoverKind = 'hours' | 'length' | 'buffer' | 'closed';

interface PopoverState {
  fieldId: string;
  kind: PopoverKind;
  anchorEl: HTMLElement;
}

interface SchedulerFieldsConfigProps {
  accountId: string;
  fields: FieldOption[];
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

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

  const [configs, setConfigs] = useState<Map<string, FieldScheduleConfigType>>(new Map());
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);

  useEffect(() => {
    if (fields.length === 0) return;

    const controller = new AbortController();

    const loadAll = async () => {
      setLoading(true);
      const service = new FieldScheduleConfigService(token, apiClient);

      try {
        const loaded = await service.listFieldScheduleConfigs(accountId, controller.signal);
        if (controller.signal.aborted) return;
        const next = new Map<string, FieldScheduleConfigType>();
        for (const config of loaded) {
          next.set(config.fieldId, config);
        }
        setConfigs(next);
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

  const closePopover = () => setPopover(null);

  const persist = async (fieldId: string, overrides: Partial<FieldScheduleConfigUpsertType>) => {
    const config = configs.get(fieldId);
    if (!config) return;

    const service = serviceRef.current ?? new FieldScheduleConfigService(token, apiClient);
    const body: FieldScheduleConfigUpsertType = { ...configToUpsert(config), ...overrides };

    try {
      setSavingId(fieldId);
      const updated = await service.replaceFieldScheduleConfig(accountId, fieldId, body);
      setConfigs((prev) => {
        const next = new Map(prev);
        next.set(fieldId, updated);
        return next;
      });
      setPopover(null);
      setSuccess('Field schedule updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field schedule');
    } finally {
      setSavingId(null);
    }
  };

  const openPopover = (
    event: React.MouseEvent<HTMLElement>,
    fieldId: string,
    kind: PopoverKind,
  ) => {
    setPopover({ fieldId, kind, anchorEl: event.currentTarget });
  };

  const rows = fields.filter((field) => {
    const config = configs.get(field.id);
    if (!config) return false;
    return showEnabledOnly ? config.scheduleEnabled : true;
  });

  const enabledCount = fields.reduce(
    (count, field) => (configs.get(field.id)?.scheduleEnabled ? count + 1 : count),
    0,
  );

  const errorCount = fields.reduce((count, field) => {
    const config = configs.get(field.id);
    return config && isMissingOpenHours(config) ? count + 1 : count;
  }, 0);

  const availableLabel =
    errorCount > 0
      ? `${enabledCount} of ${fields.length} available (${errorCount} error${
          errorCount === 1 ? '' : 's'
        })`
      : `${enabledCount} of ${fields.length} available`;

  const popoverConfig = popover ? (configs.get(popover.fieldId) ?? null) : null;
  const popoverSaving = popover ? savingId === popover.fieldId : false;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        component="button"
        type="button"
        onClick={() => setSectionOpen((open) => !open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          p: 0,
          color: 'inherit',
        }}
        aria-expanded={sectionOpen}
      >
        {sectionOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Fields
        </Typography>
        {loading ? (
          <CircularProgress size={14} />
        ) : (
          <Chip size="small" color={errorCount > 0 ? 'error' : 'default'} label={availableLabel} />
        )}
      </Box>

      <Collapse in={sectionOpen} unmountOnExit>
        <Box sx={{ pt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showEnabledOnly}
                onChange={(e) => setShowEnabledOnly(e.target.checked)}
              />
            }
            label="Show available only"
          />

          {rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {fields.length === 0
                ? 'No fields available. Add fields to configure schedule availability.'
                : 'No fields match the current filter.'}
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell align="center">Available</TableCell>
                    <TableCell>Open Hours</TableCell>
                    <TableCell align="center">Game Length</TableCell>
                    <TableCell align="center">Buffer</TableCell>
                    <TableCell align="center">Blackout Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((field) => {
                    const config = configs.get(field.id)!;
                    const saving = savingId === field.id;
                    const hoursLabel = groupOpenHoursLabel(config.openHours);
                    const missingOpenHours = isMissingOpenHours(config);
                    const closedCount = config.closedDates.length;
                    return (
                      <TableRow key={field.id} hover>
                        <TableCell>{field.name}</TableCell>
                        <TableCell align="center">
                          <Switch
                            size="small"
                            checked={config.scheduleEnabled}
                            disabled={saving}
                            onChange={(e) =>
                              void persist(field.id, { scheduleEnabled: e.target.checked })
                            }
                            slotProps={{
                              input: { 'aria-label': `${field.name} available for scheduling` },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Button
                              size="small"
                              color={
                                missingOpenHours ? 'error' : hoursLabel ? 'primary' : 'inherit'
                              }
                              disabled={saving}
                              onClick={(e) => openPopover(e, field.id, 'hours')}
                              aria-label={`Open hours for ${field.name}`}
                              sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                            >
                              {hoursLabel || 'Set hours'}
                            </Button>
                            {missingOpenHours && (
                              <Alert
                                severity="error"
                                sx={{
                                  py: 0,
                                  px: 1,
                                  '& .MuiAlert-message': { py: 0.5 },
                                  '& .MuiAlert-icon': { py: 0.5 },
                                }}
                              >
                                Set open hours or this field is skipped when scheduling.
                              </Alert>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            color="inherit"
                            disabled={saving}
                            onClick={(e) => openPopover(e, field.id, 'length')}
                            aria-label={`Game length for ${field.name}`}
                            sx={{ textTransform: 'none' }}
                          >
                            {config.gameLengthMinutes != null
                              ? formatMinutesAsHoursMinutes(config.gameLengthMinutes)
                              : `Default (${formatMinutesAsHoursMinutes(
                                  DEFAULT_SCHEDULER_GAME_LENGTH_MINUTES,
                                )})`}
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            color="inherit"
                            disabled={saving}
                            onClick={(e) => openPopover(e, field.id, 'buffer')}
                            aria-label={`Buffer for ${field.name}`}
                            sx={{ textTransform: 'none' }}
                          >
                            {`${config.bufferMinutes}m`}
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              closedCount > 0
                                ? config.closedDates.map(formatClosedDateLabel).join(', ')
                                : ''
                            }
                          >
                            <Button
                              size="small"
                              color={closedCount > 0 ? 'primary' : 'inherit'}
                              disabled={saving}
                              onClick={(e) => openPopover(e, field.id, 'closed')}
                              aria-label={`Blackout dates for ${field.name}`}
                              sx={{ textTransform: 'none' }}
                            >
                              {closedCount > 0 ? `${closedCount}` : 'None'}
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Collapse>

      <Popover
        open={Boolean(popover && popoverConfig)}
        anchorEl={popover?.anchorEl ?? null}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {popover && popoverConfig && popover.kind === 'hours' && (
          <SchedulerFieldOpenHoursPopover
            initialDays={buildDraftDays(popoverConfig.openHours)}
            saving={popoverSaving}
            onSave={(openHours) => void persist(popover.fieldId, { openHours })}
            onCancel={closePopover}
          />
        )}
        {popover && popoverConfig && popover.kind === 'closed' && (
          <SchedulerFieldClosedDatesPopover
            initialClosedDates={buildDraftClosedDates(popoverConfig.closedDates)}
            saving={popoverSaving}
            onSave={(closedDates) => void persist(popover.fieldId, { closedDates })}
            onCancel={closePopover}
          />
        )}
        {popover && popoverConfig && popover.kind === 'length' && (
          <SchedulerFieldGameLengthPopover
            initialMinutes={popoverConfig.gameLengthMinutes ?? null}
            saving={popoverSaving}
            onSave={(minutes) => void persist(popover.fieldId, { gameLengthMinutes: minutes })}
            onCancel={closePopover}
          />
        )}
        {popover && popoverConfig && popover.kind === 'buffer' && (
          <SchedulerFieldValuePopover
            title="Buffer"
            label="Minutes"
            min={0}
            initialValue={String(popoverConfig.bufferMinutes)}
            saving={popoverSaving}
            onSave={(raw) => {
              const trimmed = raw.trim();
              void persist(popover.fieldId, {
                bufferMinutes: trimmed.length > 0 ? Number(trimmed) : 0,
              });
            }}
            onCancel={closePopover}
          />
        )}
      </Popover>
    </Box>
  );
};
