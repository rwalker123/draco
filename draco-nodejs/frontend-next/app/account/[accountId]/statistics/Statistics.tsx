'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper, CircularProgress } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import StatisticsFilters from './StatisticsFilters';
import StatisticsLeaders from './StatisticsLeaders';
import BattingStatistics from './BattingStatistics';
import PitchingStatistics from './PitchingStatistics';
import TeamStatistics from './TeamStatistics';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Statistics are publicly viewable, no auth required
    setIsLoading(false);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFiltersChange = (newFilters: Partial<StatisticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </main>
    );
  }

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
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Statistics
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
        </Paper>
      </Container>
    </main>
  );
}
