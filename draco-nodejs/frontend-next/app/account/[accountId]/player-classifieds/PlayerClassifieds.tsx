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
  const [tabValue, setTabValue] = useState(() =>
    searchParams.get('tab') === 'teams-wanted' ? 1 : 0,
  );
  const [verificationData, setVerificationData] = useState<{
    accessCode: string;
    classifiedData: TeamsWantedOwnerClassifiedType;
  } | null>(() => {
    const storedVerification = localStorage.getItem('teamsWantedVerification');
    if (!storedVerification) {
      return null;
    }

    try {
      const data = JSON.parse(storedVerification);
      const isValidAccount = data.accountId === accountId;
      const isNotExpired =
        Date.now() - data.timestamp < VERIFICATION_TIMEOUTS.EMAIL_VERIFICATION_TIMEOUT_MS;

      if (isValidAccount && isNotExpired) {
        return {
          accessCode: data.accessCode,
          classifiedData: data.classifiedData,
        };
      }
    } catch {
      // ignore invalid data and fall through to null
    }

    return null;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    // Clean up any stale verification data once we've initialized state
    localStorage.removeItem('teamsWantedVerification');
  }, []);

  const effectiveTabValue = verificationData ? 1 : tabValue;

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
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Player Classifieds
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={effectiveTabValue}
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
      <TabPanel value={effectiveTabValue} index={0}>
        <PlayersWanted accountId={accountId} />
      </TabPanel>
      <TabPanel value={effectiveTabValue} index={1} data-testid="teams-wanted-tabpanel">
        <TeamsWanted
          accountId={accountId}
          autoVerificationData={verificationData}
          onVerificationProcessed={() => {
            setVerificationData(null);
            setTabValue(1);
          }}
        />
      </TabPanel>
    </main>
  );
};

export default PlayerClassifieds;
