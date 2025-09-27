import { Suspense } from 'react';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../lib/seoMetadata';
import ResetPasswordClientWrapper from '../ResetPasswordClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Password Reset - Draco Sports Manager';
  let description =
    'Reset your Draco Sports Manager password to regain access to your sports organization tools.';
  let icons: { icon: string } | undefined;
  let keywords: string[] | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Password Reset - ${accountName}`;
      description = `Reset the password for your ${accountName} Draco Sports Manager account to continue managing teams and communications.`;
      keywords = [`${accountName} password reset`, `${accountName} account recovery`, 'Draco Sports Manager password'];
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
