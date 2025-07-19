import React, { Suspense } from 'react';
import Signup from './Signup';

export default function Page() {
  return (
    <Suspense>
      <Signup />
    </Suspense>
  );
}
