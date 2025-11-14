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
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type UpsertWelcomeMessageType,
  type WelcomeMessageType,
  WELCOME_MESSAGE_CAPTION_MAX_LENGTH,
} from '@draco/shared-schemas';

import RichTextEditor, { type RichTextEditorHandle } from '../email/RichTextEditor';
import { sanitizeRichContent } from '../../utils/sanitization';

const WelcomeMessageFormSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(1, 'Caption is required')
    .max(
      WELCOME_MESSAGE_CAPTION_MAX_LENGTH,
      `Caption must be ${WELCOME_MESSAGE_CAPTION_MAX_LENGTH} characters or fewer`,
    ),
  order: z.coerce.number().int('Order must be an integer').min(0, 'Order must be zero or greater'),
  bodyHtml: z.string().trim().min(1, 'Body content is required'),
});

type WelcomeMessageFormInput = z.input<typeof WelcomeMessageFormSchema>;
type WelcomeMessageFormValues = z.output<typeof WelcomeMessageFormSchema>;

export interface InformationMessageTeamOption {
  teamSeasonId: string;
  teamId: string;
  label: string;
}

type InformationMessageScope = 'account' | 'team';

interface InformationMessageFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialMessage?: WelcomeMessageType | null;
  initialScope: InformationMessageScope;
  initialTeamSeasonId?: string | null;
  availableTeams?: InformationMessageTeamOption[];
  allowScopeSelection?: boolean;
  onClose: () => void;
  onSubmit: (result: {
    scope: InformationMessageScope;
    teamSeasonId?: string;
    payload: UpsertWelcomeMessageType;
  }) => Promise<void> | void;
  loading?: boolean;
  submitError?: string | null;
}

const defaultValues: WelcomeMessageFormInput = {
  caption: '',
  order: 0,
  bodyHtml: '',
};

const InformationMessageFormDialog: React.FC<InformationMessageFormDialogProps> = ({
  open,
  mode,
  initialMessage,
  initialScope,
  initialTeamSeasonId,
  availableTeams = [],
  allowScopeSelection = false,
  onClose,
  onSubmit,
  loading = false,
  submitError = null,
}) => {
  const [scope, setScope] = React.useState<InformationMessageScope>(initialScope);
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = React.useState<string | ''>(
    initialTeamSeasonId ?? availableTeams[0]?.teamSeasonId ?? '',
  );
  const [editorInitialValue, setEditorInitialValue] = React.useState('');
  const [editorKey, setEditorKey] = React.useState(0);
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WelcomeMessageFormInput, unknown, WelcomeMessageFormValues>({
    resolver: zodResolver(WelcomeMessageFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    register('bodyHtml');
  }, [register]);

  const captionValue = watch('caption', defaultValues.caption);

  const resetForm = React.useCallback(() => {
    reset(defaultValues);
    setEditorInitialValue('');
    setEditorKey((key) => key + 1);
  }, [reset]);

  React.useEffect(() => {
    if (!open) {
      resetForm();
      setScope(initialScope);
      setSelectedTeamSeasonId(initialTeamSeasonId ?? availableTeams[0]?.teamSeasonId ?? '');
      return;
    }

    setScope(initialScope);
    setSelectedTeamSeasonId(initialTeamSeasonId ?? availableTeams[0]?.teamSeasonId ?? '');

    if (initialMessage) {
      const sanitizedBody = sanitizeRichContent(initialMessage.bodyHtml ?? '');
      setValue('caption', initialMessage.caption ?? '', { shouldDirty: false });
      setValue('order', initialMessage.order ?? 0, { shouldDirty: false });
      setValue('bodyHtml', sanitizedBody, { shouldDirty: false });
      setEditorInitialValue(sanitizedBody);
    } else {
      resetForm();
    }

    setEditorKey((key) => key + 1);
  }, [
    open,
    initialScope,
    initialTeamSeasonId,
    availableTeams,
    initialMessage,
    setValue,
    resetForm,
  ]);

  const syncEditor = React.useCallback(() => {
    if (!editorRef.current) {
      return;
    }
    const sanitized = editorRef.current.getSanitizedContent();
    setValue('bodyHtml', sanitized, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    syncEditor();
    void handleSubmit(async (values) => {
      const payload: UpsertWelcomeMessageType = {
        caption: values.caption.trim(),
        order: values.order,
        bodyHtml: values.bodyHtml,
      };

      const effectiveScope = allowScopeSelection ? scope : initialScope;
      const teamSeasonValue = effectiveScope === 'team' ? selectedTeamSeasonId : undefined;

      await onSubmit({
        scope: effectiveScope,
        teamSeasonId: teamSeasonValue || undefined,
        payload,
      });
    })(event);
  };

  const captionHelper = `${captionValue.trim().length}/${WELCOME_MESSAGE_CAPTION_MAX_LENGTH} characters`;
  const requiresTeamSelection =
    (allowScopeSelection ? scope === 'team' : initialScope === 'team') && availableTeams.length > 0;
  const disableSubmit =
    (allowScopeSelection ? scope === 'team' : initialScope === 'team') &&
    availableTeams.length > 0 &&
    !selectedTeamSeasonId;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: (theme) => theme.palette.text.primary }}>
        {mode === 'create' ? 'Create Information Message' : 'Edit Information Message'}
      </DialogTitle>
      <Box component="form" onSubmit={handleFormSubmit} noValidate>
        <DialogContent dividers>
          <Stack spacing={3}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            {allowScopeSelection ? (
              <FormControl>
                <FormLabel>Scope</FormLabel>
                <RadioGroup
                  row
                  value={scope}
                  onChange={(event) => setScope(event.target.value as InformationMessageScope)}
                >
                  <FormControlLabel value="account" control={<Radio />} label="Account" />
                  <FormControlLabel
                    value="team"
                    control={<Radio />}
                    label="Specific Team"
                    disabled={availableTeams.length === 0}
                  />
                </RadioGroup>
                {availableTeams.length === 0 ? (
                  <FormHelperText>
                    Add teams to the current season to enable team-specific information messages.
                  </FormHelperText>
                ) : null}
              </FormControl>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {initialScope === 'team'
                  ? 'This message applies to the selected team.'
                  : 'This message will be visible to everyone in the account.'}
              </Typography>
            )}

            {requiresTeamSelection ? (
              <TextField
                select
                label="Team"
                value={selectedTeamSeasonId}
                onChange={(event) => setSelectedTeamSeasonId(event.target.value)}
                required
                fullWidth
                helperText={selectedTeamSeasonId ? undefined : 'Select a team to continue'}
              >
                {availableTeams.map((option) => (
                  <MenuItem key={option.teamSeasonId} value={option.teamSeasonId}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            <TextField
              {...register('caption')}
              label="Caption"
              fullWidth
              required
              autoFocus
              error={Boolean(errors.caption)}
              helperText={errors.caption?.message ?? captionHelper}
            />

            <TextField
              {...register('order')}
              label="Display Order"
              type="number"
              fullWidth
              required
              inputProps={{ min: 0 }}
              error={Boolean(errors.order)}
              helperText={errors.order?.message ?? 'Lower numbers appear first on the page.'}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Body
              </Typography>
              <RichTextEditor
                key={editorKey}
                ref={editorRef}
                initialValue={editorInitialValue}
                minHeight={180}
                disabled={false}
                placeholder="Share important details, expectations, and resources."
              />
              {errors.bodyHtml ? (
                <FormHelperText error>{errors.bodyHtml.message}</FormHelperText>
              ) : null}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading || isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting || disableSubmit}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default InformationMessageFormDialog;
