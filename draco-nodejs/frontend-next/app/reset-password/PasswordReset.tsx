'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPasswordWithToken,
} from '@draco/shared-api-client';
import AccountPageHeader from '../../components/AccountPageHeader';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';

interface PasswordResetProps {
  onResetSuccess?: () => void;
  accountId?: string;
  next?: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onResetSuccess, accountId, next }) => {
  const router = useRouter();
  const apiClient = useApiClient();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const steps = ['Request Reset', 'Verify Token', 'Set New Password'];

  const handleRequestReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await requestPasswordReset({
        client: apiClient,
        body: {
          email: trimmedEmail,
        },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to request password reset. Please try again.');

      if (data === true) {
        setSuccess('If an account with that email exists, a password reset link has been sent.');
        setActiveStep(1);
        return;
      }

      if (typeof data === 'object' && data !== null && 'success' in data) {
        const { success: succeeded, message } = data as { success: boolean; message?: string };
        if (succeeded) {
          setSuccess(
            message ?? 'If an account with that email exists, a password reset link has been sent.',
          );
          setActiveStep(1);
        } else {
          setError(message ?? 'Failed to request password reset.');
        }
        return;
      }

      setSuccess('Password reset request processed. Check your email for further instructions.');
      setActiveStep(1);
    } catch (caughtError) {
      console.error('Password reset request failed:', caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while requesting a password reset.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Please enter the reset token');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await verifyPasswordResetToken({
        client: apiClient,
        body: { token: trimmedToken },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to verify the reset token. Please try again.');

      if (data.valid) {
        setToken(trimmedToken);
        setSuccess('Token verified successfully');
        setActiveStep(2);
      } else {
        setError('Invalid or expired reset token');
      }
    } catch (caughtError) {
      console.error('Password reset token verification failed:', caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while verifying the token.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter both passwords');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Reset token is missing or invalid. Please request a new token.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await resetPasswordWithToken({
        client: apiClient,
        body: {
          token: trimmedToken,
          newPassword,
        },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to reset password. Please try again.');

      if (data) {
        setSuccess('Password reset successfully! You can now log in with your new password.');
        if (onResetSuccess) {
          onResetSuccess();
        }
        setTimeout(() => {
          router.push(
            `/login${accountId ? `?accountId=${accountId}` : ''}${
              next ? `${accountId ? '&' : '?'}next=${encodeURIComponent(next)}` : ''
            }`,
          );
        }, 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (caughtError) {
      console.error('Password reset failed:', caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while resetting the password.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Request Password Reset
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {"Enter your email address and we'll send you a password reset link."}
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              autoComplete="email"
              required
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestReset}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Enter Reset Token
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Check your email for the reset token and enter it below.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {"If you don't see the email, check your spam folder."}
            </Typography>
            <TextField
              fullWidth
              label="Reset Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyToken}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Token'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set New Password
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Enter your new password below.
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              autoComplete="new-password"
              required
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              autoComplete="new-password"
              required
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {accountId ? (
        <AccountPageHeader accountId={accountId} seasonName={''} showSeasonInfo={false}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Password Reset
            </Typography>
          </Box>
        </AccountPageHeader>
      ) : (
        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Password Reset
          </Typography>
        </Box>
      )}
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: accountId ? 8 : 4 }}>
        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link
                href={`/login${accountId ? `?accountId=${accountId}` : ''}${
                  next ? `${accountId ? '&' : '?'}next=${encodeURIComponent(next)}` : ''
                }`}
                sx={{ cursor: 'pointer' }}
              >
                Back to Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </main>
  );
};

export default PasswordReset;
