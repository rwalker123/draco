'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import PlayersWanted from './PlayersWanted';
import TeamsWanted from './TeamsWanted';
import { VERIFICATION_TIMEOUTS } from '../../../../constants/timeoutConstants';
import { TeamsWantedOwnerClassifiedType } from '@draco/shared-schemas';

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
  const searchParams = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [verificationData, setVerificationData] = useState<{
    accessCode: string;
    classifiedData: TeamsWantedOwnerClassifiedType;
  } | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam === 'teams-wanted') {
      setTabValue(1);
    }

    // Check for verification data from email verification flow
    const storedVerification = localStorage.getItem('teamsWantedVerification');
    if (storedVerification) {
      try {
        const data = JSON.parse(storedVerification);

        // Verify the data is for the current account and not too old
        const isValidAccount = data.accountId === accountId;
        const isNotExpired =
          Date.now() - data.timestamp < VERIFICATION_TIMEOUTS.EMAIL_VERIFICATION_TIMEOUT_MS;

        if (isValidAccount && isNotExpired) {
          setVerificationData({
            accessCode: data.accessCode,
            classifiedData: data.classifiedData,
          });

          // Auto-switch to Teams Wanted tab
          setTabValue(1);
        }

        // Clean up stored verification data (whether valid or not)
        localStorage.removeItem('teamsWantedVerification');
      } catch {
        // Invalid JSON, remove it
        localStorage.removeItem('teamsWantedVerification');
      }
    }
  }, [accountId, searchParams]);

  return (
    <main className="min-h-screen bg-background">
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
        <TeamsWanted
          accountId={accountId}
          autoVerificationData={verificationData}
          onVerificationProcessed={() => setVerificationData(null)}
        />
      </TabPanel>
    </main>
  );
};

export default PlayerClassifieds;
