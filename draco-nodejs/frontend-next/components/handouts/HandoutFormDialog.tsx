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
import RichTextEditor from '../email/RichTextEditor';
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
  const { createHandout, updateHandout, loading, error, clearError } = useHandoutOperations(scope);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HandoutFormValues>({
    resolver: zodResolver(HandoutFormSchema),
    defaultValues,
  });

  const editorRef = React.useRef<{
    getCurrentContent: () => string;
    getTextContent: () => string;
    insertText: (text: string) => void;
  } | null>(null);

  const fileValue = watch('file');
  const descriptionValue = watch('description');
  const [plainTextLength, setPlainTextLength] = React.useState<number>(0);
  const [editorKey, setEditorKey] = React.useState<number>(0);

  const computePlainTextLength = React.useCallback<(html: string) => number>((html) => {
    return sanitizeDisplayText(html ?? '').trim().length;
  }, []);

  React.useEffect(() => {
    if (!open) {
      reset(defaultValues);
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
    setPlainTextLength(computePlainTextLength(sanitizedDescription));
    setEditorKey((key) => key + 1);
    setLocalError(null);
    clearError();
  }, [open, mode, initialHandout, reset, clearError, computePlainTextLength]);

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

    const sanitizedHtml = sanitizeHandoutContent(editorRef.current.getCurrentContent());
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
                initialValue={descriptionValue ?? ''}
                onChange={(html) => {
                  const sanitizedHtml = sanitizeHandoutContent(html);
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
