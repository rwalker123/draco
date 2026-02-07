'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import AccountPageHeader from '../../components/AccountPageHeader';
import {
  hasRouteAccess,
  getFallbackRoute,
  logSecurityEvent,
  extractAccountIdFromPath,
} from '../../utils/authHelpers';
import { REMEMBER_ME_KEY } from '../../constants/storageKeys';

const Login: React.FC<{ accountId?: string; next?: string }> = ({ accountId, next }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  });
  const router = useRouter();
  const { login, loading, error, user } = useAuth();
  const { userRoles, loading: roleLoading } = useRole();

  const handleLogin = async () => {
    localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
    await login({ userName: email, password: password, rememberMe });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  useEffect(() => {
    if (!user || roleLoading || !userRoles) return;

    let redirectPath = '/accounts';

    if (next) {
      const roles = [
        ...userRoles.globalRoles,
        ...userRoles.contactRoles.map((role) => role.roleName || role.roleData),
      ];
      const hasAccess = hasRouteAccess(next, roles);

      if (hasAccess) {
        redirectPath = next;
      } else {
        logSecurityEvent({
          type: 'unauthorized_access',
          route: next,
          userId: user.userId,
          requiredRole: 'unknown',
        });

        const nextAccountId = extractAccountIdFromPath(next) || accountId;
        redirectPath = getFallbackRoute(!!nextAccountId, nextAccountId);
      }
    } else {
      redirectPath = getFallbackRoute(!!accountId, accountId);
    }

    router.replace(redirectPath);
  }, [user, roleLoading, userRoles, next, accountId, router]);

  return (
    <main className="min-h-screen bg-background">
      {accountId ? (
        <AccountPageHeader accountId={accountId} seasonName={''} showSeasonInfo={false}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Sign In
            </Typography>
          </Box>
        </AccountPageHeader>
      ) : (
        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Sign In
          </Typography>
        </Box>
      )}
      <Paper sx={{ maxWidth: 400, mx: 'auto', mt: accountId ? 8 : 4, p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="username"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
          />
          <FormControlLabel
            control={
              <Switch checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            }
            label="Remember Me"
            sx={{ mt: 1 }}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link
            href={`/reset-password${accountId ? `?accountId=${accountId}` : ''}${next ? `${accountId ? '&' : '?'}next=${encodeURIComponent(next)}` : ''}`}
          >
            Forgot your password?
          </Link>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link
            href={`/signup${accountId ? `?accountId=${accountId}` : ''}${next ? `${accountId ? '&' : '?'}next=${encodeURIComponent(next)}` : ''}`}
            underline="hover"
          >
            {"Don't have an account? Sign Up"}
          </Link>
        </Box>
      </Paper>
    </main>
  );
};

export default Login;
