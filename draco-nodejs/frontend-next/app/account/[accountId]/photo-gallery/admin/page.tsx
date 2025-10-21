import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import PhotoGalleryAdminClientWrapper from './PhotoGalleryAdminClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage ${accountName} photo gallery albums and approved images.`;

  return buildSeoMetadata({
    title: `${accountName} Photo Gallery Management`,
    description,
    path: `/account/${accountId}/photo-gallery/admin`,
    icon: iconUrl,
    index: false,
  });
}

export default function PhotoGalleryAdminPage() {
  return <PhotoGalleryAdminClientWrapper />;
}
