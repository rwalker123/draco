'use client';
import React, { use } from 'react';
import AccountLogoHeader from '../../../components/AccountLogoHeader';
import { usePathname } from 'next/navigation';

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const pathname = usePathname();

  // Hide logo on team page and subroutes
  const isTeamPage = /\/account\/[^/]+\/seasons\/[^/]+\/teams\/[^/]+(\/|$)/.test(pathname);

  return (
    <>
      {!isTeamPage && <AccountLogoHeader accountId={accountId} />}
      {children}
    </>
  );
}
