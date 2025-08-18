'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useRole } from '../../context/RoleContext';
import AccountPageHeader from '../../components/AccountPageHeader';
import {
  hasRouteAccess,
  getFallbackRoute,
  logSecurityEvent,
  extractAccountIdFromPath,
} from '../../utils/authHelpers';

const Login: React.FC<{ accountId?: string; next?: string }> = ({ accountId, next }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsRedirect, setNeedsRedirect] = useState(false);
  const router = useRouter();
  const { login, loading, error, user } = useAuth();
  const { userRoles, loading: roleLoading } = useRole();

  const validateAndRedirect = useCallback(() => {
    if (!user || roleLoading || !userRoles) return;

    let redirectPath = '/accounts'; // Default fallback

    if (next) {
      // Check if user has access to the requested route
      const roles = [
        ...userRoles.globalRoles,
        ...userRoles.contactRoles.map((role) => role.roleName || role.roleData),
      ];
      const hasAccess = hasRouteAccess(next, roles);

      if (hasAccess) {
        // User has permission, redirect to requested page
        redirectPath = next;
      } else {
        // User lacks permission, log security event and use fallback
        logSecurityEvent({
          type: 'unauthorized_access',
          route: next,
          userId: user.id,
          requiredRole: 'unknown',
        });

        // Extract accountId from the next parameter or use component prop as fallback
        const nextAccountId = extractAccountIdFromPath(next) || accountId;
        redirectPath = getFallbackRoute(!!nextAccountId, nextAccountId);
      }
    } else {
      // No specific route requested, use component accountId prop fallback
      redirectPath = getFallbackRoute(!!accountId, accountId);
    }

    router.replace(redirectPath);
  }, [user, roleLoading, userRoles, next, accountId, router]);

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      setNeedsRedirect(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  // Handle redirect after successful login when contexts are loaded
  useEffect(() => {
    if (needsRedirect && user && !roleLoading && userRoles) {
      validateAndRedirect();
      setNeedsRedirect(false);
    }
  }, [needsRedirect, user, roleLoading, userRoles, validateAndRedirect]);

  return (
    <main className="min-h-screen bg-background">
      {accountId ? (
        <AccountPageHeader accountId={accountId} seasonName={''} showSeasonInfo={false}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
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
