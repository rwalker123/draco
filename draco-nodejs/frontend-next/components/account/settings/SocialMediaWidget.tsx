'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';
import type { AccountType } from '@draco/shared-schemas';
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
    <Stack spacing={3}>
      <Alert severity="info">
        Configure your organization’s YouTube channel to feature long-form videos on the Social Hub
        page.
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
  );
};
