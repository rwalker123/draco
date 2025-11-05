import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';
import { getFirstQueryValue, type MetadataSearchParams } from '../../../lib/metadataParams';
import LoginClientWrapper from '../LoginClientWrapper';

export async function generateMetadata({ searchParams }: { searchParams: MetadataSearchParams }) {
  const accountId = await getFirstQueryValue(searchParams, 'accountId');
  let title = `Sign In - ${DEFAULT_SITE_NAME}`;
  let description = `Access ${DEFAULT_SITE_NAME} to stay in sync with team schedules, communications, and player development.`;
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Sign In - ${accountName}`;
      description = `Securely sign in to ${accountName} on ${DEFAULT_SITE_NAME} to manage rosters, schedules, and communications.`;
      keywords = [`${accountName} login`, `${accountName} portal`, `${DEFAULT_SITE_NAME} login`];
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
