import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';
import SignupClientWrapper from '../SignupClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  const params = await searchParams;
  const accountId = params.get('accountId') ?? undefined;
  let title = `Sign Up - ${DEFAULT_SITE_NAME}`;
  let description = `Create a ${DEFAULT_SITE_NAME} account to streamline scheduling, rosters, communications, and workouts for your organization.`;
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Sign Up - ${accountName}`;
      description = `Join ${accountName} on ${DEFAULT_SITE_NAME} to manage schedules, rosters, workouts, and communications in one place.`;
      keywords = [
        `${accountName} registration`,
        `${accountName} sign up`,
        `${DEFAULT_SITE_NAME} signup`,
      ];
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
