import React, { Suspense } from 'react';
import RoleDebug from './RoleDebug';

export default function Page() {
  return (
    <Suspense>
      <RoleDebug />
    </Suspense>
  );
}
