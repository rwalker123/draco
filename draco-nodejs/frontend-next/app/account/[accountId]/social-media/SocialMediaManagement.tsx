'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Tab, Tabs, Typography, Stack } from '@mui/material';
import { useParams } from 'next/navigation';
import { getAccountById } from '@draco/shared-api-client';
import type { AccountSettingKey, AccountType } from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import { DiscordIntegrationAdminWidget } from '@/components/account/settings/DiscordIntegrationAdminWidget';
import { SocialMediaWidget } from '@/components/account/settings/SocialMediaWidget';
import { TwitterIntegrationAdminWidget } from '@/components/account/settings/TwitterIntegrationAdminWidget';
import DiscordGameResultsSyncCard from '@/components/discord/DiscordGameResultsSyncCard';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useApiClient } from '@/hooks/useApiClient';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { isAccountAdministrator } from '@/utils/permissionUtils';
import { unwrapApiResult } from '@/utils/apiResult';

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
      id={`social-media-tabpanel-${index}`}
      aria-labelledby={`social-media-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `social-media-tab-${index}`,
    'aria-controls': `social-media-tabpanel-${index}`,
  };
}

const SocialMediaManagement: React.FC = () => {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const { token } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();
  const accountSettings = useAccountSettings(accountIdStr, { requireManage: true });

  const [tabValue, setTabValue] = useState(0);
  const [account, setAccount] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discordStatusRefresh, setDiscordStatusRefresh] = useState(0);

  const isGlobalAdministrator = hasRole('Administrator');
  const canManageSocialMedia =
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
      void loadAccountData();
    }
  }, [accountId, token, loadAccountData]);

  const postResultsDiscordSetting = useMemo(
    () =>
      accountSettings.settings?.find(
        (setting) => setting.definition.key === 'PostGameResultsToDiscord',
      ),
    [accountSettings.settings],
  );

  const postResultsTwitterSetting = useMemo(
    () =>
      accountSettings.settings?.find(
        (setting) => setting.definition.key === 'PostGameResultsToTwitter',
      ),
    [accountSettings.settings],
  );

  const updatePostResultsSetting = useCallback(
    async (settingKey: AccountSettingKey, value: boolean) => {
      await accountSettings.updateSetting?.(settingKey, value);
    },
    [accountSettings],
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isLoading = loading || accountSettings.loading;
  const combinedError = error || accountSettings.error;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading social media settings...
          </Typography>
        </Box>
      </main>
    );
  }

  if (combinedError || !account) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">{combinedError || 'Account not found'}</Alert>
        </Box>
      </main>
    );
  }

  if (!canManageSocialMedia) {
    return (
      <main className="min-h-screen bg-background">
        <Box sx={{ mt: 8 }}>
          <Alert severity="warning">
            {"You don't have permission to manage this account's social media integrations."}
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
            Social Media Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
            Configure YouTube, Discord, and social integrations for your organization.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="social media management tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="YouTube" {...a11yProps(0)} />
              <Tab label="Discord" {...a11yProps(1)} />
              <Tab label="Twitter" {...a11yProps(2)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <SocialMediaWidget account={account} onAccountUpdate={setAccount} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <DiscordIntegrationAdminWidget
                accountId={accountIdStr || null}
                onConfigUpdated={() => setDiscordStatusRefresh((value) => value + 1)}
              />
              <DiscordGameResultsSyncCard
                accountId={accountIdStr || ''}
                refreshKey={discordStatusRefresh}
                postGameResultsEnabled={
                  (postResultsDiscordSetting?.effectiveValue ??
                    postResultsDiscordSetting?.value ??
                    false) as boolean
                }
                postGameResultsUpdating={accountSettings.updatingKey === 'PostGameResultsToDiscord'}
                onTogglePostGameResults={(enabled) =>
                  updatePostResultsSetting('PostGameResultsToDiscord', enabled)
                }
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TwitterIntegrationAdminWidget
              account={account}
              onAccountUpdate={setAccount}
              postGameResultsSetting={postResultsTwitterSetting}
              postGameResultsUpdating={accountSettings.updatingKey === 'PostGameResultsToTwitter'}
              onUpdatePostGameResults={(enabled) =>
                updatePostResultsSetting('PostGameResultsToTwitter', enabled)
              }
            />
          </TabPanel>
        </Paper>
      </Box>
    </main>
  );
};

export default SocialMediaManagement;
