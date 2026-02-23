import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AccountRegistrationService } from '../services/accountRegistrationService';
import { type ContactType } from '@draco/shared-schemas';

export function useAccountMembership(accountId?: string | null) {
  const { user, token } = useAuth();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactType | null>(null);

  useEffect(() => {
    if (!accountId || !user || !token) {
      setIsMember(accountId ? null : null);
      setContact(null);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await AccountRegistrationService.fetchMyContact(
          accountId,
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setContact(result);
        setIsMember(!!result);
      } catch {
        if (controller.signal.aborted) return;
        setError('Failed to check membership');
        setIsMember(null);
        setContact(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => {
      controller.abort();
    };
  }, [accountId, user, token]);

  return { isMember, loading, error, contact } as const;
}
