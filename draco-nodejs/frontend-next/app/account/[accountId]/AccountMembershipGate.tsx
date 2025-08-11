'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isPublicRoute } from '../../../config/routePermissions';
import { useAuth } from '../../../context/AuthContext';
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
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showRegistration = (searchParams?.get('register') || '') === '1';
  const currentPath = (pathname as string) || '';
  const isPublic = isPublicRoute(currentPath);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (isPublic) {
          // No gating for public routes
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
  }, [accountId, token, user, router, currentPath, showRegistration, isPublic]);

  const handleSelfRegister = useCallback(
    async (input: SelfRegisterInput) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        await AccountRegistrationService.selfRegister(accountId, input, token);
        setIsMember(true);
      } catch {
        setError('Registration failed');
      } finally {
        setLoading(false);
      }
    },
    [accountId, token],
  );

  const handleCombinedRegister = useCallback(
    async (payload: CombinedRegistrationPayload) => {
      setLoading(true);
      setError(null);
      try {
        const { token: newToken } = await AccountRegistrationService.combinedRegister(
          accountId,
          payload,
        );
        if (newToken) {
          // Persist token and refresh user
          localStorage.setItem('jwtToken', newToken);
          await fetchUser();
        }
        setIsMember(true);
      } catch {
        setError('Registration failed');
      } finally {
        setLoading(false);
      }
    },
    [accountId, fetchUser],
  );

  const content = useMemo(() => {
    if (isPublic) return <>{children}</>; // Never gate public routes
    if (isMember === null) return null; // initial
    if (isMember) return <>{children}</>;

    // Not a member - show registration form
    return (
      <div style={{ padding: 16 }}>
        <h3>
          {user
            ? "You're not registered with this organization yet"
            : 'Register to this organization'}
        </h3>
        {user && <p>Register to continue.</p>}
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
          />
        )}
      </div>
    );
  }, [
    isPublic,
    isMember,
    user,
    children,
    loading,
    error,
    handleSelfRegister,
    handleCombinedRegister,
  ]);

  return <>{content}</>;
}
