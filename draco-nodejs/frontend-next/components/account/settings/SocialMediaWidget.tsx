'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';
import type { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import YouTubeChannelAdminPanel from '@/components/social/YouTubeChannelAdminPanel';

interface SocialMediaWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

export const SocialMediaWidget: React.FC<SocialMediaWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const handleAccountUpdated = React.useCallback(
    (updated: AccountType) => {
      onAccountUpdate?.(updated);
    },
    [onAccountUpdate],
  );

  return (
    <WidgetShell
      title="Social Media Integration"
      subtitle="Connect official channels so videos and announcements stay in sync."
      accent="info"
    >
      <Stack spacing={3}>
        <Alert severity="info">
          Configure your organization’s YouTube channel to feature long-form videos on the Social
          Hub and team pages. Discord integrations can be managed below.
        </Alert>

        <YouTubeChannelAdminPanel
          context="account"
          accountId={account.id}
          accountName={account.name}
          accountLogoUrl={account.accountLogoUrl}
          currentChannelId={account.socials?.youtubeUserId ?? null}
          title="YouTube Channel"
          subtitle="Featured videos in the Social Hub"
          description="Use your official channel to highlight recaps, interviews, and livestreams."
          onAccountUpdated={handleAccountUpdated}
        />
      </Stack>
    </WidgetShell>
  );
};
