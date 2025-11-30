'use client';

import { useParams } from 'next/navigation';
import VerifyWorkoutRegistration from './VerifyWorkoutRegistration';

export default function VerifyWorkoutRegistrationClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const registrationId = Array.isArray(params.registrationId)
    ? params.registrationId[0]
    : params.registrationId;

  if (!accountId || !workoutId || !registrationId) {
    return <div>Missing required parameters</div>;
  }

  return (
    <VerifyWorkoutRegistration
      accountId={accountId}
      workoutId={workoutId}
      registrationId={registrationId}
    />
  );
}
