import AdminDashboardClientWrapper from './AdminDashboardClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Administrator Tools | ${DEFAULT_SITE_NAME}`,
    description: `Administrative console for managing ${DEFAULT_SITE_NAME} platform configuration, accounts, and feature flags.`,
    path: '/admin',
    index: false,
  });
}

export default function Page() {
  return <AdminDashboardClientWrapper />;
}
