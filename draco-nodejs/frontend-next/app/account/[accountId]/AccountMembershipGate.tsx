'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';
import { isPublicRoute } from '../../../config/routePermissions';
import { useAuth } from '../../../context/AuthContext';
import { useRole } from '../../../context/RoleContext';
import {
  AccountRegistrationService,
  SelfRegisterInput,
  CombinedRegistrationPayload,
} from '../../../services/accountRegistrationService';
import { RegistrationForm } from '../../../components/account/RegistrationForm';

interface Props {
  accountId: string;
  children: React.ReactNode;
}

export default function AccountMembershipGate({ accountId, children }: Props) {
  const { user, token, fetchUser } = useAuth();
  const { hasRole } = useRole();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showRegistration = (searchParams?.get('register') || '') === '1';
  const currentPath = (pathname as string) || '';
  const isPublic = isPublicRoute(currentPath);
  const isGlobalAdministrator = hasRole('Administrator');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (isPublic) {
          // No gating for public routes
          setIsMember(true);
          return;
        }
        if (isGlobalAdministrator) {
          setIsMember(true);
          return;
        }
        if (!user) {
          // Do not redirect unauthenticated users. Allow existing route-level protection to handle auth.
          // Only show registration UI if explicitly requested via ?register=1; otherwise render page content.
          setIsMember(!showRegistration);
          return;
        }
        const contact = await AccountRegistrationService.fetchMyContact(
          accountId,
          token || undefined,
        );
        if (!mounted) return;
        setIsMember(!!contact);
      } catch {
        if (!mounted) return;
        setError('Failed to check membership');
        setIsMember(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [
    accountId,
    token,
    user,
    router,
    currentPath,
    showRegistration,
    isPublic,
    isGlobalAdministrator,
  ]);

  const handleSelfRegister = useCallback(
    async (input: SelfRegisterInput) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        await AccountRegistrationService.selfRegister(accountId, input, token);
        setIsMember(true);
      } catch (err: unknown) {
        // Extract specific error message from backend if available
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [accountId, token],
  );

  const handleCombinedRegister = useCallback(
    async (payload: CombinedRegistrationPayload, captchaToken?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const { token: newToken } = await AccountRegistrationService.combinedRegister(
          accountId,
          payload,
          captchaToken ?? undefined,
        );
        if (newToken) {
          // Persist token and refresh user
          localStorage.setItem('jwtToken', newToken);
          await fetchUser();
        }
        setIsMember(true);
      } catch (err: unknown) {
        // Extract specific error message from backend if available
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [accountId, fetchUser],
  );

  const content = useMemo(() => {
    if (isPublic) return <>{children}</>; // Never gate public routes
    if (isGlobalAdministrator) return <>{children}</>;
    if (isMember === null) return null; // initial
    if (isMember) return <>{children}</>;

    // Not a member - show registration form
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {user
              ? "You're not registered with this organization yet"
              : 'Register to this organization'}
          </Typography>
          {user && (
            <Typography variant="body1" color="text.secondary">
              Register to continue.
            </Typography>
          )}
        </Box>
        {user ? (
          <RegistrationForm
            isAuthenticated={true}
            onSubmit={handleSelfRegister}
            loading={loading}
            error={error}
          />
        ) : (
          <RegistrationForm
            isAuthenticated={false}
            onSubmit={handleCombinedRegister}
            loading={loading}
            error={error}
            requireCaptcha={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
          />
        )}
      </Container>
    );
  }, [
    isPublic,
    isMember,
    isGlobalAdministrator,
    user,
    children,
    loading,
    error,
    handleSelfRegister,
    handleCombinedRegister,
  ]);

  return <>{content}</>;
}
