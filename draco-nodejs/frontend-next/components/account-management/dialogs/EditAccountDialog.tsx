'use client';

import React from 'react';
import {
  Alert,
  Button,
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
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AccountType as SharedAccountType,
  AccountTypeReference,
  AccountAffiliationType,
  CreateAccountType,
} from '@draco/shared-schemas';
import { useAccountManagementService } from '../../../hooks/useAccountManagementService';
import { DEFAULT_TIMEZONE, US_TIMEZONES } from '../../../utils/timezones';

const CURRENT_YEAR = new Date().getFullYear();

const EditAccountFormSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required'),
  accountTypeId: z.string().trim().min(1, 'Account type is required'),
  affiliationId: z.string().trim().min(1, 'Affiliation is required'),
  timezoneId: z.string().trim().min(1, 'Timezone is required'),
  firstYear: z
    .number({ message: 'First year is required' })
    .int('First year must be a whole number')
    .min(1800, 'First year must be 1800 or later')
    .max(CURRENT_YEAR + 10, 'First year is too far in the future'),
});

export type EditAccountFormValues = z.infer<typeof EditAccountFormSchema>;

interface EditAccountDialogProps {
  open: boolean;
  account: SharedAccountType | null;
  accountTypes: AccountTypeReference[];
  affiliations: AccountAffiliationType[];
  onClose: () => void;
  onSuccess?: (result: { account: SharedAccountType; message: string }) => void;
  onError?: (message: string) => void;
}

const defaultValues: EditAccountFormValues = {
  name: '',
  accountTypeId: '',
  affiliationId: '1',
  timezoneId: DEFAULT_TIMEZONE,
  firstYear: CURRENT_YEAR,
};

const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
  open,
  account,
  accountTypes,
  affiliations,
  onClose,
  onSuccess,
}) => {
  const { updateAccount } = useAccountManagementService();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditAccountFormValues>({
    resolver: zodResolver(EditAccountFormSchema),
    defaultValues,
  });

  const buildPayload = React.useCallback(
    (values: EditAccountFormValues, existingAccount?: SharedAccountType | null) => {
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

      const payload: Partial<CreateAccountType> = {
        name: values.name.trim(),
        accountLogoUrl: existingAccount?.accountLogoUrl ?? '',
      };

      if (Object.keys(configuration).length > 0) {
        payload.configuration = configuration;
      }

      if (existingAccount?.socials) {
        payload.socials = existingAccount.socials;
      }

      if (existingAccount?.urls?.length) {
        payload.urls = existingAccount.urls.map((url) => ({ id: url.id, url: url.url }));
      }

      return payload;
    },
    [accountTypes, affiliations],
  );

  React.useEffect(() => {
    if (open && account) {
      reset({
        name: account.name ?? '',
        accountTypeId: account.configuration?.accountType?.id ?? '',
        affiliationId: account.configuration?.affiliation?.id ?? affiliations[0]?.id ?? '1',
        timezoneId: account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
        firstYear: account.configuration?.firstYear ?? CURRENT_YEAR,
      });
      setSubmitError(null);
    }

    if (!open) {
      reset(defaultValues);
      setSubmitError(null);
    }
  }, [open, account, affiliations, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!account) {
      setSubmitError('Account details are missing.');
      return;
    }

    try {
      setSubmitError(null);

      const payload = buildPayload(values, account);
      const result = await updateAccount({
        accountId: account.id,
        payload,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess?.({
        account: result.data,
        message: result.message ?? 'Account updated successfully',
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update account';
      setSubmitError(message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Account</DialogTitle>
      <form onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
            <TextField
              label="Account Name"
              fullWidth
              required
              disabled={!account || isSubmitting}
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
                  disabled={!account || isSubmitting}
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
                  disabled={!account || isSubmitting}
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
                  disabled={!account || isSubmitting}
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
              disabled={!account || isSubmitting}
              {...register('firstYear', { valueAsNumber: true })}
              error={Boolean(errors.firstYear)}
              helperText={errors.firstYear?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !account}>
            {isSubmitting ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditAccountDialog;
