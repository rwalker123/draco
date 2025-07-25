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
import { useAuth } from '../../context/AuthContext';
import AccountPageHeader from '../../components/AccountPageHeader';

const Login: React.FC<{ accountId?: string; next?: string }> = ({ accountId, next }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      router.replace(next || '/accounts');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {accountId && <AccountPageHeader accountId={accountId} style={{ marginBottom: 1 }} />}
      <Paper sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Sign In
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleLogin}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/reset-password">Forgot your password?</Link>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/signup" underline="hover">
            {"Don't have an account? Sign Up"}
          </Link>
        </Box>
      </Paper>
    </main>
  );
};

export default Login;
