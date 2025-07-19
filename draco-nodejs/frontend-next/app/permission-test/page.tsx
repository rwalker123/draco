import React, { Suspense } from 'react';
import PermissionTest from './PermissionTest';

export default function Page() {
  return (
    <Suspense>
      <PermissionTest />
    </Suspense>
  );
}
