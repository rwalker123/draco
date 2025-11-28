import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import VerifyWorkoutRegistrationClientWrapper from './VerifyWorkoutRegistrationClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; workoutId: string; registrationId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `${accountName} workout registration verification and editing.`;

  return buildSeoMetadata({
    title: `${accountName} - Verify Workout Registration`,
    description,
    path: `/account/${accountId}/workouts/${params.workoutId}/verify-registration/${params.registrationId}`,
    icon: iconUrl,
    index: false,
  });
}

export default function VerifyWorkoutRegistrationPage() {
  return <VerifyWorkoutRegistrationClientWrapper />;
}
