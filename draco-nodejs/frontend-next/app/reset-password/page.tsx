import React, { Suspense } from 'react';
import PasswordReset from './PasswordReset';

export default function Page({
  searchParams,
}: {
  searchParams: { accountId?: string; next?: string };
}) {
  return (
    <Suspense>
      <PasswordReset accountId={searchParams.accountId} next={searchParams.next} />
    </Suspense>
  );
}
