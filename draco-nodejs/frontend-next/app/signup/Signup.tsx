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
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AccountPageHeader from '../../components/AccountPageHeader';

const Signup: React.FC<{ accountId?: string; next?: string }> = ({ accountId, next }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email.trim(), // Use email as username
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(next || '/login');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to sign up');
      }
    } catch {
      setError('Failed to sign up. Please try again.');
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
              Join Draco Sports Manager to sign up and manage your sports organization
            </Typography>
          </Box>
        </AccountPageHeader>
      ) : (
        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Sign Up
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Join Draco Sports Manager to sign up and manage your sports organization
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
          required
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          margin="normal"
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
          required
        />

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
