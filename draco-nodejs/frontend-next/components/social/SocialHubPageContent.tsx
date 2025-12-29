'use client';

import AccountPageHeader from '../AccountPageHeader';
import AdPlacement from '../ads/AdPlacement';
import SocialHubContainer from './SocialHubContainer';

interface SocialHubPageContentProps {
  accountId: string;
}

const SocialHubPageContent: React.FC<SocialHubPageContentProps> = ({ accountId }) => {
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
      <AdPlacement />

      <section className="max-w-7xl w-full mx-auto px-4 py-8">
        <SocialHubContainer accountId={accountId} />
      </section>
    </main>
  );
};

export default SocialHubPageContent;
