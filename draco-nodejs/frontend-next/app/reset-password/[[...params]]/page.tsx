import { getAccountBranding } from '../../../lib/metadataFetchers';
import { Suspense } from 'react';
import ResetPasswordClientWrapper from '../ResetPasswordClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Password Reset - Draco Sports Manager';
  let icons: { icon: string } | undefined;
  if (accountId) {
    const { name: accountName, iconUrl } = await getAccountBranding(accountId);
    if (accountName) {
      title = `Password Reset - ${accountName}`;
    }
    if (iconUrl) {
      icons = { icon: iconUrl };
    }
  }
  return {
    title,
    ...(icons ? { icons } : {}),
  };
}

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordClientWrapper />
    </Suspense>
  );
}
