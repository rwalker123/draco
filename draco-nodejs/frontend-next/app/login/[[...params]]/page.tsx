import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../lib/seoMetadata';
import LoginClientWrapper from '../LoginClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Sign In - Draco Sports Manager';
  let description =
    'Access Draco Sports Manager to stay in sync with team schedules, communications, and player development.';
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Sign In - ${accountName}`;
      description = `Securely sign in to ${accountName} on Draco Sports Manager to manage rosters, schedules, and communications.`;
      keywords = [`${accountName} login`, `${accountName} portal`, 'Draco Sports Manager login'];
    }
    if (iconUrl) {
      icons = { icon: iconUrl };
    }
  }
  return buildSeoMetadata({
    title,
    description,
    path: '/login',
    icon: icons?.icon,
    index: false,
    keywords,
  });
}

export default function Page() {
  return (
    <Suspense>
      <LoginClientWrapper />
    </Suspense>
  );
}
