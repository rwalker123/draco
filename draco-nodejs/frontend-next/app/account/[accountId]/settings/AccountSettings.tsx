'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../components/admin';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import type { AccountSettingKey, AccountType } from '@draco/shared-schemas';
import { useAccountSettings } from '../../../../hooks/useAccountSettings';
import { GeneralSettingsWidget } from '../../../../components/account/settings/GeneralSettingsWidget';
import { UrlManagementWidget } from '../../../../components/account/settings/UrlManagementWidget';

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

  useEffect(() => {
    if (!accountId || !token || !accountIdStr) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadAccountData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load account data');
        setAccount(data.account as AccountType);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load account data', err);
        setAccount(null);
        setError('Failed to load account data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAccountData();

    return () => {
      controller.abort();
    };
  }, [accountId, token, accountIdStr, apiClient]);

  const handleSettingUpdate = async (key: AccountSettingKey, value: boolean | number) => {
    await updateSetting(key, value);
  };

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
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Account Settings
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          {"Manage your organization's configuration and settings."}
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountIdStr || ''}
          category={{ name: 'Account', href: `/account/${accountIdStr}/admin/account` }}
          currentPage="Account Settings"
        />

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
        </Paper>
      </Container>
    </main>
  );
};

export default AccountSettings;
