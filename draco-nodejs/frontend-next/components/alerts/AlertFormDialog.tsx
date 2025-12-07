'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ALERT_MESSAGE_MAX_LENGTH,
  UpsertAlertSchema,
  type AlertType,
  type UpsertAlertType,
} from '@draco/shared-schemas';

type AlertFormDialogProps = {
  open: boolean;
  initialAlert?: AlertType;
  onClose: () => void;
  onSubmit: (values: UpsertAlertType) => Promise<void>;
};

const AlertFormDialog: React.FC<AlertFormDialogProps> = ({
  open,
  initialAlert,
  onClose,
  onSubmit,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  type AlertFormValues = z.input<typeof UpsertAlertSchema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormValues>({
    resolver: zodResolver(UpsertAlertSchema),
    defaultValues: {
      message: initialAlert?.message ?? '',
      isActive: initialAlert?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      message: initialAlert?.message ?? '',
      isActive: initialAlert?.isActive ?? true,
    });
  }, [initialAlert, reset, open]);

  const handleSave = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const payload: UpsertAlertType = {
        message: values.message,
        isActive: values.isActive ?? true,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save alert';
      setSubmitError(message);
    }
  });

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialAlert ? 'Edit Alert' : 'Create Alert'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Alert message"
            multiline
            minRows={2}
            maxRows={6}
            inputProps={{ maxLength: ALERT_MESSAGE_MAX_LENGTH }}
            {...register('message')}
            error={Boolean(errors.message)}
            helperText={
              errors.message?.message ?? `Max ${ALERT_MESSAGE_MAX_LENGTH} characters allowed`
            }
            autoFocus
            fullWidth
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={Boolean(field.value)} />}
                label="Active"
              />
            )}
          />
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSubmitting}>
          {initialAlert ? 'Save Changes' : 'Create Alert'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertFormDialog;
