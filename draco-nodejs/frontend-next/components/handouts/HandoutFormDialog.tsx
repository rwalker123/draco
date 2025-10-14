'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HandoutType,
  UpsertHandoutSchema,
  HANDOUT_DESCRIPTION_MAX_LENGTH,
} from '@draco/shared-schemas';
import { HandoutInput } from '../../services/handoutService';
import { HandoutScope, useHandoutOperations } from '../../hooks/useHandoutOperations';

const HandoutFormSchema = UpsertHandoutSchema.extend({
  file: z.instanceof(File).optional().nullable(),
});

type HandoutFormValues = z.infer<typeof HandoutFormSchema>;

interface HandoutFormDialogProps {
  open: boolean;
  onClose: () => void;
  scope: HandoutScope;
  mode: 'create' | 'edit';
  initialHandout?: HandoutType | null;
  onSuccess?: (result: { handout: HandoutType; message: string }) => void;
  onError?: (message: string) => void;
}

const defaultValues: HandoutFormValues = {
  description: '',
  file: null,
};

const HandoutFormDialog: React.FC<HandoutFormDialogProps> = ({
  open,
  onClose,
  scope,
  mode,
  initialHandout,
  onSuccess,
  onError,
}) => {
  const { createHandout, updateHandout, loading, error, clearError } = useHandoutOperations(scope);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HandoutFormValues>({
    resolver: zodResolver(HandoutFormSchema),
    defaultValues,
  });

  const fileValue = watch('file');

  React.useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setLocalError(null);
      clearError();
      return;
    }

    if (mode === 'edit' && initialHandout) {
      reset({
        description: initialHandout.description,
        file: null,
      });
    } else {
      reset(defaultValues);
    }
    setLocalError(null);
    clearError();
  }, [open, mode, initialHandout, reset, clearError]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setValue('file', file, { shouldDirty: true, shouldValidate: false });
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDialogClose = () => {
    onClose();
    setLocalError(null);
    clearError();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setLocalError(null);
      clearError();

      if (mode === 'create' && !values.file) {
        setLocalError('Please select a file to upload.');
        return;
      }

      const payload: HandoutInput = {
        description: values.description,
        file: values.file ?? undefined,
      };

      const handout =
        mode === 'create'
          ? await createHandout(payload)
          : await updateHandout(initialHandout!.id, payload);

      onSuccess?.({
        handout,
        message:
          mode === 'create' ? 'Handout uploaded successfully' : 'Handout updated successfully',
      });
      handleDialogClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save handout';
      setLocalError(message);
      onError?.(message);
    }
  });

  const descriptionError = errors.description?.message as string | undefined;
  const descriptionValue = watch('description') ?? '';
  const remainingCharacters = Math.max(0, HANDOUT_DESCRIPTION_MAX_LENGTH - descriptionValue.length);
  const fileLabel = (() => {
    if (fileValue instanceof File) {
      return fileValue.name;
    }
    if (mode === 'edit' && initialHandout?.fileName) {
      return `Current file: ${initialHandout.fileName}`;
    }
    return 'No file selected';
  })();

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Add Handout' : 'Edit Handout'}</DialogTitle>
      <Box component="form" noValidate onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            {(localError || error) && (
              <Alert
                severity="error"
                onClose={() => {
                  setLocalError(null);
                  clearError();
                }}
              >
                {localError || error}
              </Alert>
            )}
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={Boolean(descriptionError)}
              helperText={descriptionError ?? `${remainingCharacters} characters remaining`}
            />
            <Stack spacing={1}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={isSubmitting || loading}
              >
                {mode === 'edit' ? 'Choose Replacement File' : 'Choose File'}
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {fileLabel}
              </Typography>
              {mode === 'edit' && (
                <Typography variant="caption" color="text.secondary">
                  Leave the file field empty to keep the current document.
                </Typography>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || loading}>
            {mode === 'create' ? 'Upload Handout' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default HandoutFormDialog;
