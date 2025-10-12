'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { z } from 'zod';
import {
  AccountAffiliationType,
  AccountType as SharedAccountType,
  AccountTypeReference,
  CreateAccountSchema,
  CreateAccountType,
  CreateContactSchema,
} from '@draco/shared-schemas';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { detectUserTimezone, US_TIMEZONES } from '../../../utils/timezones';
import { useAuth } from '../../../context/AuthContext';
import TurnstileChallenge from '../../security/TurnstileChallenge';
import { useAccountManagementService } from '../../../hooks/useAccountManagementService';

const CURRENT_YEAR = new Date().getFullYear();

const CreateAccountFormSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required'),
  accountTypeId: z.string().trim().min(1, 'Account type is required'),
  affiliationId: z.string().trim().min(1, 'Affiliation is required'),
  timezoneId: z.string().trim().min(1, 'Timezone is required'),
  firstYear: z
    .number()
    .refine((value) => !Number.isNaN(value), { message: 'First year is required' })
    .int('First year must be a whole number')
    .min(1800, 'First year must be 1800 or later')
    .max(CURRENT_YEAR + 10, 'First year is too far in the future'),
  ownerFirstName: z.string().trim().min(1, 'Owner first name is required'),
  ownerLastName: z.string().trim().min(1, 'Owner last name is required'),
  seasonName: z
    .string()
    .trim()
    .min(1, 'Season name is required')
    .max(25, 'Season name must be 25 characters or fewer'),
});

type CreateAccountFormValues = z.infer<typeof CreateAccountFormSchema>;

interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { account: SharedAccountType; message: string }) => void;
  onError?: (message: string) => void;
}

const defaultFormValues: CreateAccountFormValues = {
  name: '',
  accountTypeId: '',
  affiliationId: '1',
  timezoneId: detectUserTimezone(),
  firstYear: CURRENT_YEAR,
  ownerFirstName: '',
  ownerLastName: '',
  seasonName: '',
};

const CreateAccountDialog: React.FC<CreateAccountDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const {
    fetchAccountTypes,
    fetchAccountAffiliations,
    fetchManagedAccounts,
    createAccount: createAccountOperation,
  } = useAccountManagementService();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [accountTypes, setAccountTypes] = React.useState<AccountTypeReference[]>([]);
  const [affiliations, setAffiliations] = React.useState<AccountAffiliationType[]>([]);
  const [ownerPrefill, setOwnerPrefill] = React.useState<{ firstName: string; lastName: string }>({
    firstName: '',
    lastName: '',
  });
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(false);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);
  const [optionsReloadToken, setOptionsReloadToken] = React.useState(0);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);
  const captchaRequired = React.useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(CreateAccountFormSchema),
    defaultValues: defaultFormValues,
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      setOptionsError(null);
      try {
        const [typesResult, affiliationsResult, managedAccountsResult] = await Promise.all([
          fetchAccountTypes(),
          fetchAccountAffiliations(),
          fetchManagedAccounts(),
        ]);

        if (!isActive) {
          return;
        }

        if (!typesResult.success) {
          throw new Error(typesResult.error);
        }

        if (!affiliationsResult.success) {
          throw new Error(affiliationsResult.error);
        }

        if (!managedAccountsResult.success) {
          throw new Error(managedAccountsResult.error);
        }

        setAccountTypes(typesResult.data);
        setAffiliations(affiliationsResult.data);

        const accounts = managedAccountsResult.data;

        let owner = { firstName: '', lastName: '' };
        const preferredAccount = accounts.find(
          (account) => account.accountOwner?.user?.userId === user?.userId,
        );
        const fallbackAccount = accounts.find(
          (account) =>
            account.accountOwner?.contact?.firstName && account.accountOwner?.contact?.lastName,
        );
        const contact =
          preferredAccount?.accountOwner?.contact ?? fallbackAccount?.accountOwner?.contact;

        if (contact?.firstName && contact?.lastName) {
          owner = {
            firstName: contact.firstName,
            lastName: contact.lastName,
          };
        }

        setOwnerPrefill(owner);
      } catch (error) {
        if (!isActive) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load account details';
        setOptionsError(message);
        onError?.(message);
      } finally {
        if (isActive) {
          setIsLoadingOptions(false);
        }
      }
    };

    void fetchOptions();

    return () => {
      isActive = false;
    };
  }, [
    open,
    fetchAccountTypes,
    fetchAccountAffiliations,
    fetchManagedAccounts,
    user?.userId,
    onError,
    optionsReloadToken,
  ]);

  React.useEffect(() => {
    if (!open) {
      reset(defaultFormValues);
      setSubmitError(null);
      setOptionsError(null);
      setIsLoadingOptions(false);
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      return;
    }

    setSubmitError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
  }, [open, reset]);

  React.useEffect(() => {
    if (!open || isDirty) {
      return;
    }

    reset({
      ...defaultFormValues,
      affiliationId: affiliations[0]?.id ?? defaultFormValues.affiliationId,
      ownerFirstName: ownerPrefill.firstName,
      ownerLastName: ownerPrefill.lastName,
    });
  }, [open, isDirty, affiliations, ownerPrefill.firstName, ownerPrefill.lastName, reset]);

  const handleRetryOptions = React.useCallback(() => {
    if (!isLoadingOptions) {
      setOptionsReloadToken((token) => token + 1);
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
    }
  }, [isLoadingOptions]);

  const disableForm =
    isLoadingOptions ||
    accountTypes.length === 0 ||
    Boolean(optionsError) ||
    (captchaRequired && !captchaToken);

  const buildPayload = React.useCallback(
    (values: CreateAccountFormValues): CreateAccountType => {
      const accountType = accountTypes.find((type) => type.id === values.accountTypeId);
      const affiliation = affiliations.find((item) => item.id === values.affiliationId);

      const configuration: NonNullable<CreateAccountType['configuration']> = {};

      if (accountType) {
        configuration.accountType = {
          id: accountType.id,
          name: accountType.name,
        };
      }

      if (affiliation) {
        configuration.affiliation = {
          id: affiliation.id,
          name: affiliation.name,
          url: affiliation.url ?? undefined,
        };
      }

      configuration.timeZone = values.timezoneId;
      configuration.firstYear = values.firstYear;

      const payload: CreateAccountType = {
        name: values.name.trim(),
        accountLogoUrl: '',
        configuration,
        urls: [],
        seasonName: values.seasonName.trim(),
        ownerContact: {
          firstName: values.ownerFirstName.trim(),
          lastName: values.ownerLastName.trim(),
        },
      };

      CreateContactSchema.pick({ firstName: true, lastName: true }).parse(payload.ownerContact);
      CreateAccountSchema.parse(payload);

      return payload;
    },
    [accountTypes, affiliations],
  );

  const onSubmit = handleSubmit(async (formValues) => {
    try {
      if (disableForm) {
        return;
      }

      if (captchaRequired && !captchaToken) {
        setSubmitError('Please verify that you are human before continuing.');
        setCaptchaResetKey((key) => key + 1);
        return;
      }

      setSubmitError(null);

      const payload = buildPayload(formValues);
      const result = await createAccountOperation({
        payload,
        captchaToken,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess?.({
        account: result.data,
        message: result.message ?? 'Account created successfully',
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setSubmitError(message);
      onError?.(message);
    } finally {
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Account</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {optionsError && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetryOptions}
                    disabled={isLoadingOptions}
                  >
                    Retry
                  </Button>
                }
              >
                {optionsError}
              </Alert>
            )}
            {isLoadingOptions && accountTypes.length === 0 && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
            <TextField
              label="Account Name"
              fullWidth
              required
              autoFocus
              disabled={disableForm}
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <Controller
              name="accountTypeId"
              control={control}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  required
                  error={Boolean(errors.accountTypeId)}
                  disabled={disableForm}
                >
                  <InputLabel>Account Type</InputLabel>
                  <Select {...field} label="Account Type">
                    {accountTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.accountTypeId?.message}</FormHelperText>
                </FormControl>
              )}
            />
            <Controller
              name="affiliationId"
              control={control}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  required
                  error={Boolean(errors.affiliationId)}
                  disabled={disableForm}
                >
                  <InputLabel>Affiliation</InputLabel>
                  <Select {...field} label="Affiliation">
                    {affiliations.map((affiliation) => (
                      <MenuItem key={affiliation.id} value={affiliation.id}>
                        {affiliation.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.affiliationId?.message}</FormHelperText>
                </FormControl>
              )}
            />
            <Controller
              name="timezoneId"
              control={control}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  required
                  error={Boolean(errors.timezoneId)}
                  disabled={disableForm}
                >
                  <InputLabel>Timezone</InputLabel>
                  <Select {...field} label="Timezone">
                    {US_TIMEZONES.map((timezone) => (
                      <MenuItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.timezoneId?.message}</FormHelperText>
                </FormControl>
              )}
            />
            <TextField
              label="First Year"
              type="number"
              fullWidth
              inputProps={{ min: 1800, max: CURRENT_YEAR + 10 }}
              disabled={disableForm}
              {...register('firstYear', { valueAsNumber: true })}
              error={Boolean(errors.firstYear)}
              helperText={errors.firstYear?.message}
            />
            <TextField
              label="Season Name"
              fullWidth
              required
              disabled={disableForm}
              {...register('seasonName')}
              error={Boolean(errors.seasonName)}
              helperText={errors.seasonName?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="ownerFirstName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Owner First Name"
                    fullWidth
                    required
                    disabled={disableForm}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="ownerLastName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Owner Last Name"
                    fullWidth
                    required
                    disabled={disableForm}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
            {captchaRequired && (
              <TurnstileChallenge
                onTokenChange={setCaptchaToken}
                resetSignal={captchaResetKey}
                loading={isLoadingOptions}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || disableForm}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateAccountDialog;
