import { getAccountName } from '../../../lib/metadataFetchers';
import { Suspense } from 'react';
import LoginClientWrapper from '../LoginClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Sign In - Draco Sports Manager';
  if (accountId) {
    const accountName = await getAccountName(accountId);
    if (accountName) {
      title = `Sign In - ${accountName}`;
    }
  }
  return { title };
}

export default function Page() {
  return (
    <Suspense>
      <LoginClientWrapper />
    </Suspense>
  );
}
