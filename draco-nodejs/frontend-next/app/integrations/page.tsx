import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';
import IntegrationsClientWrapper from './IntegrationsClientWrapper';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `AI Integrations | ${DEFAULT_SITE_NAME}`,
    description:
      'Connect your favorite AI assistant to ezRecSports for read-only access to your teams, schedules, and stats.',
    path: '/integrations',
    index: false,
  });
}

export default function IntegrationsPage() {
  return <IntegrationsClientWrapper />;
}
