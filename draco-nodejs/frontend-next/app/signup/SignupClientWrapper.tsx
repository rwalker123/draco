'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { getAccountById } from '@draco/shared-api-client';
import { useAccount } from '../../context/AccountContext';
import Signup from './Signup';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { DEFAULT_TIMEZONE } from '../../utils/timezones';

export default function SignupClientWrapper() {
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

        if (!isMounted) {
          return;
        }

        const data = unwrapApiResult(result, 'Failed to fetch account');
        const account = data.account;
        const resolvedTimeZone = account.configuration?.timeZone;
        setCurrentAccount({
          id: account.id,
          name: account.name,
          accountType: account.configuration?.accountType?.name ?? undefined,
          timeZone: resolvedTimeZone ?? DEFAULT_TIMEZONE,
          timeZoneSource: 'account',
        });
      } catch (error) {
        console.error('Failed to fetch account:', error);
      }
    };
    fetchAndSetAccount();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient, setCurrentAccount]);

  return <Signup accountId={accountId} next={next} />;
}
