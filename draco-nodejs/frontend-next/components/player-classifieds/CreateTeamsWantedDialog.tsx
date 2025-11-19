'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch, type DefaultValues, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { formatPhoneNumber } from '../../utils/phoneNumber';
import {
  TeamsWantedOwnerClassifiedType,
  UpsertTeamsWantedClassifiedType,
} from '@draco/shared-schemas';
import { useTeamsWantedClassifieds } from '../../hooks/useClassifiedsService';
import { useAccountMembership } from '../../hooks/useAccountMembership';
import TurnstileChallenge from '../security/TurnstileChallenge';

const parseDateOnly = (value: string | null | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const [datePart] = trimmed.split('T');
  const segments = datePart.split('-');
  if (segments.length !== 3) {
    return undefined;
  }

  const [yearStr, monthStr, dayStr] = segments;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export interface TeamsWantedDialogSuccessEvent {
  action: 'create' | 'update';
  message: string;
  data: TeamsWantedOwnerClassifiedType;
}

export type TeamsWantedFormInitialData = UpsertTeamsWantedClassifiedType & {
  id?: string | number | bigint;
};

interface CreateTeamsWantedDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  initialData?: TeamsWantedFormInitialData | null;
  classifiedId?: string;
  accessCode?: string;
  onSuccess?: (event: TeamsWantedDialogSuccessEvent) => void;
  onError?: (message: string) => void;
}

// Available positions for teams wanted - using IDs that match backend validation
const POSITION_OPTIONS = [
  'pitcher',
  'catcher',
  'first-base',
  'second-base',
  'third-base',
  'shortstop',
  'left-field',
  'center-field',
  'right-field',
  'utility',
  'designated-hitter',
] as const;

type PositionOption = (typeof POSITION_OPTIONS)[number];

const POSITION_LABELS: Record<PositionOption, string> = {
  pitcher: 'Pitcher',
  catcher: 'Catcher',
  'first-base': 'First Base',
  'second-base': 'Second Base',
  'third-base': 'Third Base',
  shortstop: 'Shortstop',
  'left-field': 'Left Field',
  'center-field': 'Center Field',
  'right-field': 'Right Field',
  utility: 'Utility',
  'designated-hitter': 'Designated Hitter',
};

const isValidPosition = (value: string): value is PositionOption =>
  (POSITION_OPTIONS as readonly string[]).includes(value);

const sanitizeNameInput = (value: string) =>
  value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');

const isAtLeastThirteen = (date: Date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 13;
};

const PositionEnum = z.enum(POSITION_OPTIONS);

const NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 320;
const PHONE_MAX_LENGTH = 50;
const EXPERIENCE_MAX_LENGTH = 255;

const TeamsWantedFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .max(NAME_MAX_LENGTH, {
      message: `Full name must not exceed ${NAME_MAX_LENGTH} characters`,
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Enter a valid email address' })
    .max(EMAIL_MAX_LENGTH, {
      message: `Email must not exceed ${EMAIL_MAX_LENGTH} characters`,
    }),
  phone: z
    .string()
    .trim()
    .min(1, { message: 'Phone number is required' })
    .max(PHONE_MAX_LENGTH, {
      message: `Phone number must not exceed ${PHONE_MAX_LENGTH} characters`,
    }),
  experience: z
    .string()
    .trim()
    .min(1, { message: 'Experience is required' })
    .max(EXPERIENCE_MAX_LENGTH, {
      message: `Experience must not exceed ${EXPERIENCE_MAX_LENGTH} characters`,
    }),
  positionsPlayed: z
    .array(PositionEnum)
    .min(1, 'Please select at least one position')
    .max(3, 'Please select no more than 3 positions'),
  birthDate: z
    .preprocess(
      (value) => {
        if (value === null || value === undefined || value === '') {
          return undefined;
        }

        if (value instanceof Date) {
          return value;
        }

        const parsed = new Date(value as string);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
      },
      z.instanceof(Date, { message: 'Birth date is required' }),
    )
    .refine(isAtLeastThirteen, {
      message: 'You must be at least 13 years old',
    }),
});

type TeamsWantedFormValues = z.infer<typeof TeamsWantedFormSchema>;

// Experience level is now a free-form text input

const CreateTeamsWantedDialog: React.FC<CreateTeamsWantedDialogProps> = ({
  accountId,
  open,
  onClose,
  editMode = false,
  initialData,
  classifiedId,
  accessCode,
  onSuccess,
  onError: _onError,
}) => {
  const {
    createTeamsWanted,
    updateTeamsWanted,
    loading: operationLoading,
    error: serviceError,
    resetError,
  } = useTeamsWantedClassifieds(accountId);
  const { isMember, contact } = useAccountMembership(accountId);

  const turnstileEnabled = useMemo(() => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY), []);
  const captchaRequired = turnstileEnabled && isMember !== true;
  const captchaAutoResetKey = (open ? 1 : 0) + (captchaRequired ? 2 : 0);
  const [captchaTokenState, setCaptchaTokenState] = useState<{
    token: string | null;
    contextKey: number;
  }>({ token: null, contextKey: captchaAutoResetKey });
  const captchaToken =
    captchaTokenState.contextKey === captchaAutoResetKey ? captchaTokenState.token : null;
  const setCaptchaToken = useCallback(
    (token: string | null) => {
      setCaptchaTokenState({ token, contextKey: captchaAutoResetKey });
    },
    [captchaAutoResetKey],
  );
  const [manualCaptchaResetCount, setManualCaptchaResetCount] = useState(0);

  const captchaResetKey = manualCaptchaResetCount * 10 + captchaAutoResetKey;

  const incrementCaptchaResetKey = useCallback(() => {
    setManualCaptchaResetCount((count) => count + 1);
  }, []);

  const [captchaErrorState, setCaptchaErrorState] = useState<{
    message: string | null;
    contextKey: number;
  }>({
    message: null,
    contextKey: captchaAutoResetKey,
  });
  const captchaError =
    captchaErrorState.contextKey === captchaAutoResetKey ? captchaErrorState.message : null;

  const setCaptchaError = useCallback(
    (message: string | null) => {
      setCaptchaErrorState({ message, contextKey: captchaAutoResetKey });
    },
    [captchaAutoResetKey],
  );

  const handleCaptchaTokenChange = useCallback(
    (token: string | null) => {
      setCaptchaToken(token);
      if (token) {
        setCaptchaError(null);
      }
    },
    [setCaptchaError, setCaptchaToken],
  );

  const contactPrefill = useMemo(() => {
    if (!contact) {
      return null;
    }

    const nameParts = [contact.firstName, contact.middleName, contact.lastName]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter((part) => part.length > 0);

    const primaryPhone =
      contact.contactDetails?.phone1 ||
      contact.contactDetails?.phone2 ||
      contact.contactDetails?.phone3 ||
      '';

    const digitsOnly = primaryPhone.replace(/\D/g, '');
    const formattedPhone =
      digitsOnly.length === 10 ? formatPhoneNumber(digitsOnly) : primaryPhone.trim();

    return {
      name: nameParts.join(' '),
      email: contact.email?.trim() ?? '',
      phone: formattedPhone,
      birthDate: parseDateOnly(contact.contactDetails?.dateOfBirth),
    };
  }, [contact]);

  const updateClassifiedId = useMemo(() => {
    if (classifiedId && classifiedId.trim().length > 0) {
      return classifiedId;
    }

    if (!initialData?.id) {
      return undefined;
    }

    if (typeof initialData.id === 'string') {
      const trimmed = initialData.id.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return String(initialData.id);
  }, [classifiedId, initialData]);

  const formDefaults = useMemo<DefaultValues<TeamsWantedFormValues>>(() => {
    const positions =
      (initialData?.positionsPlayed ?? '')
        .split(',')
        .map((position) => position.trim())
        .filter(
          (position): position is PositionOption =>
            position.length > 0 && isValidPosition(position),
        )
        .slice(0, 3) ?? [];

    let birthDate = parseDateOnly(initialData?.birthDate);

    const shouldPrefill = !editMode;

    if (!initialData?.birthDate && !birthDate && !editMode && contactPrefill?.birthDate) {
      birthDate = contactPrefill.birthDate;
    }

    return {
      name: initialData?.name ?? (shouldPrefill ? (contactPrefill?.name ?? '') : ''),
      email: initialData?.email ?? (shouldPrefill ? (contactPrefill?.email ?? '') : ''),
      phone: initialData?.phone ?? (shouldPrefill ? (contactPrefill?.phone ?? '') : ''),
      experience: initialData?.experience ?? '',
      positionsPlayed: positions,
      birthDate,
    };
  }, [initialData, editMode, contactPrefill]);

  const formResolver = useMemo(
    () =>
      zodResolver(TeamsWantedFormSchema) as Resolver<
        TeamsWantedFormValues,
        Record<string, never>,
        TeamsWantedFormValues
      >,
    [],
  );

  const {
    control,
    handleSubmit: submitForm,
    reset,
    formState: { errors, isDirty },
    clearErrors,
    register,
  } = useForm<TeamsWantedFormValues>({
    resolver: formResolver,
    defaultValues: formDefaults,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const displayedSubmitError = submitError ?? serviceError ?? null;

  const experienceValue = useWatch({ control, name: 'experience' }) ?? '';

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isDirty) {
      reset(formDefaults);
      clearErrors();
      resetError();
    }
  }, [open, formDefaults, reset, clearErrors, resetError, isDirty]);

  const onSubmit = submitForm(async (values) => {
    setSubmitError(null);
    resetError();

    if (captchaRequired && !captchaToken) {
      setCaptchaError('Please verify that you are human before submitting.');
      incrementCaptchaResetKey();
      return;
    }

    if (editMode && !updateClassifiedId) {
      const message = 'Missing classified identifier for update.';
      setSubmitError(message);
      return;
    }

    const normalizedPayload: UpsertTeamsWantedClassifiedType = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      experience: values.experience.trim(),
      positionsPlayed: values.positionsPlayed.join(','),
      birthDate: values.birthDate
        ? `${values.birthDate.getFullYear()}-${String(values.birthDate.getMonth() + 1).padStart(
            2,
            '0',
          )}-${String(values.birthDate.getDate()).padStart(2, '0')}`
        : '',
    };

    let result: Awaited<ReturnType<typeof updateTeamsWanted>>;

    if (editMode) {
      result = await updateTeamsWanted(updateClassifiedId ?? '', normalizedPayload, { accessCode });
    } else {
      result = await createTeamsWanted(normalizedPayload, {
        captchaToken: captchaRequired ? (captchaToken ?? undefined) : undefined,
      });
    }

    if (result.success && result.data) {
      const successMessage =
        result.message ?? `Teams Wanted ad ${editMode ? 'updated' : 'created'} successfully`;
      onSuccess?.({
        action: editMode ? 'update' : 'create',
        message: successMessage,
        data: result.data,
      });
      handleClose();
      return;
    }

    const message = result.error ?? `Failed to ${editMode ? 'update' : 'create'} Teams Wanted ad`;
    setSubmitError(message);

    if (captchaRequired) {
      setCaptchaToken(null);
      incrementCaptchaResetKey();
    }
  });

  const handleClose = () => {
    reset(formDefaults);
    clearErrors();
    setSubmitError(null);
    resetError();
    setCaptchaToken(null);
    setCaptchaError(null);
    incrementCaptchaResetKey();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? 'Edit Teams Wanted' : 'Post Teams Wanted'}</DialogTitle>
      <form onSubmit={onSubmit} noValidate>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DialogContent>
            {/* Error Alert */}
            {displayedSubmitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
                {displayedSubmitError}
              </Alert>
            )}

            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="dense"
                  label="Full Name"
                  onChange={(event) => field.onChange(sanitizeNameInput(event.target.value))}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  required
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Contact Fields */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  {...register('email')}
                  fullWidth
                  margin="dense"
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  required
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 220 } }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      margin="dense"
                      label="Phone Number"
                      onChange={(event) => {
                        const rawValue = event.target.value;
                        const digitsOnly = rawValue.replace(/\D/g, '');

                        if (digitsOnly.length > 10) {
                          return;
                        }

                        const formattedValue =
                          digitsOnly.length === 10 ? formatPhoneNumber(digitsOnly) : digitsOnly;
                        field.onChange(formattedValue);
                      }}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      required
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Experience Level */}
            <TextField
              {...register('experience')}
              fullWidth
              margin="dense"
              label="Experience Level"
              multiline
              rows={4}
              error={!!errors.experience}
              helperText={
                errors.experience?.message ||
                `${Math.max(0, EXPERIENCE_MAX_LENGTH - experienceValue.length)} characters remaining`
              }
              placeholder="Describe your baseball experience in detail...
Examples: 
• 5 years playing recreational softball in local league
• 2 years competitive baseball, primarily shortstop and second base  
• High school varsity team experience, all-state recognition
• Coached youth teams for 3 years"
              required
              inputProps={{ maxLength: EXPERIENCE_MAX_LENGTH }}
              sx={{ mb: 2 }}
            />

            {/* Positions Played */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <Controller
                name="positionsPlayed"
                control={control}
                render={({ field }) => {
                  const fieldValue = field.value ?? [];

                  return (
                    <FormControl
                      fullWidth
                      margin="dense"
                      error={!!errors.positionsPlayed}
                      sx={{ flexGrow: 1 }}
                    >
                      <InputLabel id="positions-played-label">Positions Played</InputLabel>
                      <Select
                        labelId="positions-played-label"
                        id="positions-played-select"
                        multiple
                        value={fieldValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          const nextSelected = (
                            typeof value === 'string' ? value.split(',') : value
                          )
                            .map((position) => position as string)
                            .filter((position) => isValidPosition(position));
                          const deduped = Array.from(new Set(nextSelected)) as PositionOption[];
                          field.onChange(deduped.slice(0, 3));
                        }}
                        input={<OutlinedInput label="Positions Played" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as PositionOption[]).map((value) => (
                              <Chip key={value} label={POSITION_LABELS[value]} size="small" />
                            ))}
                          </Box>
                        )}
                        required
                      >
                        {POSITION_OPTIONS.map((position) => (
                          <MenuItem
                            key={position}
                            value={position}
                            disabled={fieldValue.length >= 3 && !fieldValue.includes(position)}
                          >
                            {POSITION_LABELS[position]}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText error={!!errors.positionsPlayed}>
                        {errors.positionsPlayed?.message ||
                          `${fieldValue.length}/3 positions selected`}
                      </FormHelperText>
                    </FormControl>
                  );
                }}
              />
              <Box sx={{ width: { xs: '100%', md: 220 } }}>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Birth Date"
                      value={field.value ?? null}
                      onChange={(date) => field.onChange(date ?? null)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'dense',
                          error: !!errors.birthDate,
                          helperText: errors.birthDate?.message,
                          required: true,
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Help Text */}
            {!editMode && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Alert severity="info" icon={false}>
                  <strong>Important:</strong> After submitting, you&apos;ll receive an access code
                  via email. Keep this code safe - you&apos;ll need it to edit or delete your ad
                  later.
                </Alert>
              </Box>
            )}

            {captchaRequired && (
              <Box sx={{ mt: 3 }}>
                {captchaError && (
                  <Alert severity="error" onClose={() => setCaptchaError(null)} sx={{ mb: 2 }}>
                    {captchaError}
                  </Alert>
                )}
                <TurnstileChallenge
                  onTokenChange={handleCaptchaTokenChange}
                  resetSignal={captchaResetKey}
                  loading={operationLoading}
                />
              </Box>
            )}
          </DialogContent>
        </LocalizationProvider>

        <DialogActions>
          <Button onClick={handleClose} disabled={operationLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={operationLoading}>
            {operationLoading
              ? editMode
                ? 'Updating...'
                : 'Creating...'
              : editMode
                ? 'Update Teams Wanted'
                : 'Post Teams Wanted'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTeamsWantedDialog;
