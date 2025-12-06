'use client';

import React, { useEffect, useState } from 'react';
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
import AccountPageHeader from '../../components/AccountPageHeader';
import { usePasswordResetService } from '../../hooks/usePasswordResetService';

interface PasswordResetProps {
  onResetSuccess?: () => void;
  accountId?: string;
  next?: string;
  initialToken?: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({
  onResetSuccess,
  accountId,
  next,
  initialToken,
}) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(initialToken ? 1 : 0);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken?.trim() ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const { requestReset, verifyToken, resetPassword, loading, error, setErrorMessage, clearError } =
    usePasswordResetService();

  const steps = ['Request Reset', 'Verify Token', 'Set New Password'];

  useEffect(() => {
    let isMounted = true;

    const autoVerifyTokenFromQuery = async () => {
      const trimmedToken = initialToken?.trim();
      if (!trimmedToken) {
        return;
      }

      clearError();
      setSuccess('');
      setToken(trimmedToken);
      setActiveStep(1);

      const result = await verifyToken(trimmedToken);
      if (!isMounted) {
        return;
      }

      if (result.valid) {
        setToken(result.token ?? trimmedToken);
        setSuccess(result.message);
        setActiveStep(2);
      }
    };

    autoVerifyTokenFromQuery();

    return () => {
      isMounted = false;
    };
  }, [initialToken, verifyToken, clearError]);

  const handleRequestReset = async () => {
    clearError();
    setSuccess('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    const result = await requestReset(trimmedEmail, accountId);
    if (result.success) {
      setEmail(trimmedEmail);
      setSuccess(result.message);
      setActiveStep(1);
    }
  };

  const handleVerifyToken = async () => {
    clearError();
    setSuccess('');

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setErrorMessage('Please enter the reset token');
      return;
    }

    const result = await verifyToken(trimmedToken);
    if (result.valid) {
      setToken(result.token ?? trimmedToken);
      setSuccess(result.message);
      setActiveStep(2);
    }
  };

  const handleResetPassword = async () => {
    clearError();
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter both passwords');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setErrorMessage('Reset token is missing or invalid. Please request a new token.');
      return;
    }

    const result = await resetPassword(trimmedToken, newPassword);
    if (result.success) {
      setSuccess(result.message);
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
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
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
