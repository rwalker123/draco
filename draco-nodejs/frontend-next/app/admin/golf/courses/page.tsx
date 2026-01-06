import AdminGolfCoursesClientWrapper from './AdminGolfCoursesClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Golf Course Management | ${DEFAULT_SITE_NAME}`,
    description: 'Manage golf courses in the system.',
    path: '/admin/golf/courses',
    index: false,
  });
}

export default function Page() {
  return <AdminGolfCoursesClientWrapper />;
}
