import type { Metadata } from 'next';
import AccountsClientWrapper from './AccountsClientWrapper';
import { DEFAULT_ACCOUNT_FAVICON_PATH } from '../../lib/metadataFetchers';

export function generateMetadata(): Metadata {
  return {
    title: 'Accounts - Draco Sports Manager',
    icons: { icon: DEFAULT_ACCOUNT_FAVICON_PATH },
  };
}

export default function Page() {
  return <AccountsClientWrapper />;
}
