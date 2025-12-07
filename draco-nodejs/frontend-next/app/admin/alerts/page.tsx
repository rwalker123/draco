import AdminAlertsClientWrapper from './AdminAlertsClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Alert Management | ${DEFAULT_SITE_NAME}`,
    description: 'Manage global alerts displayed across all accounts.',
    path: '/admin/alerts',
    index: false,
  });
}

export default function Page() {
  return <AdminAlertsClientWrapper />;
}
