'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import type { DiscordChannelMappingType, DiscordGuildChannelType } from '@draco/shared-schemas';
import {
  DiscordChannelCreateTypeEnum,
  DiscordChannelMappingCreateSchema,
} from '@draco/shared-schemas';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';

interface AddDiscordChannelMappingDialogProps {
  open: boolean;
  accountId: string;
  availableChannels: DiscordGuildChannelType[];
  onClose: () => void;
  onSuccess: (mapping: DiscordChannelMappingType) => void;
}

type ChannelMappingFormValues = z.infer<typeof DiscordChannelMappingCreateSchema>;

const CHANNEL_CREATE_MODE_OPTIONS = [
  { value: 'existing', label: 'Use existing channel' },
  { value: 'autoCreate', label: 'Create new channel' },
] as const;

const CHANNEL_CREATE_TYPE_OPTIONS = [
  { value: 'text', label: 'Text channel' },
  { value: 'announcement', label: 'Announcement channel' },
] satisfies { value: z.infer<typeof DiscordChannelCreateTypeEnum>; label: string }[];

const defaultValues: ChannelMappingFormValues = {
  mode: 'existing',
  discordChannelId: '',
  discordChannelName: '',
  channelType: undefined,
  label: '',
  scope: 'account',
} as ChannelMappingFormValues;

const AddDiscordChannelMappingDialog: React.FC<AddDiscordChannelMappingDialogProps> = ({
  open,
  accountId,
  availableChannels,
  onClose,
  onSuccess,
}) => {
  const { createChannelMapping } = useAccountDiscordAdmin();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const channelMappingResolver = useMemo(
    () => zodResolver(DiscordChannelMappingCreateSchema) as Resolver<ChannelMappingFormValues>,
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChannelMappingFormValues>({
    resolver: channelMappingResolver,
    defaultValues,
    mode: 'onSubmit',
  });

  const fieldErrors = errors as Partial<Record<string, { message?: string }>>;

  const selectedMode = watch('mode');
  const selectedChannelId = watch('discordChannelId');

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setSubmitError(null);
    }
  }, [open, reset]);

  useEffect(() => {
    if (selectedMode !== 'existing') {
      setValue('discordChannelName', '');
      setValue('channelType', undefined);
      return;
    }
    if (!selectedChannelId) {
      setValue('discordChannelName', '');
      setValue('channelType', undefined);
      return;
    }
    const selected = availableChannels.find((channel) => channel.id === selectedChannelId);
    setValue('discordChannelName', selected?.name ?? '');
    setValue('channelType', selected?.type ?? undefined);
  }, [availableChannels, selectedChannelId, selectedMode, setValue]);

  const handleModeChange = useCallback(
    (nextMode: ChannelMappingFormValues['mode']) => {
      setValue('mode', nextMode);
      setSubmitError(null);
      if (nextMode === 'autoCreate') {
        setValue('discordChannelId', '');
        setValue('discordChannelName', '');
        setValue('channelType', undefined);
      } else {
        setValue('newChannelName', '');
        setValue('newChannelType', 'text');
      }
    },
    [setValue],
  );

  const handleDialogClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const payload = DiscordChannelMappingCreateSchema.parse(values);
      const mapping = await createChannelMapping(accountId, payload);
      onSuccess(mapping);
      reset(defaultValues);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add the channel mapping.';
      setSubmitError(message);
    }
  });

  const sortedChannels = useMemo(
    () => [...availableChannels].sort((a, b) => a.name.localeCompare(b.name)),
    [availableChannels],
  );

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Channel Mapping</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <input type="hidden" {...register('mode')} />
          <input type="hidden" {...register('discordChannelName')} />
          <input type="hidden" {...register('channelType')} />
          <input type="hidden" {...register('scope')} value="account" readOnly />
          <FormControl component="fieldset">
            <FormLabel component="legend">Channel source</FormLabel>
            <RadioGroup
              row
              value={selectedMode}
              onChange={(event) =>
                handleModeChange(event.target.value as ChannelMappingFormValues['mode'])
              }
            >
              {CHANNEL_CREATE_MODE_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {selectedMode === 'existing' ? (
            <Controller
              name="discordChannelId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Discord Channel"
                  value={field.value ?? ''}
                  error={Boolean(fieldErrors.discordChannelId)}
                  helperText={
                    fieldErrors.discordChannelId?.message ??
                    'Select a text or announcement channel.'
                  }
                >
                  {sortedChannels.map((channel) => (
                    <MenuItem key={channel.id} value={channel.id}>
                      {channel.name}
                      {channel.type ? ` (${channel.type})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          ) : (
            <>
              <Controller
                name="newChannelName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="New Channel Name"
                    value={field.value ?? ''}
                    error={Boolean(fieldErrors.newChannelName)}
                    helperText={
                      fieldErrors.newChannelName?.message ??
                      'Draco will create this channel automatically.'
                    }
                  />
                )}
              />
              <Controller
                name="newChannelType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Channel Type"
                    value={field.value ?? 'text'}
                    error={Boolean(fieldErrors.newChannelType)}
                    helperText={fieldErrors.newChannelType?.message}
                  >
                    {CHANNEL_CREATE_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </>
          )}
          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Friendly Label"
                value={field.value ?? ''}
                error={Boolean(fieldErrors.label)}
                helperText={fieldErrors.label?.message ?? 'Optional label shown in Draco UI.'}
              />
            )}
          />
          <Alert severity="info">
            Each mapping currently applies account-wide. Season and team-specific channels will be
            configured automatically when those workflows launch.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Mapping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDiscordChannelMappingDialog;
