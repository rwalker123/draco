import { getAccountName } from '../../../../lib/metadataFetchers';
import AccountHomeClientWrapper from './AccountHomeClientWrapper';

// Dynamically set the page title to "{Account Name} Home"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Home`,
  };
}

export default function Page() {
  return <AccountHomeClientWrapper />;
}
