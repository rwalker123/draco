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
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HandoutType,
  UpsertHandoutSchema,
  HANDOUT_DESCRIPTION_MAX_LENGTH,
} from '@draco/shared-schemas';
import { HandoutInput } from '../../services/handoutService';
import { HandoutScope, useHandoutOperations } from '../../hooks/useHandoutOperations';
import RichTextEditor, { type RichTextEditorHandle } from '../email/RichTextEditor';
import { sanitizeDisplayText, sanitizeHandoutContent } from '../../utils/sanitization';

const HandoutFormSchema = UpsertHandoutSchema.extend({
  file: z.instanceof(File).optional().nullable(),
}).superRefine((data, ctx) => {
  const plainText = sanitizeDisplayText(data.description ?? '').trim();
  if (!plainText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['description'],
      message: 'Description is required',
    });
  }
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
  const isTeamScope = scope.type === 'team';

  const teamId = scope.type === 'team' ? scope.teamId : null;
  const stableScope = React.useMemo<HandoutScope>(() => {
    if (isTeamScope) {
      return {
        type: 'team',
        accountId: scope.accountId,
        teamId: teamId as string,
      };
    }

    return {
      type: 'account',
      accountId: scope.accountId,
    };
  }, [isTeamScope, scope.accountId, teamId]);

  const { createHandout, updateHandout, loading, error, clearError } =
    useHandoutOperations(stableScope);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<HandoutFormValues>({
    resolver: zodResolver(HandoutFormSchema),
    defaultValues,
  });

  const editorRef = React.useRef<RichTextEditorHandle | null>(null);

  const fileValue = useWatch({ control, name: 'file' });
  const [editorInitialValue, setEditorInitialValue] = React.useState<string>('');
  const [plainTextLength, setPlainTextLength] = React.useState<number>(0);
  const [editorKey, setEditorKey] = React.useState<number>(0);

  const computePlainTextLength = React.useCallback<(html: string) => number>((html) => {
    return sanitizeDisplayText(html ?? '').trim().length;
  }, []);

  React.useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setEditorInitialValue('');
      setPlainTextLength(0);
      setLocalError(null);
      clearError();
      return;
    }

    const baseDescription = mode === 'edit' && initialHandout ? initialHandout.description : '';
    const sanitizedDescription = sanitizeHandoutContent(baseDescription ?? '');
    reset({
      description: sanitizedDescription,
      file: null,
    });
    setEditorInitialValue(getValues('description'));
    setPlainTextLength(computePlainTextLength(sanitizedDescription));
    setEditorKey((key) => key + 1);
    setLocalError(null);
    clearError();
  }, [open, mode, initialHandout, reset, clearError, computePlainTextLength, getValues]);

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

  const syncEditorContent = React.useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const sanitizedHtml = editorRef.current.getSanitizedContent();
    setValue('description', sanitizedHtml, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPlainTextLength(computePlainTextLength(sanitizedHtml));
  }, [setValue, computePlainTextLength]);

  const submitHandler = handleSubmit(async (values) => {
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

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    syncEditorContent();
    void submitHandler(event);
  };

  const descriptionError = errors.description?.message as string | undefined;
  const remainingCharacters = Math.max(0, HANDOUT_DESCRIPTION_MAX_LENGTH - plainTextLength);
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
      <Box component="form" noValidate onSubmit={handleFormSubmit}>
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
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <RichTextEditor
                key={editorKey}
                ref={editorRef}
                initialValue={editorInitialValue}
                onChange={(sanitizedHtml) => {
                  setPlainTextLength(computePlainTextLength(sanitizedHtml));
                }}
                minHeight={180}
                placeholder="Describe the handout..."
                disabled={isSubmitting || loading}
                error={Boolean(descriptionError)}
              />
              <Typography
                variant="caption"
                color={descriptionError ? 'error.main' : 'text.secondary'}
              >
                {descriptionError ?? `${remainingCharacters} characters remaining`}
              </Typography>
            </Stack>
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
