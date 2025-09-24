import type { Metadata } from 'next';
import AdminDashboardClientWrapper from './AdminDashboardClientWrapper';
import { DEFAULT_ACCOUNT_FAVICON_PATH } from '../../lib/metadataFetchers';

export function generateMetadata(): Metadata {
  return {
    title: 'Administrator Dashboard - Draco Sports Manager',
    icons: { icon: DEFAULT_ACCOUNT_FAVICON_PATH },
  };
}

export default function Page() {
  return <AdminDashboardClientWrapper />;
}
