'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import AccountMembershipGate from './AccountMembershipGate';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const accountId = (params?.accountId as string) || '';
  return <AccountMembershipGate accountId={accountId}>{children}</AccountMembershipGate>;
}
