'use client';

import React from 'react';
import {
  Alert,
  Box,
  Container,
  Fab,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../components/admin';
import MembersWidget from './MembersWidget';
import NominationsWidget from './NominationsWidget';
import SettingsWidget from './SettingsWidget';
import WidgetShell from '@/components/ui/WidgetShell';
import { useAccountSettings } from '@/hooks/useAccountSettings';

interface HallOfFameManagementPageProps {
  accountId: string;
}

type TabId = 'members' | 'nominations' | 'settings';

const HallOfFameManagementPage: React.FC<HallOfFameManagementPageProps> = ({ accountId }) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('members');
  const [membersRefreshKey, setMembersRefreshKey] = React.useState(0);
  const [createRequestKey, setCreateRequestKey] = React.useState(0);
  const {
    settings: accountSettings,
    loading: settingsLoading,
    error: settingsError,
    updatingKey: settingsUpdatingKey,
    updateSetting,
  } = useAccountSettings(accountId, { requireManage: true });
  const hofSetting = React.useMemo(
    () => accountSettings?.find((setting) => setting.definition.key === 'ShowHOF'),
    [accountSettings],
  );
  const [availabilityError, setAvailabilityError] = React.useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabId) => {
    setActiveTab(newValue);
  };

  const handleMembersChanged = React.useCallback(() => {
    setMembersRefreshKey((key) => key + 1);
  }, []);

  const handleOpenCreateMember = React.useCallback(() => {
    setActiveTab((prev) => {
      if (prev !== 'members') {
        return 'members';
      }
      return prev;
    });
    setCreateRequestKey((key) => key + 1);
  }, []);

  const handleAvailabilityToggle = React.useCallback(
    async (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      try {
        await updateSetting('ShowHOF', checked);
        setAvailabilityError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to update Hall of Fame availability.';
        setAvailabilityError(message);
      }
    },
    [updateSetting],
  );

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Hall of Fame Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage inductees, review nominations, and control the public nomination experience for
          your organization.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Community', href: `/account/${accountId}/admin/community` }}
          currentPage="Hall of Fame Management"
        />
        <Stack spacing={3}>
          <WidgetShell
            title="Hall of Fame Availability"
            subtitle="Control whether Hall of Fame pages and widgets are visible to members."
            accent="primary"
          >
            {settingsError ? (
              <Alert severity="error">{settingsError}</Alert>
            ) : (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={Boolean(hofSetting?.value)}
                      onChange={handleAvailabilityToggle}
                      disabled={settingsLoading || !hofSetting || settingsUpdatingKey === 'ShowHOF'}
                    />
                  }
                  label={
                    hofSetting?.value
                      ? 'Hall of Fame is visible to account members'
                      : 'Hall of Fame is hidden for this account'
                  }
                />
                <Typography variant="body2" color="text.secondary">
                  Turning this off hides the Hall of Fame navigation, widgets, and public pages
                  without deleting any inductees.
                </Typography>
                {availabilityError ? (
                  <Alert severity="error" onClose={() => setAvailabilityError(null)}>
                    {availabilityError}
                  </Alert>
                ) : null}
              </Stack>
            )}
          </WidgetShell>

          <Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Hall of Fame management sections"
              sx={{ mb: 3 }}
            >
              <Tab label="Members" value="members" />
              <Tab label="Nominations" value="nominations" />
              <Tab label="Settings" value="settings" />
            </Tabs>

            {activeTab === 'members' ? (
              <MembersWidget
                accountId={accountId}
                refreshKey={membersRefreshKey}
                createRequestKey={createRequestKey}
              />
            ) : null}

            {activeTab === 'nominations' ? (
              <NominationsWidget
                accountId={accountId}
                onNominationInducted={handleMembersChanged}
              />
            ) : null}

            {activeTab === 'settings' ? <SettingsWidget accountId={accountId} /> : null}
          </Box>
        </Stack>
      </Container>
      <Tooltip title="Add Hall of Fame Member">
        <Fab
          color="primary"
          aria-label="Add Hall of Fame member"
          onClick={handleOpenCreateMember}
          sx={{
            position: 'fixed',
            bottom: (theme) => theme.spacing(4),
            right: (theme) => theme.spacing(4),
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </main>
  );
};

export default HallOfFameManagementPage;
