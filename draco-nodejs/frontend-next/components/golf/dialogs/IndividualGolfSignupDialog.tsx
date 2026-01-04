'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateIndividualGolfAccountSchema } from '@draco/shared-schemas';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import { useAuth } from '../../../context/AuthContext';
import TurnstileChallenge from '../../security/TurnstileChallenge';

interface IndividualGolfSignupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { token?: string; accountId: string }) => void;
}

const IndividualGolfSignupFormSchema = CreateIndividualGolfAccountSchema.omit({
  timezone: true,
  homeCourseId: true,
})
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type IndividualGolfSignupFormType = z.infer<typeof IndividualGolfSignupFormSchema>;

const AuthenticatedFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
});

type AuthenticatedFormType = z.infer<typeof AuthenticatedFormSchema>;

const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

const IndividualGolfSignupDialog: React.FC<IndividualGolfSignupDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user, setAuthToken, token } = useAuth();
  const { create, createAuthenticated } = useIndividualGolfAccountService();

  const isAuthenticated = Boolean(user && token);

  const existingContact = useMemo(() => {
    if (!user?.contact) return null;
    return {
      firstName: user.contact.firstName ?? '',
      middleName: user.contact.middleName ?? '',
      lastName: user.contact.lastName ?? '',
    };
  }, [user?.contact]);

  const initialEmail = useMemo(() => {
    return user?.userName ?? '';
  }, [user?.userName]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IndividualGolfSignupFormType>({
    resolver: zodResolver(IndividualGolfSignupFormSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerAuth,
    handleSubmit: handleSubmitAuth,
    reset: resetAuth,
    formState: { errors: authErrors },
  } = useForm<AuthenticatedFormType>({
    resolver: zodResolver(AuthenticatedFormSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireCaptcha = !isAuthenticated && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset({
        firstName: existingContact?.firstName ?? '',
        middleName: existingContact?.middleName ?? '',
        lastName: existingContact?.lastName ?? '',
        email: initialEmail,
        password: '',
        confirmPassword: '',
      });
      resetAuth({
        firstName: existingContact?.firstName ?? '',
        middleName: existingContact?.middleName ?? '',
        lastName: existingContact?.lastName ?? '',
      });
      setError(null);
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      setCaptchaError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    reset({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    resetAuth({
      firstName: '',
      middleName: '',
      lastName: '',
    });
    setError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
    setCaptchaError(null);
    onClose();
  }, [onClose, reset, resetAuth]);

  const onSubmitUnauthenticated = async (data: IndividualGolfSignupFormType) => {
    if (requireCaptcha && !captchaToken) {
      setCaptchaError('Please verify that you are human before continuing.');
      setCaptchaResetKey((key) => key + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await create({
        firstName: data.firstName.trim(),
        middleName: data.middleName?.trim() || undefined,
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        timezone: getBrowserTimezone(),
        captchaToken,
      });

      if (!result.success) {
        setError(result.error);
        if (requireCaptcha) {
          setCaptchaToken(null);
          setCaptchaResetKey((key) => key + 1);
        }
        return;
      }

      setAuthToken(result.data.token);

      if (onSuccess) {
        onSuccess({
          token: result.data.token,
          accountId: result.data.account.id,
        });
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (requireCaptcha) {
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAuthenticated = async (data: AuthenticatedFormType) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createAuthenticated({
        firstName: data.firstName.trim() || undefined,
        middleName: data.middleName?.trim() || undefined,
        lastName: data.lastName.trim() || undefined,
        timezone: getBrowserTimezone(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (onSuccess) {
        onSuccess({
          accountId: result.data.account.id,
        });
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      setCaptchaError(null);
    }
  }, []);

  if (isAuthenticated) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmitAuth(onSubmitAuthenticated)}>
          <DialogTitle>Create Your Golf Account</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track your golf scores, calculate your handicap, and view your stats.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="First Name"
                  {...registerAuth('firstName')}
                  error={!!authErrors.firstName}
                  helperText={authErrors.firstName?.message}
                  fullWidth
                  autoFocus
                  disabled={loading}
                  placeholder="John"
                />
                <TextField
                  label="Middle Name"
                  {...registerAuth('middleName')}
                  error={!!authErrors.middleName}
                  helperText={authErrors.middleName?.message}
                  fullWidth
                  disabled={loading}
                  placeholder="(optional)"
                  sx={{ maxWidth: 150 }}
                />
              </Box>
              <TextField
                label="Last Name"
                {...registerAuth('lastName')}
                error={!!authErrors.lastName}
                helperText={authErrors.lastName?.message}
                fullWidth
                disabled={loading}
                placeholder="Smith"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmitUnauthenticated)}>
        <DialogTitle>Create Your Golf Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track your golf scores, calculate your handicap, and view your stats.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                fullWidth
                autoFocus
                disabled={loading}
                placeholder="John"
              />
              <TextField
                label="Middle Name"
                {...register('middleName')}
                error={!!errors.middleName}
                helperText={errors.middleName?.message}
                fullWidth
                disabled={loading}
                placeholder="(optional)"
                sx={{ maxWidth: 150 }}
              />
            </Box>
            <TextField
              label="Last Name"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              fullWidth
              disabled={loading}
              placeholder="Smith"
            />

            <TextField
              label="User Name"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
              disabled={loading}
              placeholder="Enter your email address"
            />

            <TextField
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message || 'At least 6 characters'}
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              fullWidth
              disabled={loading}
            />

            {requireCaptcha && (
              <Box sx={{ mt: 1 }}>
                <TurnstileChallenge
                  onTokenChange={handleCaptchaChange}
                  resetSignal={captchaResetKey}
                  error={captchaError}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || (requireCaptcha && !captchaToken)}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IndividualGolfSignupDialog;
