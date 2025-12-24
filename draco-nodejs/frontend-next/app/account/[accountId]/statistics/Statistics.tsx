'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import AdPlacement from '../../../../components/ads/AdPlacement';
import StatisticsFilters from './StatisticsFilters';
import StatisticsLeaders from './StatisticsLeaders';
import BattingStatistics from './BattingStatistics';
import PitchingStatistics from './PitchingStatistics';
import TeamStatistics from './TeamStatistics';
import Standings from '../../../../components/Standings';
import PlayerCareerSearchTab from './PlayerCareerSearchTab';

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
      id={`statistics-tabpanel-${index}`}
      aria-labelledby={`statistics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `statistics-tab-${index}`,
    'aria-controls': `statistics-tabpanel-${index}`,
  };
}

export interface StatisticsFilters {
  seasonId: string;
  leagueId: string;
  divisionId: string;
  isHistorical: boolean;
}

interface StatisticsProps {
  accountId: string;
}

export default function Statistics({ accountId }: StatisticsProps) {
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<StatisticsFilters>({
    seasonId: '',
    leagueId: '',
    divisionId: '',
    isHistorical: false,
  });
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFiltersChange = (newFilters: Partial<StatisticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

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
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Statistics
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>
      <AdPlacement wrapperSx={{ mt: 2 }} />

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <StatisticsFilters
            accountId={accountId}
            filters={filters}
            onChange={handleFiltersChange}
          />
        </Paper>

        {/* Main Statistics Content */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="statistics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Leaders" {...a11yProps(0)} />
              <Tab label="Batting" {...a11yProps(1)} />
              <Tab label="Pitching" {...a11yProps(2)} />
              <Tab label="Teams" {...a11yProps(3)} />
              <Tab label="Players" {...a11yProps(4)} />
              <Tab label="Standings" {...a11yProps(5)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <StatisticsLeaders accountId={accountId} filters={filters} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <BattingStatistics accountId={accountId} filters={filters} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <PitchingStatistics accountId={accountId} filters={filters} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <TeamStatistics accountId={accountId} seasonId={filters.seasonId} />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <PlayerCareerSearchTab accountId={accountId} />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Standings accountId={accountId} seasonId={filters.seasonId} showHeader={false} />
          </TabPanel>
        </Paper>
      </Container>
    </main>
  );
}
