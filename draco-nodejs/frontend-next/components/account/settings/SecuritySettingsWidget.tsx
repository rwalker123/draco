'use client';

import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import type { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';

interface SecuritySettingsWidgetProps {
  account: AccountType;
  isAccountAdmin: boolean;
  isAdministrator: boolean;
}

export const SecuritySettingsWidget: React.FC<SecuritySettingsWidgetProps> = ({
  account,
  isAccountAdmin,
  isAdministrator,
}) => {
  return (
    <WidgetShell
      title="Security Settings"
      subtitle="Manage account security, user permissions, and access controls."
      accent="warning"
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        Security settings management is coming soon. This will include user roles, permissions, and
        access control configuration.
      </Alert>

      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Owner:</strong>{' '}
          {account.accountOwner?.contact
            ? `${account.accountOwner.contact.firstName} ${account.accountOwner.contact.lastName}`
            : 'Not assigned'}
          <br />
          <strong>Account Admin:</strong> {isAccountAdmin ? 'Yes' : 'No'}
          <br />
          <strong>Administrator:</strong> {isAdministrator ? 'Yes' : 'No'}
        </Typography>
      </Box>
    </WidgetShell>
  );
};
