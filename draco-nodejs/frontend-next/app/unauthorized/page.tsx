import UnauthorizedClientWrapper from './UnauthorizedClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Access Denied | ${DEFAULT_SITE_NAME}`,
    description: `You do not have permission to access this ${DEFAULT_SITE_NAME} page. Switch accounts or contact an administrator for additional access.`,
    path: '/unauthorized',
    index: false,
  });
}

export default function Page() {
  return <UnauthorizedClientWrapper />;
}
