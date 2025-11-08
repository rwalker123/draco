'use client';

import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import type { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';

interface SocialMediaWidgetProps {
  account: AccountType;
}

export const SocialMediaWidget: React.FC<SocialMediaWidgetProps> = ({ account }) => {
  return (
    <WidgetShell
      title="Social Media Integration"
      subtitle="Connect your social accounts and configure sharing options."
      accent="info"
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        Social media integration is coming soon. This will include Twitter, Facebook, and YouTube
        account connections.
      </Alert>

      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Twitter Account:</strong>{' '}
          {account.socials?.twitterAccountName || 'Not configured'}
          <br />
          <strong>Facebook Fan Page:</strong> {account.socials?.facebookFanPage || 'Not configured'}
          <br />
          <strong>YouTube User ID:</strong> {account.socials?.youtubeUserId || 'Not configured'}
        </Typography>
      </Box>
    </WidgetShell>
  );
};
