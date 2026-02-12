'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { getAccountById } from '@draco/shared-api-client';
import { useAccount } from '../../context/AccountContext';
import PasswordReset from './PasswordReset';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { DEFAULT_TIMEZONE } from '../../utils/timezones';

export default function ResetPasswordClientWrapper() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId') || undefined;
  const next = searchParams.get('next') || undefined;
  const token = searchParams.get('token') || undefined;
  const { setCurrentAccount } = useAccount();
  const apiClient = useApiClient();

  useEffect(() => {
    if (!accountId) {
      return;
    }

    const controller = new AbortController();

    const fetchAndSetAccount = async () => {
      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

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
        if (controller.signal.aborted) return;
        console.error('Failed to fetch account:', error);
      }
    };
    fetchAndSetAccount();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, setCurrentAccount]);

  return <PasswordReset accountId={accountId} next={next} initialToken={token} />;
}
