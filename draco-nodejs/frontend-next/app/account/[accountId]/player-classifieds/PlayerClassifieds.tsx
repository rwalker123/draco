'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import PlayersWanted from './PlayersWanted';
import TeamsWanted from './TeamsWanted';

// Test if console logging is working
console.log('🔧 PlayerClassifieds.tsx file loaded');
console.error('🚨 ERROR TEST 5 - This should definitely show up');

interface PlayerClassifiedsProps {
  accountId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  console.log(
    `🔍 TabPanel render: index=${index}, value=${value}, shouldRender=${value === index}`,
  );

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`player-classifieds-tabpanel-${index}`}
      aria-labelledby={`player-classifieds-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PlayerClassifieds: React.FC<PlayerClassifiedsProps> = ({ accountId }) => {
  const [tabValue, setTabValue] = useState(0);

  console.log(
    `🚀 PlayerClassifieds component render: accountId=${accountId}, tabValue=${tabValue}`,
  );

  useEffect(() => {
    console.log(`📱 PlayerClassifieds component mounted with accountId: ${accountId}`);
  }, [accountId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(`🔄 Tab change: ${tabValue} -> ${newValue}`);
    setTabValue(newValue);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* TEST BANNER - IF YOU SEE THIS, THE FILE IS UPDATED */}
      <Box
        sx={{
          backgroundColor: 'green',
          color: 'white',
          p: 2,
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        🟢 TEST BANNER - MAIN PLAYER CLASSIFIEDS FILE UPDATED! 🟢
      </Box>

      {/* Account Header */}
      <AccountPageHeader accountId={accountId}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Player Classifieds
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="player classifieds tabs"
          sx={{ px: 2 }}
        >
          <Tab
            label="Players Wanted"
            id="player-classifieds-tab-0"
            aria-controls="player-classifieds-tabpanel-0"
          />
          <Tab
            label="Teams Wanted"
            id="player-classifieds-tab-1"
            aria-controls="player-classifieds-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <PlayersWanted accountId={accountId} />
      </TabPanel>
      <TabPanel value={tabValue} index={1} data-testid="teams-wanted-tabpanel">
        <TeamsWanted accountId={accountId} />
      </TabPanel>
    </main>
  );
};

export default PlayerClassifieds;
