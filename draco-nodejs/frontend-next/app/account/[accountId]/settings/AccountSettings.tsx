'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import UrlManagement from '../../../../components/UrlManagement';

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

interface Account {
  id: string;
  name: string;
  accountType?: string;
  firstYear?: number;
  affiliation?: { name: string; url: string } | null;
  timezoneId?: string;
  twitterAccountName?: string;
  facebookFanPage?: string;
  youtubeUserId?: string;
  urls?: Array<{ id: string; url: string }>;
  ownerName?: string;
}

const AccountSettings: React.FC = () => {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const { token } = useAuth();
  const { hasRole } = useRole();

  const [tabValue, setTabValue] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageAccount = hasRole('AccountAdmin') || hasRole('Administrator');

  const loadAccountData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/accounts/${accountIdStr}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccount(data.data.account);
        } else {
          setError(data.message || 'Failed to load account data');
        }
      } else {
        setError('Failed to load account data');
      }
    } catch {
      setError('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }, [accountIdStr]);

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

  if (!canManageAccount) {
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {account.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {"Manage your organization's configuration and settings"}
        </Typography>
      </Box>

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
              <strong>Account Type:</strong> {account.accountType}
              <br />
              <strong>First Year:</strong> {account.firstYear}
              <br />
              <strong>Affiliation:</strong> {account.affiliation?.name || 'None'}
              <br />
              <strong>Timezone:</strong> {account.timezoneId}
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
              <strong>Twitter Account:</strong> {account.twitterAccountName || 'Not configured'}
              <br />
              <strong>Facebook Fan Page:</strong> {account.facebookFanPage || 'Not configured'}
              <br />
              <strong>YouTube User ID:</strong> {account.youtubeUserId || 'Not configured'}
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
            Security settings management is coming soon. This will include user roles, permissions,
            and access control configuration.
          </Alert>

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Owner:</strong> {account.ownerName || 'Not assigned'}
              <br />
              <strong>Account Admin:</strong> {hasRole('AccountAdmin') ? 'Yes' : 'No'}
              <br />
              <strong>Administrator:</strong> {hasRole('Administrator') ? 'Yes' : 'No'}
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </main>
  );
};

export default AccountSettings;
