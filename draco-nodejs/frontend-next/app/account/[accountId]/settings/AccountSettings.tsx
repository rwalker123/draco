'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress, Stack } from '@mui/material';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import type { AccountSettingKey, AccountType } from '@draco/shared-schemas';
import { useAccountSettings } from '../../../../hooks/useAccountSettings';
import { GeneralSettingsWidget } from '../../../../components/account/settings/GeneralSettingsWidget';
import { UrlManagementWidget } from '../../../../components/account/settings/UrlManagementWidget';
import { SocialMediaWidget } from '../../../../components/account/settings/SocialMediaWidget';
import { SecuritySettingsWidget } from '../../../../components/account/settings/SecuritySettingsWidget';
import { DiscordIntegrationAdminWidget } from '../../../../components/account/settings/DiscordIntegrationAdminWidget';

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

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updatingKey,
    updateSetting,
    refetch: refreshSettings,
  } = useAccountSettings(canManageAccountSettings ? accountIdStr : null, {
    requireManage: true,
  });

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

  const handleSettingUpdate = useCallback(
    async (key: AccountSettingKey, value: boolean | number) => {
      await updateSetting(key, value);
    },
    [updateSetting],
  );

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
            <UrlManagementWidget
              accountId={accountIdStr || ''}
              account={account}
              onUrlsChange={(urls) => {
                setAccount({ ...account, urls });
              }}
            />
          </TabPanel>

          {/* General Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <GeneralSettingsWidget
              loading={settingsLoading}
              error={settingsError}
              settings={settings}
              canManage={canManageAccountSettings}
              updatingKey={updatingKey}
              onRetry={refreshSettings}
              onUpdate={handleSettingUpdate}
            />
          </TabPanel>

          {/* Social Media Tab */}
          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <SocialMediaWidget account={account} onAccountUpdate={setAccount} />
              <DiscordIntegrationAdminWidget accountId={accountIdStr || null} />
            </Stack>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={3}>
            <SecuritySettingsWidget
              account={account}
              isAccountAdmin={hasRole('AccountAdmin')}
              isAdministrator={hasRole('Administrator')}
            />
          </TabPanel>
        </Paper>
      </Box>
    </main>
  );
};

export default AccountSettings;
