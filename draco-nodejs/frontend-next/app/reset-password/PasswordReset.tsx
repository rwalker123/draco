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
} from '@mui/material';
import axios from 'axios';

interface PasswordResetProps {
  onResetSuccess?: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onResetSuccess }) => {
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
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/api/passwordReset/request`, {
        email,
        testMode: true,
      });

      if (response.data.success) {
        if (response.data.testData) {
          setSuccess(`Password reset token generated (TEST MODE): ${response.data.testData.token}`);
          setToken(response.data.testData.token);
          setActiveStep(1);
        } else {
          setSuccess(response.data.message);
          setActiveStep(1);
        }
      } else {
        setError(response.data.message || 'Failed to request password reset');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token) {
      setError('Please enter the reset token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/passwordReset/verify/${token}`);

      if (response.data.success) {
        setSuccess('Token verified successfully');
        setActiveStep(2);
      } else {
        setError(response.data.message || 'Invalid token');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
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

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/api/passwordReset/reset`, {
        token,
        newPassword,
      });

      if (response.data.success) {
        setSuccess('Password reset successfully! You can now log in with your new password.');
        if (onResetSuccess) {
          onResetSuccess();
        }
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }
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
              Enter your email address and we&apos;ll send you a password reset link.
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
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
              If you don&apos;t see the email, check your spam folder.
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
              required
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
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
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Password Reset
          </Typography>

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
        </Paper>
      </Box>
    </main>
  );
};

export default PasswordReset;
