'use client';

import React from 'react';
import { Box, Container, Fab, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import MembersTab from './MembersTab';
import NominationsTab from './NominationsTab';
import SettingsTab from './SettingsTab';

interface HallOfFameManagementPageProps {
  accountId: string;
}

type TabId = 'members' | 'nominations' | 'settings';

const HallOfFameManagementPage: React.FC<HallOfFameManagementPageProps> = ({ accountId }) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('members');
  const [membersRefreshKey, setMembersRefreshKey] = React.useState(0);
  const [createRequestKey, setCreateRequestKey] = React.useState(0);

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

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Typography
                  variant="h4"
                  color="text.primary"
                  sx={{ fontWeight: 'bold', textAlign: 'center' }}
                >
                  Hall of Fame Management
                </Typography>
              </Box>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1, opacity: 0.85, maxWidth: 600, mx: 'auto' }}
              >
                Manage inductees, review nominations, and control the public nomination experience
                for your organization.
              </Typography>
            </Box>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
          <MembersTab
            accountId={accountId}
            refreshKey={membersRefreshKey}
            createRequestKey={createRequestKey}
          />
        ) : null}

        {activeTab === 'nominations' ? (
          <NominationsTab accountId={accountId} onNominationInducted={handleMembersChanged} />
        ) : null}

        {activeTab === 'settings' ? <SettingsTab accountId={accountId} /> : null}
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
