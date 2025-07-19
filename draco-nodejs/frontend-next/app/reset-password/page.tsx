import React, { Suspense } from 'react';
import PasswordReset from './PasswordReset';

export default function Page() {
  return (
    <Suspense>
      <PasswordReset />
    </Suspense>
  );
}
