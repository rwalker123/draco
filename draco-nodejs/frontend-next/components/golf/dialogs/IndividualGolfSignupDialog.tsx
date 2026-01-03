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
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import { useAuth } from '../../../context/AuthContext';
import TurnstileChallenge from '../../security/TurnstileChallenge';

interface IndividualGolfSignupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { token?: string; accountId: string }) => void;
}

const IndividualGolfSignupDialog: React.FC<IndividualGolfSignupDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user, setAuthToken, token } = useAuth();
  const { create, createAuthenticated } = useIndividualGolfAccountService();

  const isAuthenticated = Boolean(user && token);

  const initialName = useMemo(() => {
    if (!user?.contact) return '';
    const { firstName, lastName, middleName } = user.contact;
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  }, [user?.contact]);

  const initialEmail = useMemo(() => {
    return user?.userName ?? '';
  }, [user?.userName]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireCaptcha = !isAuthenticated && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail(initialEmail);
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      setCaptchaError(null);
    }
  }, [open, initialName, initialEmail]);

  const handleClose = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
    setCaptchaError(null);
    onClose();
  }, [onClose]);

  const validateForm = useCallback(() => {
    if (!isAuthenticated) {
      if (!name.trim()) {
        setError('Name is required');
        return false;
      }
      if (!email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!password) {
        setError('Password is required');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  }, [isAuthenticated, name, email, password, confirmPassword]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (requireCaptcha && !captchaToken) {
      setCaptchaError('Please verify that you are human before continuing.');
      setCaptchaResetKey((key) => key + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        const result = await createAuthenticated({
          name: name.trim() || undefined,
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
      } else {
        const result = await create({
          name: name.trim(),
          email: email.trim(),
          password,
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

  const handleCaptchaChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      setCaptchaError(null);
    }
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
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
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isAuthenticated}
              fullWidth
              autoFocus
              disabled={loading}
              placeholder="John Smith"
              helperText={isAuthenticated ? 'Leave blank to use your existing name' : undefined}
            />

            {!isAuthenticated && (
              <>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  disabled={loading}
                  placeholder="john@example.com"
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  disabled={loading}
                  helperText="At least 6 characters"
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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
              </>
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
