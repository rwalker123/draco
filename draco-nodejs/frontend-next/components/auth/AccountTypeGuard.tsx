'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAccount } from '../../context/AccountContext';

type AccountTypeValue = 'golf' | 'baseball';

interface AccountTypeGuardProps {
  children: React.ReactNode;
  requiredAccountType: AccountTypeValue | AccountTypeValue[];
  redirectUrl?: string;
}

const AccountTypeGuardContent: React.FC<AccountTypeGuardProps> = ({
  children,
  requiredAccountType,
  redirectUrl,
}) => {
  const router = useRouter();
  const params = useParams();
  const { currentAccount, loading: accountLoading, initialized: accountInitialized } = useAccount();

  const accountId = useMemo(() => {
    const id = params?.accountId;
    return Array.isArray(id) ? id[0] : id;
  }, [params?.accountId]);

  const requiredTypes = useMemo(() => {
    return Array.isArray(requiredAccountType) ? requiredAccountType : [requiredAccountType];
  }, [requiredAccountType]);

  type Evaluation =
    | { status: 'pending' }
    | { status: 'redirect'; url: string }
    | { status: 'authorized' };

  const evaluation: Evaluation = useMemo(() => {
    if (!accountInitialized || accountLoading) {
      return { status: 'pending' };
    }

    if (!currentAccount) {
      return { status: 'pending' };
    }

    const currentType = currentAccount.accountType?.toLowerCase() ?? '';
    const hasMatchingType = requiredTypes.some((requiredType) =>
      currentType.includes(requiredType.toLowerCase()),
    );

    if (!hasMatchingType) {
      const defaultRedirect = accountId ? `/account/${accountId}` : '/accounts';
      return { status: 'redirect', url: redirectUrl ?? defaultRedirect };
    }

    return { status: 'authorized' };
  }, [accountInitialized, accountLoading, currentAccount, requiredTypes, accountId, redirectUrl]);

  useEffect(() => {
    if (evaluation.status === 'redirect') {
      router.replace(evaluation.url);
    }
  }, [evaluation, router]);

  if (evaluation.status === 'pending') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return evaluation.status === 'authorized' ? <>{children}</> : null;
};

export const AccountTypeGuard: React.FC<AccountTypeGuardProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AccountTypeGuardContent {...props} />
    </Suspense>
  );
};

export default AccountTypeGuard;
