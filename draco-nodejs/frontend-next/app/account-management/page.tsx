import type { Metadata } from 'next';
import AccountManagementClientWrapper from './AccountManagementClientWrapper';
import { DEFAULT_ACCOUNT_FAVICON_PATH } from '../../lib/metadataFetchers';

export function generateMetadata(): Metadata {
  return {
    title: 'Account Management - Draco Sports Manager',
    icons: { icon: DEFAULT_ACCOUNT_FAVICON_PATH },
  };
}

export default function Page() {
  return <AccountManagementClientWrapper />;
}
