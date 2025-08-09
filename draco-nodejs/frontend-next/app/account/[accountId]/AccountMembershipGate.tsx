'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isPublicRoute } from '../../../config/routePermissions';
import { useAuth } from '../../../context/AuthContext';
import { AccountRegistrationService, SelfRegisterInput, CombinedRegistrationPayload } from '../../../services/accountRegistrationService';

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
        const contact = await AccountRegistrationService.fetchMyContact(accountId, token || undefined);
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

  const handleSelfRegister = useCallback(async (input: SelfRegisterInput) => {
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
  }, [accountId, token]);

  const handleCombinedRegister = useCallback(async (payload: CombinedRegistrationPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { token: newToken } = await AccountRegistrationService.combinedRegister(accountId, payload);
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
  }, [accountId, fetchUser]);

  const content = useMemo(() => {
    if (isPublic) return <>{children}</>; // Never gate public routes
    if (isMember === null) return null; // initial
    if (isMember) return <>{children}</>;

    // Not a member
    if (user) {
      // Logged in: show self-register minimal form
      return (
        <div style={{ padding: 16 }}>
          <h3>You&apos;re not registered with this organization yet</h3>
          <p>Register to continue.</p>
          <SelfRegisterForm onSubmit={handleSelfRegister} loading={loading} error={error} />
        </div>
      );
    }

    // Not logged in: show combined flow tabs
    return (
      <div style={{ padding: 16 }}>
        <h3>Register to this organization</h3>
        <CombinedRegistration onSubmit={handleCombinedRegister} loading={loading} error={error} />
      </div>
    );
  }, [isPublic, isMember, user, children, loading, error, handleSelfRegister, handleCombinedRegister]);

  return <>{content}</>;
}

function SelfRegisterForm({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (input: SelfRegisterInput) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ firstName, middleName: middleName || undefined, lastName, email: email || undefined });
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

function CombinedRegistration({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (payload: CombinedRegistrationPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [mode, setMode] = useState<'newUser' | 'existingUser'>('newUser');

  const [email, setEmail] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button disabled={mode === 'newUser'} onClick={() => setMode('newUser')}>
          Create login + register
        </button>
        <button disabled={mode === 'existingUser'} onClick={() => setMode('existingUser')}>
          I&apos;m already a user
        </button>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (mode === 'newUser') {
            await onSubmit({ mode, email, password, firstName, middleName: middleName || undefined, lastName });
          } else {
            await onSubmit({ mode, usernameOrEmail, password, firstName, middleName: middleName || undefined, lastName: lastName || undefined });
          }
        }}
      >
        {mode === 'newUser' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Username or Email" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required={mode === 'newUser'} />
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Submitting...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}


