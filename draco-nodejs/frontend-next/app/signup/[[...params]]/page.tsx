import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../lib/seoMetadata';
import SignupClientWrapper from '../SignupClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Sign Up - Draco Sports Manager';
  let description =
    'Create a Draco Sports Manager account to streamline scheduling, rosters, communications, and workouts for your organization.';
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Sign Up - ${accountName}`;
      description = `Join ${accountName} on Draco Sports Manager to manage schedules, rosters, workouts, and communications in one place.`;
      keywords = [`${accountName} registration`, `${accountName} sign up`, 'Draco Sports Manager signup'];
    }
    if (iconUrl) {
      icons = { icon: iconUrl };
    }
  }
  return buildSeoMetadata({
    title,
    description,
    path: '/signup',
    icon: icons?.icon,
    keywords,
  });
}

export default function Page() {
  return (
    <Suspense>
      <SignupClientWrapper />
    </Suspense>
  );
}
