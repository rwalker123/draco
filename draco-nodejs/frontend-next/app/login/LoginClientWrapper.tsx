'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from '../../context/AccountContext';
import Login from './Login';
import { axiosInstance } from '../../utils/axiosConfig';

export default function LoginClientWrapper() {
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId') || undefined;
  const next = searchParams.get('next') || undefined;
  const accountId =
    accountIdParam ||
    (next ? (next.match(/\/account\/([^/]+)/)?.[1] as string | undefined) : undefined);
  const { setCurrentAccount } = useAccount();

  // Set the account in context when accountId is present in query string
  useEffect(() => {
    const fetchAndSetAccount = async () => {
      if (accountId) {
        try {
          const response = await axiosInstance.get(`/api/accounts/${accountId}`);
          if (response.data.success) {
            setCurrentAccount({
              id: response.data.data.account.id,
              name: response.data.data.account.name,
              accountType: response.data.data.account.accountType,
            });
          }
        } catch (error) {
          console.error('Failed to fetch account:', error);
        }
      }
    };
    fetchAndSetAccount();
  }, [accountId, setCurrentAccount]);

  return <Login accountId={accountId} next={next} />;
}
