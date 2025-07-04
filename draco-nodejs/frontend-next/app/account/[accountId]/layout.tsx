'use client';
import React, { use } from 'react';
import AccountLogoHeader from '../../../components/AccountLogoHeader';

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);

  return (
    <>
      <AccountLogoHeader accountId={accountId} />
      {children}
    </>
  );
}
