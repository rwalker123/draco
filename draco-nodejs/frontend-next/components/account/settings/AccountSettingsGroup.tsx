'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AccountSettingKey,
  AccountSettingState,
  AccountSettingValueTypeEnum,
} from '@draco/shared-schemas';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

export interface AccountSettingsGroupProps {
  title: string;
  settings: AccountSettingState[];
  canManage: boolean;
  updatingKey: AccountSettingKey | null;
  onUpdate: (key: AccountSettingKey, value: boolean | number) => Promise<void>;
}

export function AccountSettingsGroup({
  title,
  settings,
  canManage,
  updatingKey,
  onUpdate,
}: AccountSettingsGroupProps) {
  const sortedSettings = useMemo(
    () =>
      [...settings].sort(
        (a, b) =>
          a.definition.sortOrder - b.definition.sortOrder ||
          a.definition.key.localeCompare(b.definition.key),
      ),
    [settings],
  );

  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }} color="text.primary">
        {title}
      </Typography>

      <Stack spacing={2.5}>
        {sortedSettings.map((setting) => (
          <AccountSettingRow
            key={setting.definition.key}
            setting={setting}
            canManage={canManage}
            isUpdating={updatingKey === setting.definition.key}
            onUpdate={onUpdate}
          />
        ))}
      </Stack>
    </Paper>
  );
}

interface AccountSettingRowProps {
  setting: AccountSettingState;
  canManage: boolean;
  isUpdating: boolean;
  onUpdate: (key: AccountSettingKey, value: boolean | number) => Promise<void>;
}

function AccountSettingRow({ setting, canManage, isUpdating, onUpdate }: AccountSettingRowProps) {
  const { definition, value, isDefault, isLocked, lockedReason } = setting;
  const disabled = !canManage || isLocked;
  const [localError, setLocalError] = useState<string | null>(null);
  const [numericDraft, setNumericDraft] = useState<string>(() =>
    definition.valueType === AccountSettingValueTypeEnum.enum.number ? String(value) : '',
  );

  useEffect(() => {
    if (definition.valueType === AccountSettingValueTypeEnum.enum.number) {
      setNumericDraft(String(value));
      setLocalError(null);
    }
  }, [definition.valueType, value]);

  const handleBooleanToggle = async (nextValue: boolean) => {
    setLocalError(null);
    try {
      await onUpdate(definition.key, nextValue);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to update ${definition.label}`;
      setLocalError(message);
    }
  };

  const handleNumberSave = async () => {
    const parsedValue = Number(numericDraft);

    if (!Number.isFinite(parsedValue)) {
      setLocalError('Enter a valid number.');
      return;
    }

    if (!Number.isInteger(parsedValue)) {
      setLocalError('Enter a whole number.');
      return;
    }

    const min = definition.valueRange?.min;
    const max = definition.valueRange?.max;

    if (typeof min === 'number' && parsedValue < min) {
      setLocalError(`Value must be at least ${min}.`);
      return;
    }

    if (typeof max === 'number' && parsedValue > max) {
      setLocalError(`Value must be at most ${max}.`);
      return;
    }

    setLocalError(null);

    try {
      await onUpdate(definition.key, parsedValue);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to update ${definition.label}`;
      setLocalError(message);
    }
  };

  const renderControl = () => {
    if (definition.valueType === AccountSettingValueTypeEnum.enum.number) {
      const min = definition.valueRange?.min;
      const max = definition.valueRange?.max;
      const hasChanges = numericDraft !== String(value);

      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            value={numericDraft}
            disabled={disabled}
            onChange={(event) => setNumericDraft(event.target.value)}
            inputProps={{
              min: typeof min === 'number' ? min : undefined,
              max: typeof max === 'number' ? max : undefined,
            }}
            sx={{ width: 140 }}
            aria-label={`${definition.label} value`}
          />
          <Button
            variant="contained"
            onClick={handleNumberSave}
            disabled={disabled || !hasChanges || isUpdating}
          >
            {isUpdating ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} color="inherit" />
                <span>Saving…</span>
              </Stack>
            ) : (
              'Save'
            )}
          </Button>
        </Stack>
      );
    }

    return (
      <FormControlLabel
        control={
          <Switch
            color="primary"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(event) => handleBooleanToggle(event.target.checked)}
            inputProps={{ 'aria-label': definition.label }}
          />
        }
        label=""
        sx={{ ml: 0 }}
      />
    );
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" color="text.primary">
              {definition.label}
            </Typography>
            {isDefault && (
              <Chip
                label="Default"
                size="small"
                variant="outlined"
                sx={{ textTransform: 'uppercase' }}
              />
            )}
            {isLocked && (
              <Tooltip title={lockedReason ?? 'Setting is locked'}>
                <Chip label="Locked" size="small" color="warning" variant="outlined" />
              </Tooltip>
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {definition.description}
          </Typography>
          {definition.valueType === AccountSettingValueTypeEnum.enum.number &&
            (definition.valueRange?.min || definition.valueRange?.max) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {`Allowed range: ${definition.valueRange?.min ?? '−∞'} to ${
                  definition.valueRange?.max ?? '∞'
                }`}
              </Typography>
            )}
          {lockedReason && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
              {lockedReason}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexShrink: 0 }}>{renderControl()}</Box>
      </Stack>
      {localError && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {localError}
        </Alert>
      )}
    </Box>
  );
}
