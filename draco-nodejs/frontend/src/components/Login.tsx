import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
    // error is handled by context
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
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
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/reset-password">Forgot your password?</Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login; 