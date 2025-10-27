import HallOfFamePageClient from './HallOfFamePageClient';
import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Explore Hall of Fame inductees and celebrate the legacy of ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Hall of Fame`,
    description,
    path: `/account/${accountId}/hall-of-fame`,
    icon: iconUrl,
    index: false,
  });
}

export default function HallOfFamePage() {
  return <HallOfFamePageClient />;
}
