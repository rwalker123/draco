import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import SocialHubClientWrapper from './SocialHubClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `See live streams, updates, and chat activity for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Social Hub`,
    description,
    path: `/account/${accountId}/social-hub`,
    icon: iconUrl,
    index: false,
  });
}

export default async function SocialHubPage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Social Hub</h1>
          <p className="text-base text-muted-foreground">
            Follow community chats, media highlights, and live updates curated for your account.
          </p>
        </div>
      </AccountPageHeader>

      <section className="max-w-7xl w-full mx-auto px-4 py-8">
        <SocialHubClientWrapper accountId={accountId} />
      </section>
    </main>
  );
}
