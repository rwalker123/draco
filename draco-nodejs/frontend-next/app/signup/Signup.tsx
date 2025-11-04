'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AccountPageHeader from '../../components/AccountPageHeader';
import TurnstileChallenge from '../../components/security/TurnstileChallenge';
import { useSignupService } from '../../hooks/useSignupService';

const Signup: React.FC<{ accountId?: string; next?: string }> = ({ accountId, next }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const requireCaptcha = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const router = useRouter();
  const { register } = useSignupService();

  useEffect(() => {
    if (requireCaptcha) {
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      setCaptchaError(null);
    }
  }, [requireCaptcha]);

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      setCaptchaError(null);
    }
  }, []);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    if (requireCaptcha && !captchaToken) {
      setCaptchaError('Please verify that you are human before continuing.');
      setCaptchaResetKey((key) => key + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await register({
        email: formData.email.trim(),
        password: formData.password,
        captchaToken: requireCaptcha ? captchaToken : null,
      });

      if (result.success) {
        setSuccess(true);
        if (requireCaptcha) {
          setCaptchaToken(null);
          setCaptchaResetKey((key) => key + 1);
        }
        setTimeout(() => {
          router.push(next || '/login');
        }, 2000);
      } else {
        setError(result.error);
        if (requireCaptcha) {
          setCaptchaToken(null);
          setCaptchaResetKey((key) => key + 1);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background">
        {accountId ? (
          <AccountPageHeader accountId={accountId} seasonName={''} showSeasonInfo={false}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Sign Up
              </Typography>
            </Box>
          </AccountPageHeader>
        ) : (
          <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Sign Up
            </Typography>
          </Box>
        )}
        <Paper sx={{ maxWidth: 400, mx: 'auto', mt: accountId ? 8 : 4, p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="primary">
            Sign Up Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You can now sign in with your new account.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </Paper>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {accountId ? (
        <AccountPageHeader accountId={accountId} seasonName={''} showSeasonInfo={false}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Sign Up
            </Typography>
            <Typography align="center" color="white" sx={{ mb: 3 }}>
              Join ezRecSports.com to sign up and manage your sports organization
            </Typography>
          </Box>
        </AccountPageHeader>
      ) : (
        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Sign Up
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Join ezRecSports.com to sign up and manage your sports organization
          </Typography>
        </Box>
      )}
      <Paper sx={{ maxWidth: 400, mx: 'auto', mt: accountId ? 8 : 4, p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          margin="normal"
          autoComplete="email"
          required
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          margin="normal"
          autoComplete="new-password"
          required
          helperText="Password must be at least 6 characters long"
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          margin="normal"
          autoComplete="new-password"
          required
        />

        {requireCaptcha && (
          <Box sx={{ mt: 2 }}>
            {captchaError && (
              <Alert severity="error" onClose={() => setCaptchaError(null)} sx={{ mb: 2 }}>
                {captchaError}
              </Alert>
            )}
            <TurnstileChallenge
              onTokenChange={handleCaptchaTokenChange}
              resetSignal={captchaResetKey}
              loading={loading}
            />
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSignup}
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              href={`/login${accountId ? `?accountId=${accountId}` : ''}${next ? `${accountId ? '&' : '?'}next=${encodeURIComponent(next)}` : ''}`}
              sx={{ cursor: 'pointer' }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </main>
  );
};

export default Signup;
