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
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHofNominationSchema } from '@draco/shared-schemas';
import { submitAccountHallOfFameNomination } from '@draco/shared-api-client';
import { z } from 'zod';
import { useAccountMembership } from '@/hooks/useAccountMembership';
import { useApiClient } from '@/hooks/useApiClient';
import { assertNoApiError } from '@/utils/apiResult';
import TurnstileChallenge from '@/components/security/TurnstileChallenge';
import { sanitizeRichContent } from '@/utils/sanitization';
import { formatPhoneInput, formatPhoneNumber } from '@/utils/phoneNumber';
import RichTextContent from '../common/RichTextContent';

const NOMINATION_REASON_LIMIT = 1000;

const FormSchema = SubmitHofNominationSchema.extend({
  phoneNumber: SubmitHofNominationSchema.shape.phoneNumber.transform((value) => value ?? ''),
  reason: SubmitHofNominationSchema.shape.reason.refine(
    (value) => value.length <= NOMINATION_REASON_LIMIT,
    { message: `Reason must be ${NOMINATION_REASON_LIMIT} characters or fewer` },
  ),
});

type FormValues = z.infer<typeof FormSchema>;

interface HofNominationDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  criteriaText?: string;
  onSubmitted?: () => void;
}

const NOMINATION_SUCCESS_MESSAGE = 'Thank you! Your Hall of Fame nomination has been received.';

const HofNominationDialog: React.FC<HofNominationDialogProps> = ({
  accountId,
  open,
  onClose,
  criteriaText,
  onSubmitted,
}) => {
  const { contact } = useAccountMembership(accountId);
  const apiClient = useApiClient();
  const contactDefaults = React.useMemo<FormValues>(() => {
    const base: FormValues = {
      nominator: '',
      phoneNumber: '',
      email: '',
      nominee: '',
      reason: '',
    };

    if (!contact) {
      return base;
    }

    const firstName = contact.firstName?.trim() ?? '';
    const lastName = contact.lastName?.trim() ?? '';
    const computedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const email = contact.email?.trim() ?? '';
    const phoneCandidates = [
      contact.contactDetails?.phone1,
      contact.contactDetails?.phone2,
      contact.contactDetails?.phone3,
    ];
    const firstPhone = phoneCandidates.find((value): value is string =>
      Boolean(value && value.trim().length > 0),
    );

    return {
      ...base,
      nominator: computedName || email,
      phoneNumber: firstPhone ? formatPhoneNumber(firstPhone) : '',
      email,
    };
  }, [contact]);
  const formResolver = React.useMemo(
    () => zodResolver(FormSchema) as Resolver<FormValues, Record<string, never>, FormValues>,
    [],
  );
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: contactDefaults,
  });
  const reasonValue = watch('reason');

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);

  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const submitDisabled = submitting;

  const handleDialogClose = React.useCallback(() => {
    setSubmitError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
    reset(contactDefaults);
    onClose();
  }, [contactDefaults, onClose, reset]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitting(true);
    if (hasTurnstile && !captchaToken) {
      setSubmitError('Please verify that you are human before submitting the nomination.');
      setSubmitting(false);
      setCaptchaResetKey((key) => key + 1);
      return;
    }
    try {
      const result = await submitAccountHallOfFameNomination({
        client: apiClient,
        path: { accountId },
        body: {
          nominator: values.nominator.trim(),
          phoneNumber: values.phoneNumber.trim(),
          email: values.email.trim(),
          nominee: values.nominee.trim(),
          reason: values.reason.trim(),
        },
        headers: captchaToken
          ? {
              'cf-turnstile-token': captchaToken,
            }
          : undefined,
        throwOnError: false,
      });

      assertNoApiError(result, 'Unable to submit Hall of Fame nomination');

      setSnackbarOpen(true);
      onSubmitted?.();
      handleDialogClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit Hall of Fame nomination. Please try again.';
      setSubmitError(message);
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const sanitizedCriteria = React.useMemo(() => {
    if (!criteriaText) {
      return null;
    }

    const sanitized = sanitizeRichContent(criteriaText);
    return sanitized.length > 0 ? sanitized : null;
  }, [criteriaText]);

  React.useEffect(() => {
    setSubmitError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      reset(contactDefaults);
      return;
    }

    if (!isDirty) {
      reset(contactDefaults);
    }
  }, [open, contactDefaults, reset, isDirty]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="hof-nomination-dialog"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle id="hof-nomination-dialog">Nominate a Hall of Fame Member</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Share the accomplishments of someone you believe deserves recognition in the Hall of
              Fame. Our administrators review nominations regularly.
            </Typography>

            {sanitizedCriteria ? (
              <Alert severity="info">
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Nomination Criteria
                </Typography>
                <RichTextContent html={sanitizedCriteria} sanitize={false} />
              </Alert>
            ) : null}

            {submitError && <Alert severity="error">{submitError}</Alert>}

            <Stack spacing={2} mt={1}>
              <TextField
                label="Your Name"
                fullWidth
                required
                autoComplete="name"
                disabled={submitting}
                error={Boolean(errors.nominator)}
                helperText={errors.nominator?.message}
                {...register('nominator')}
              />
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Phone Number"
                    fullWidth
                    required
                    autoComplete="tel"
                    disabled={submitting}
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                    onBlur={field.onBlur}
                    inputProps={{ inputMode: 'tel' }}
                    error={Boolean(errors.phoneNumber)}
                    helperText={errors.phoneNumber?.message}
                  />
                )}
              />
              <TextField
                label="Email"
                fullWidth
                required
                autoComplete="email"
                disabled={submitting}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Nominee Name"
                fullWidth
                required
                disabled={submitting}
                error={Boolean(errors.nominee)}
                helperText={errors.nominee?.message}
                {...register('nominee')}
              />
              <TextField
                label="Reason for Nomination"
                fullWidth
                required
                multiline
                minRows={4}
                disabled={submitting}
                error={Boolean(errors.reason)}
                helperText={
                  errors.reason?.message ??
                  `Share notable achievements, leadership, or community impact. (${reasonValue?.length ?? 0}/${NOMINATION_REASON_LIMIT})`
                }
                inputProps={{ maxLength: NOMINATION_REASON_LIMIT }}
                {...register('reason')}
              />
            </Stack>

            {hasTurnstile && (
              <Box sx={{ mt: 1 }}>
                <TurnstileChallenge
                  onTokenChange={setCaptchaToken}
                  resetSignal={captchaResetKey}
                  loading={submitting}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  Please complete the verification before submitting your nomination.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitDisabled}>
              {submitting ? 'Submitting...' : 'Submit Nomination'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={NOMINATION_SUCCESS_MESSAGE}
      />
    </>
  );
};

export default HofNominationDialog;
