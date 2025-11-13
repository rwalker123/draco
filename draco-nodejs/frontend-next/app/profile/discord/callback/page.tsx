import DiscordOAuthCallbackPageClientWrapper from './DiscordOAuthCallbackPageClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Discord Linking | ${DEFAULT_SITE_NAME}`,
    description: 'Finalize your Discord account connection.',
    path: '/profile/discord/callback',
    index: false,
  });
}

export default function Page() {
  return <DiscordOAuthCallbackPageClientWrapper />;
}
