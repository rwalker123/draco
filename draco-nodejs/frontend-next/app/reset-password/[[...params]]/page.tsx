import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';
import { getFirstQueryValue, type MetadataSearchParams } from '../../../lib/metadataParams';
import ResetPasswordClientWrapper from '../ResetPasswordClientWrapper';

export async function generateMetadata({ searchParams }: { searchParams: MetadataSearchParams }) {
  const accountId = await getFirstQueryValue(searchParams, 'accountId');
  let title = `Password Reset - ${DEFAULT_SITE_NAME}`;
  let description = `Reset your ${DEFAULT_SITE_NAME} password to regain access to your sports organization tools.`;
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Password Reset - ${accountName}`;
      description = `Reset the password for your ${accountName} ${DEFAULT_SITE_NAME} account to continue managing teams and communications.`;
      keywords = [
        `${accountName} password reset`,
        `${accountName} account recovery`,
        `${DEFAULT_SITE_NAME} password`,
      ];
    }
    if (iconUrl) {
      icons = { icon: iconUrl };
    }
  }
  return buildSeoMetadata({
    title,
    description,
    path: '/reset-password',
    icon: icons?.icon,
    index: false,
    keywords,
  });
}

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordClientWrapper />
    </Suspense>
  );
}
