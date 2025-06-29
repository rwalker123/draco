import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();

  // Get the page the user was trying to access before being redirected to sign in
  let from = '/dashboard';
  if (location.state && typeof location.state === 'object' && 'from' in location.state && location.state.from && typeof (location.state as { from?: { pathname?: string } }).from?.pathname === 'string') {
    from = (location.state as { from: { pathname: string } }).from.pathname;
  }

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      // Navigate back to the page they were trying to access, or dashboard as fallback
      navigate(from, { replace: true });
    }
    // error is handled by context
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Sign In
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
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
      </Paper>
    </Box>
  );
};

export default Login; 