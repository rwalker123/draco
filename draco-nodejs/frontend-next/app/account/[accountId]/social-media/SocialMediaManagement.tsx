'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  Stack,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { getAccountById } from '@draco/shared-api-client';
import type { AccountSettingKey, AccountType } from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import { AdminBreadcrumbs } from '@/components/admin';
import { DiscordIntegrationAdminWidget } from '@/components/account/settings/DiscordIntegrationAdminWidget';
import { SocialMediaWidget } from '@/components/account/settings/SocialMediaWidget';
import { BlueskyIntegrationAdminWidget } from '@/components/account/settings/BlueskyIntegrationAdminWidget';
import { BlueskyPostSettingsWidget } from '@/components/account/settings/BlueskyPostSettingsWidget';
import { TwitterIntegrationAdminWidget } from '@/components/account/settings/TwitterIntegrationAdminWidget';
import { TwitterPostSettingsWidget } from '@/components/account/settings/TwitterPostSettingsWidget';
import { FacebookIntegrationAdminWidget } from '@/components/account/settings/FacebookIntegrationAdminWidget';
import { FacebookPostSettingsWidget } from '@/components/account/settings/FacebookPostSettingsWidget';
import { InstagramIntegrationAdminWidget } from '@/components/account/settings/InstagramIntegrationAdminWidget';
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

  useEffect(() => {
    if (!accountId || !token) {
      return;
    }

    let cancelled = false;

    const loadAccountData = async () => {
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

        if (cancelled) return;

        const data = unwrapApiResult(result, 'Failed to load account data');
        setAccount(data.account as AccountType);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load account data', err);
        setAccount(null);
        setError('Failed to load account data');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAccountData();

    return () => {
      cancelled = true;
    };
  }, [accountId, token, accountIdStr, apiClient]);

  const postResultsDiscordSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostGameResultsToDiscord',
  );

  const postResultsTwitterSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostGameResultsToTwitter',
  );

  const postResultsFacebookSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostGameResultsToFacebook',
  );

  const postAnnouncementsTwitterSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostAnnouncementsToTwitter',
  );

  const postAnnouncementsFacebookSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostAnnouncementsToFacebook',
  );

  const postResultsBlueskySetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostGameResultsToBluesky',
  );

  const postWorkoutsDiscordSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostWorkoutsToDiscord',
  );

  const postWorkoutsTwitterSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostWorkoutsToTwitter',
  );

  const postWorkoutsFacebookSetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostWorkoutsToFacebook',
  );

  const postWorkoutsBlueskySetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostWorkoutsToBluesky',
  );

  const postAnnouncementsBlueskySetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'PostAnnouncementsToBluesky',
  );

  const syncInstagramToGallerySetting = accountSettings.settings?.find(
    (setting) => setting.definition.key === 'SyncInstagramToGallery',
  );

  const updatePostResultsSetting = async (settingKey: AccountSettingKey, value: boolean) => {
    await accountSettings.updateSetting?.(settingKey, value);
  };

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
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Social Media Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Configure YouTube, Discord, Bluesky, Twitter, and Facebook/Instagram integrations for your
          organization.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountIdStr || ''} currentPage="Social Media Management" />
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
              <Tab label="Bluesky" {...a11yProps(2)} />
              <Tab label="Twitter" {...a11yProps(3)} />
              <Tab label="Facebook/Instagram" {...a11yProps(4)} />
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
                postWorkoutsEnabled={
                  (postWorkoutsDiscordSetting?.effectiveValue ??
                    postWorkoutsDiscordSetting?.value ??
                    false) as boolean
                }
                postWorkoutsUpdating={accountSettings.updatingKey === 'PostWorkoutsToDiscord'}
                onTogglePostWorkouts={(enabled) =>
                  updatePostResultsSetting('PostWorkoutsToDiscord', enabled)
                }
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <BlueskyIntegrationAdminWidget account={account} onAccountUpdate={setAccount} />
              <BlueskyPostSettingsWidget
                postGameResultsSetting={postResultsBlueskySetting}
                postGameResultsUpdating={accountSettings.updatingKey === 'PostGameResultsToBluesky'}
                onUpdatePostGameResults={(enabled) =>
                  updatePostResultsSetting('PostGameResultsToBluesky', enabled)
                }
                postAnnouncementsSetting={postAnnouncementsBlueskySetting}
                postAnnouncementsUpdating={
                  accountSettings.updatingKey === 'PostAnnouncementsToBluesky'
                }
                onUpdatePostAnnouncements={(enabled) =>
                  updatePostResultsSetting('PostAnnouncementsToBluesky', enabled)
                }
                postWorkoutSetting={postWorkoutsBlueskySetting}
                postWorkoutUpdating={accountSettings.updatingKey === 'PostWorkoutsToBluesky'}
                onUpdatePostWorkout={(enabled) =>
                  updatePostResultsSetting('PostWorkoutsToBluesky', enabled)
                }
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Stack spacing={3}>
              <TwitterIntegrationAdminWidget account={account} onAccountUpdate={setAccount} />
              <TwitterPostSettingsWidget
                postGameResultsSetting={postResultsTwitterSetting}
                postGameResultsUpdating={accountSettings.updatingKey === 'PostGameResultsToTwitter'}
                onUpdatePostGameResults={(enabled) =>
                  updatePostResultsSetting('PostGameResultsToTwitter', enabled)
                }
                postAnnouncementsSetting={postAnnouncementsTwitterSetting}
                postAnnouncementsUpdating={
                  accountSettings.updatingKey === 'PostAnnouncementsToTwitter'
                }
                onUpdatePostAnnouncements={(enabled) =>
                  updatePostResultsSetting('PostAnnouncementsToTwitter', enabled)
                }
                postWorkoutSetting={postWorkoutsTwitterSetting}
                postWorkoutUpdating={accountSettings.updatingKey === 'PostWorkoutsToTwitter'}
                onUpdatePostWorkout={(enabled) =>
                  updatePostResultsSetting('PostWorkoutsToTwitter', enabled)
                }
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Stack spacing={3}>
              <FacebookIntegrationAdminWidget account={account} onAccountUpdate={setAccount} />
              <FacebookPostSettingsWidget
                postGameResultsSetting={postResultsFacebookSetting}
                postGameResultsUpdating={
                  accountSettings.updatingKey === 'PostGameResultsToFacebook'
                }
                onUpdatePostGameResults={(enabled) =>
                  updatePostResultsSetting('PostGameResultsToFacebook', enabled)
                }
                postAnnouncementsSetting={postAnnouncementsFacebookSetting}
                postAnnouncementsUpdating={
                  accountSettings.updatingKey === 'PostAnnouncementsToFacebook'
                }
                onUpdatePostAnnouncements={(enabled) =>
                  updatePostResultsSetting('PostAnnouncementsToFacebook', enabled)
                }
                postWorkoutSetting={postWorkoutsFacebookSetting}
                postWorkoutUpdating={accountSettings.updatingKey === 'PostWorkoutsToFacebook'}
                onUpdatePostWorkout={(enabled) =>
                  updatePostResultsSetting('PostWorkoutsToFacebook', enabled)
                }
              />
              <InstagramIntegrationAdminWidget
                account={account}
                onAccountUpdate={setAccount}
                syncToGallerySetting={syncInstagramToGallerySetting}
                syncToGalleryUpdating={accountSettings.updatingKey === 'SyncInstagramToGallery'}
                onUpdateSyncToGallery={(enabled) =>
                  updatePostResultsSetting('SyncInstagramToGallery', enabled)
                }
              />
            </Stack>
          </TabPanel>
        </Paper>
      </Container>
    </main>
  );
};

export default SocialMediaManagement;
