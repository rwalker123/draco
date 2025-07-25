import { getAccountName } from '../../../lib/metadataFetchers';
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
  if (accountId) {
    const accountName = await getAccountName(accountId);
    if (accountName) {
      title = `Password Reset - ${accountName}`;
    }
  }
  return { title };
}

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordClientWrapper />
    </Suspense>
  );
}
