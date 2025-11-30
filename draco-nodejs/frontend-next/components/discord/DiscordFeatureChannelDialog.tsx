'use client';

import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DiscordFeatureSyncChannelType, DiscordGuildChannelType } from '@draco/shared-schemas';

const CHANNEL_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

const BaseSchema = z.object({
  mode: z.enum(['existing', 'autoCreate']),
  discordChannelId: z.string().optional(),
  newChannelName: z.string().trim().optional(),
});

type FormValues = z.infer<typeof BaseSchema>;

const createSchema = (channels: DiscordGuildChannelType[]) =>
  BaseSchema.superRefine((values, ctx) => {
    if (values.mode === 'existing') {
      if (!values.discordChannelId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discordChannelId'],
          message: 'Select a Discord channel.',
        });
        return;
      }
      const exists = channels.some((channel) => channel.id === values.discordChannelId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discordChannelId'],
          message: 'Selected channel is no longer available.',
        });
      }
      return;
    }

    const channelName = values.newChannelName?.trim() ?? '';
    if (!channelName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newChannelName'],
        message: 'Channel name is required.',
      });
      return;
    }
    if (channelName.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newChannelName'],
        message: 'Channel name cannot exceed 100 characters.',
      });
      return;
    }
    if (!CHANNEL_NAME_PATTERN.test(channelName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newChannelName'],
        message:
          'Only lowercase letters, numbers, hyphens, and underscores are allowed, and the name must start with a letter or number.',
      });
    }
  });

interface DiscordFeatureChannelDialogProps {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  error?: string | null;
  channels: DiscordGuildChannelType[];
  onClose: () => void;
  onSubmit: (payload: DiscordFeatureSyncChannelType) => Promise<void> | void;
}

const DEFAULT_VALUES: FormValues = {
  mode: 'existing',
  discordChannelId: '',
  newChannelName: '',
};

const DiscordFeatureChannelDialog: React.FC<DiscordFeatureChannelDialogProps> = ({
  open,
  loading,
  submitting,
  error,
  channels,
  onClose,
  onSubmit,
}) => {
  const schema = React.useMemo(() => createSchema(channels), [channels]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const selectedMode = useWatch({ control, name: 'mode' });

  React.useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const handleDialogClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const sortedChannels = React.useMemo(
    () => [...channels].sort((a, b) => a.name.localeCompare(b.name)),
    [channels],
  );

  const onSubmitForm = handleSubmit(async (values) => {
    let payload: DiscordFeatureSyncChannelType;
    if (values.mode === 'existing') {
      const selected = channels.find((channel) => channel.id === values.discordChannelId);
      payload = {
        mode: 'existing',
        discordChannelId: selected?.id ?? '',
        discordChannelName: selected?.name ?? '',
        channelType: selected?.type ?? undefined,
      };
    } else {
      payload = {
        mode: 'autoCreate',
        newChannelName: (values.newChannelName ?? '').trim().toLowerCase(),
        newChannelType: 'text',
      };
    }
    await onSubmit(payload);
  });

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Configure Discord Channel</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl component="fieldset">
            <FormLabel component="legend">Channel Source</FormLabel>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel value="existing" control={<Radio />} label="Use existing" />
                  <FormControlLabel value="autoCreate" control={<Radio />} label="Auto-create" />
                </RadioGroup>
              )}
            />
          </FormControl>

          {selectedMode === 'existing' ? (
            <Controller
              control={control}
              name="discordChannelId"
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Discord Channel"
                  disabled={loading}
                  error={Boolean(errors.discordChannelId)}
                  helperText={
                    errors.discordChannelId?.message ??
                    (sortedChannels.length ? 'Select an existing text channel.' : '')
                  }
                >
                  {loading ? (
                    <MenuItem value="" disabled>
                      Loading channels…
                    </MenuItem>
                  ) : sortedChannels.length === 0 ? (
                    <MenuItem value="" disabled>
                      No channels available.
                    </MenuItem>
                  ) : (
                    sortedChannels
                      .filter((channel) => !channel.type || channel.type === 'text')
                      .map((channel) => (
                        <MenuItem key={channel.id} value={channel.id}>
                          {channel.name}
                          {channel.type ? ` (${channel.type})` : ''}
                        </MenuItem>
                      ))
                  )}
                </TextField>
              )}
            />
          ) : (
            <>
              <Controller
                control={control}
                name="newChannelName"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Channel Name"
                    value={field.value ?? ''}
                    error={Boolean(errors.newChannelName)}
                    helperText={
                      errors.newChannelName?.message ??
                      'Use lowercase letters, numbers, hyphens, or underscores only.'
                    }
                  />
                )}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmitForm} variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscordFeatureChannelDialog;
