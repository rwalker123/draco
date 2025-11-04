import ProfilePageClientWrapper from './ProfilePageClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Profile | ${DEFAULT_SITE_NAME}`,
    description: `View your contact information, organizations, and team assignments within ${DEFAULT_SITE_NAME}.`,
    path: '/profile',
    index: false,
  });
}

export default function Page() {
  return <ProfilePageClientWrapper />;
}
