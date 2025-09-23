'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { getAccountById } from '@draco/shared-api-client';
import { useAccount } from '../../context/AccountContext';
import PasswordReset from './PasswordReset';
import { useApiClient } from '../../hooks/useApiClient';

export default function ResetPasswordClientWrapper() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId') || undefined;
  const next = searchParams.get('next') || undefined;
  const { setCurrentAccount } = useAccount();
  const apiClient = useApiClient();

  // Set the account in context when accountId is present in query string
  useEffect(() => {
    let isMounted = true;

    const fetchAndSetAccount = async () => {
      if (!accountId) {
        return;
      }

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (!isMounted || !result.data) {
          return;
        }

        setCurrentAccount(result.data.account);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      }
    };
    fetchAndSetAccount();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient, setCurrentAccount]);

  return <PasswordReset accountId={accountId} next={next} />;
}
