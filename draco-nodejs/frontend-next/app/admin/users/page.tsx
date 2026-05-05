import AdminUsersClientWrapper from './AdminUsersClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Login Management | ${DEFAULT_SITE_NAME}`,
    description: `Administrator tools for inspecting and cleaning up authentication users on the ${DEFAULT_SITE_NAME} platform.`,
    path: '/admin/users',
    index: false,
  });
}

export default function Page() {
  return <AdminUsersClientWrapper />;
}
