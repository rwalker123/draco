import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpsertAnnouncementType,
  AnnouncementType,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
  ANNOUNCEMENT_BODY_MAX_LENGTH,
} from '@draco/shared-schemas';
import RichTextEditor from '../email/RichTextEditor';
import { sanitizeDisplayText, sanitizeRichContent } from '../../utils/sanitization';

const AnnouncementFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(
      ANNOUNCEMENT_TITLE_MAX_LENGTH,
      `Title must be ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters or fewer`,
    ),
  body: z
    .string()
    .trim()
    .min(1, 'Announcement details are required')
    .max(
      ANNOUNCEMENT_BODY_MAX_LENGTH,
      `Announcement must be ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters or fewer`,
    ),
  publishedAt: z.date(),
  isSpecial: z.boolean().optional().default(false),
});

type AnnouncementFormInput = z.input<typeof AnnouncementFormSchema>;
type AnnouncementFormValues = z.output<typeof AnnouncementFormSchema>;

const createDefaultValues = (): AnnouncementFormInput => ({
  title: '',
  body: '',
  publishedAt: new Date(),
  isSpecial: false,
});

interface AnnouncementFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialAnnouncement?: AnnouncementType | null;
  onClose: () => void;
  onSubmit: (payload: UpsertAnnouncementType) => Promise<void> | void;
  submitting?: boolean;
  submitError?: string | null;
}

const AnnouncementFormDialog: React.FC<AnnouncementFormDialogProps> = ({
  open,
  mode,
  initialAnnouncement,
  onClose,
  onSubmit,
  submitting = false,
  submitError,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormInput, unknown, AnnouncementFormValues>({
    resolver: zodResolver<AnnouncementFormInput, unknown, AnnouncementFormValues>(
      AnnouncementFormSchema,
    ),
    defaultValues: createDefaultValues(),
  });
  const editorRef = React.useRef<{
    getCurrentContent: () => string;
    getTextContent: () => string;
    insertText: (text: string) => void;
  } | null>(null);
  const [editorInitialValue, setEditorInitialValue] = React.useState<string>('');
  const [plainTextLength, setPlainTextLength] = React.useState<number>(0);
  const [editorKey, setEditorKey] = React.useState<number>(0);

  const computePlainTextLength = React.useCallback<(html: string) => number>((html) => {
    return sanitizeDisplayText(html ?? '').trim().length;
  }, []);

  React.useEffect(() => {
    if (!open) {
      reset(createDefaultValues());
      setEditorInitialValue('');
      setPlainTextLength(0);
      setEditorKey((key) => key + 1);
      return;
    }

    if (mode === 'edit' && initialAnnouncement) {
      const publishedAt = new Date(initialAnnouncement.publishedAt);
      setValue('title', initialAnnouncement.title, { shouldDirty: false });
      const sanitizedBody = sanitizeRichContent(initialAnnouncement.body ?? '');
      setValue('body', sanitizedBody, { shouldDirty: false });
      setValue('publishedAt', Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt, {
        shouldDirty: false,
      });
      setValue('isSpecial', initialAnnouncement.isSpecial ?? false, { shouldDirty: false });
      setEditorInitialValue(sanitizedBody);
      setPlainTextLength(computePlainTextLength(sanitizedBody));
      setEditorKey((key) => key + 1);
    } else {
      reset(createDefaultValues());
      setEditorInitialValue('');
      setPlainTextLength(0);
      setEditorKey((key) => key + 1);
    }
  }, [open, mode, initialAnnouncement, reset, setValue, computePlainTextLength]);

  const dialogTitle = mode === 'create' ? 'Create Announcement' : 'Edit Announcement';

  const submitHandler = handleSubmit(async (values) => {
    const payload: UpsertAnnouncementType = {
      title: values.title.trim(),
      body: values.body,
      publishedAt: values.publishedAt.toISOString(),
      isSpecial: Boolean(values.isSpecial),
    };

    await onSubmit(payload);
  });
  const syncEditorContent = React.useCallback(() => {
    if (!editorRef.current) {
      return;
    }
    const sanitizedHtml = sanitizeRichContent(editorRef.current.getCurrentContent());
    setValue('body', sanitizedHtml, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPlainTextLength(computePlainTextLength(sanitizedHtml));
  }, [setValue, computePlainTextLength]);

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    syncEditorContent();
    void submitHandler(event);
  };

  const effectiveSubmitting = submitting || isSubmitting;
  const bodyError = errors.body?.message as string | undefined;
  const remainingCharacters = Math.max(0, ANNOUNCEMENT_BODY_MAX_LENGTH - plainTextLength);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: (theme) => theme.palette.text.primary }}>{dialogTitle}</DialogTitle>
      <Box component="form" onSubmit={handleFormSubmit} noValidate>
        <DialogContent dividers>
          {submitError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          ) : null}
          <Stack spacing={3}>
            <TextField
              {...register('title')}
              label="Title"
              fullWidth
              required
              autoFocus
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
            />
            <Controller
              name="publishedAt"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <FormControl error={Boolean(errors.publishedAt)} fullWidth>
                    <DateTimePicker
                      label="Publish Date & Time"
                      value={field.value ?? null}
                      onChange={(newValue) => {
                        field.onChange(newValue ?? undefined);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                    {errors.publishedAt ? (
                      <FormHelperText>{errors.publishedAt.message}</FormHelperText>
                    ) : null}
                  </FormControl>
                </LocalizationProvider>
              )}
            />
            <TextField {...register('body')} type="hidden" />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Announcement Details
              </Typography>
              <RichTextEditor
                key={editorKey}
                ref={editorRef}
                initialValue={editorInitialValue}
                onChange={(html) => {
                  const sanitizedHtml = sanitizeRichContent(html);
                  setPlainTextLength(computePlainTextLength(sanitizedHtml));
                }}
                minHeight={200}
                placeholder="Share announcement details..."
                disabled={effectiveSubmitting}
                error={Boolean(bodyError)}
              />
              <Typography variant="caption" color={bodyError ? 'error.main' : 'text.secondary'}>
                {bodyError ?? `${remainingCharacters} characters remaining`}
              </Typography>
            </Stack>
            <Controller
              name="isSpecial"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value ?? false}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Mark as special announcement"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={effectiveSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={effectiveSubmitting}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AnnouncementFormDialog;
