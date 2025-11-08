'use client';

import React from 'react';
import { Alert, Typography } from '@mui/material';
import WidgetShell from '../../ui/WidgetShell';
import UrlManagement from '../../UrlManagement';
import type { AccountType } from '@draco/shared-schemas';

interface UrlManagementWidgetProps {
  accountId: string;
  account: AccountType;
  onUrlsChange: (urls: AccountType['urls']) => void;
}

export const UrlManagementWidget: React.FC<UrlManagementWidgetProps> = ({
  accountId,
  account,
  onUrlsChange,
}) => {
  if (!accountId) {
    return (
      <WidgetShell title="URLs & Domains">
        <Alert severity="warning">Account identifier is required to manage URLs.</Alert>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      title="URLs & Domains"
      subtitle="Configure the domains your organization can be reached at."
      accent="primary"
      sx={{ mb: 3 }}
    >
      <UrlManagement
        accountId={accountId}
        accountName={account.name}
        onUrlsChange={(urls) => {
          onUrlsChange(urls);
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Use the buttons above to add, edit, or remove official URLs for this account.
      </Typography>
    </WidgetShell>
  );
};
