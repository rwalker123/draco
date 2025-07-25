'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from '../../context/AccountContext';
import Login from './Login';

export default function LoginClientWrapper() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId') || undefined;
  const next = searchParams.get('next') || undefined;
  const { setCurrentAccount } = useAccount();

  // Set the account in context when accountId is present in query string
  useEffect(() => {
    const fetchAndSetAccount = async () => {
      if (accountId) {
        try {
          const response = await fetch(`/api/accounts/${accountId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCurrentAccount({
                id: data.data.account.id,
                name: data.data.account.name,
                accountType: data.data.account.accountType,
              });
            }
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
