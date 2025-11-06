'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import UrlManagement from '../../../../components/UrlManagement';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import type { AccountType } from '@draco/shared-schemas';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `account-tab-${index}`,
    'aria-controls': `account-tabpanel-${index}`,
  };
}

const AccountSettings: React.FC = () => {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const { token } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [tabValue, setTabValue] = useState(0);
  const [account, setAccount] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGlobalAdministrator = hasRole('Administrator');
  const canManageAccountSettings =
    isGlobalAdministrator || isAccountAdministrator(hasRole, accountIdStr);

  const loadAccountData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!accountIdStr) {
        setError('Account ID not found');
        setAccount(null);
        return;
      }

      const result = await getAccountById({
        client: apiClient,
        path: { accountId: accountIdStr },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load account data');
      setAccount(data.account as AccountType);
    } catch (err) {
      console.error('Failed to load account data', err);
      setAccount(null);
      setError('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }, [accountIdStr, apiClient]);

  useEffect(() => {
    if (accountId && token) {
      loadAccountData();
    }
  }, [accountId, token, loadAccountData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading account settings...
          </Typography>
        </Box>
      </main>
    );
  }

  if (error || !account) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">{error || 'Account not found'}</Alert>
        </Box>
      </main>
    );
  }

  if (!canManageAccountSettings) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ mt: 8 }}>
          <Alert severity="warning">
            {"You don't have permission to manage this account's settings."}
          </Alert>
        </Box>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountIdStr || ''} showSeasonInfo={false}>
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Account Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
            {"Manage your organization's configuration and settings."}
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        {/* Settings Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="account settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="URLs & Domains" {...a11yProps(0)} />
              <Tab label="General Settings" {...a11yProps(1)} />
              <Tab label="Social Media" {...a11yProps(2)} />
              <Tab label="Security" {...a11yProps(3)} />
            </Tabs>
          </Box>

          {/* URL Management Tab */}
          <TabPanel value={tabValue} index={0}>
            <UrlManagement
              accountId={accountIdStr || ''}
              accountName={account.name}
              onUrlsChange={(urls) => {
                setAccount({ ...account, urls });
              }}
            />
          </TabPanel>

          {/* General Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              General Account Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure basic account information and preferences.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              General settings management is coming soon. This will include account name, timezone,
              and other basic configuration options.
            </Alert>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Account Name:</strong> {account.name}
                <br />
                <strong>Account Type:</strong>{' '}
                {account.configuration?.accountType?.name ?? 'Unknown'}
                <br />
                <strong>First Year:</strong> {account.configuration?.firstYear ?? 'N/A'}
                <br />
                <strong>Affiliation:</strong> {account.configuration?.affiliation?.name || 'None'}
                <br />
                <strong>Timezone:</strong> {account.configuration?.timeZone || 'Not set'}
              </Typography>
            </Box>
          </TabPanel>

          {/* Social Media Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Social Media Integration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect your social media accounts and configure sharing options.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Social media integration is coming soon. This will include Twitter, Facebook, and
              YouTube account connections.
            </Alert>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Twitter Account:</strong>{' '}
                {account.socials?.twitterAccountName || 'Not configured'}
                <br />
                <strong>Facebook Fan Page:</strong>{' '}
                {account.socials?.facebookFanPage || 'Not configured'}
                <br />
                <strong>YouTube User ID:</strong>{' '}
                {account.socials?.youtubeUserId || 'Not configured'}
              </Typography>
            </Box>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage account security, user permissions, and access controls.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Security settings management is coming soon. This will include user roles,
              permissions, and access control configuration.
            </Alert>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Owner:</strong>{' '}
                {account.accountOwner?.contact
                  ? `${account.accountOwner.contact.firstName} ${account.accountOwner.contact.lastName}`
                  : 'Not assigned'}
                <br />
                <strong>Account Admin:</strong> {hasRole('AccountAdmin') ? 'Yes' : 'No'}
                <br />
                <strong>Administrator:</strong> {hasRole('Administrator') ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </main>
  );
};

export default AccountSettings;
