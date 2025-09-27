import AccountManagementClientWrapper from './AccountManagementClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Account Management | ${DEFAULT_SITE_NAME}`,
    description:
      'Administrative workspace for provisioning organizations, managing billing, and configuring platform-wide settings in Draco Sports Manager.',
    path: '/account-management',
    index: false,
  });
}

export default function Page() {
  return <AccountManagementClientWrapper />;
}
