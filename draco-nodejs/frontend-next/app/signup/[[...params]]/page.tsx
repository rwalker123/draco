import { getAccountName } from '../../../lib/metadataFetchers';
import { Suspense } from 'react';
import SignupClientWrapper from '../SignupClientWrapper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  console.log('searchParams', await searchParams);
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const { accountId } = (await searchParams) as any;
  let title = 'Sign Up - Draco Sports Manager';
  if (accountId) {
    const accountName = await getAccountName(accountId);
    if (accountName) {
      title = `Sign Up - ${accountName}`;
    }
  }
  return { title };
}

export default function Page() {
  return (
    <Suspense>
      <SignupClientWrapper />
    </Suspense>
  );
}
