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
    let mounted = true;
    const run = async () => {
      if (!accountId) {
        setIsMember(null);
        setContact(null);
        return;
      }
      if (!user || !token) {
        setIsMember(null);
        setContact(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const contact = await AccountRegistrationService.fetchMyContact(accountId, token);
        if (!mounted) return;
        setContact(contact);
        setIsMember(!!contact);
      } catch {
        if (!mounted) return;
        setError('Failed to check membership');
        setIsMember(null);
        setContact(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [accountId, user, token]);

  return { isMember, loading, error, contact } as const;
}
