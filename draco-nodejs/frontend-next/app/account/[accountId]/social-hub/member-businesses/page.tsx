import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import MemberBusinessDirectoryClientWrapper from './MemberBusinessDirectoryClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse businesses owned by active ${accountName} members.`;

  return buildSeoMetadata({
    title: `${accountName} Member Businesses`,
    description,
    path: `/account/${accountId}/social-hub/member-businesses`,
    icon: iconUrl,
    index: false,
  });
}

export default async function MemberBusinessesPage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Member Businesses</h1>
          <p className="text-base text-muted-foreground">
            Support and promote the companies operated by your rostered members.
          </p>
        </div>
      </AccountPageHeader>

      <section className="max-w-5xl w-full mx-auto px-4 py-8">
        <MemberBusinessDirectoryClientWrapper />
      </section>
    </main>
  );
}
