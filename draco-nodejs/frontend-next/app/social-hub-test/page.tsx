import SocialHubTestClient from './SocialHubTestClient';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Social Hub Experience Preview | ${DEFAULT_SITE_NAME}`,
    description: `Internal preview surface for validating the ${DEFAULT_SITE_NAME} social hub experience and content feed layouts.`,
    path: '/social-hub-test',
    index: false,
  });
}

export default function Page() {
  return <SocialHubTestClient />;
}
