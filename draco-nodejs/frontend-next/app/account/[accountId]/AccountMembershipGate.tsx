'use client';
import React, { useEffect, useState } from 'react';
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
    const controller = new AbortController();
    const run = async () => {
      try {
        if (isPublic) {
          setIsMember(true);
          return;
        }
        if (isGlobalAdministrator) {
          setIsMember(true);
          return;
        }
        if (!user) {
          setIsMember(!showRegistration);
          return;
        }
        const contact = await AccountRegistrationService.fetchMyContact(
          accountId,
          token || undefined,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setIsMember(!!contact);
      } catch {
        if (controller.signal.aborted) return;
        setError('Failed to check membership');
        setIsMember(false);
      }
    };
    void run();
    return () => {
      controller.abort();
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

  const handleSelfRegister = async (input: SelfRegisterInput) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await AccountRegistrationService.selfRegister(accountId, input, token);
      setIsMember(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCombinedRegister = async (
    payload: CombinedRegistrationPayload,
    captchaToken?: string | null,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { token: newToken } = await AccountRegistrationService.combinedRegister(
        accountId,
        payload,
        captchaToken ?? undefined,
        token ?? undefined,
      );
      if (newToken) {
        localStorage.setItem('jwtToken', newToken);
        await fetchUser();
      }
      setIsMember(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isPublic) return <>{children}</>;
  if (isGlobalAdministrator) return <>{children}</>;
  if (isMember === null) return null;
  if (isMember) return <>{children}</>;

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
          userName={user.userName ?? ''}
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
}
