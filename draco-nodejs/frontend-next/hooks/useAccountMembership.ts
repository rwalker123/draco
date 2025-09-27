import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AccountRegistrationService } from '../services/accountRegistrationService';

export function useAccountMembership(accountId?: string | null) {
  const { user, token } = useAuth();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!accountId) {
        setIsMember(null);
        return;
      }
      if (!user || !token) {
        setIsMember(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const contact = await AccountRegistrationService.fetchMyContact(accountId, token);
        if (!mounted) return;
        setIsMember(!!contact);
      } catch {
        if (!mounted) return;
        setError('Failed to check membership');
        setIsMember(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [accountId, user, token]);

  return { isMember, loading, error } as const;
}
