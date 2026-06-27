'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

const TAB_COUNT = 6;

export default function Statistics({ accountId }: StatisticsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tabValue, setTabValue] = useState(() => {
    const parsed = Number(searchParams.get('tab'));
    return Number.isInteger(parsed) && parsed >= 0 && parsed < TAB_COUNT ? parsed : 0;
  });
  const [filters, setFilters] = useState<StatisticsFilters>(() => {
    const seasonId = searchParams.get('season') ?? '';
    const leagueId = searchParams.get('league') ?? '';
    return {
      seasonId,
      leagueId,
      divisionId: leagueId === '0' ? '' : (searchParams.get('division') ?? ''),
      isHistorical: seasonId === '0',
    };
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.seasonId) params.set('season', filters.seasonId);
    if (filters.leagueId) params.set('league', filters.leagueId);
    if (filters.divisionId) params.set('division', filters.divisionId);
    if (tabValue > 0) params.set('tab', String(tabValue));
    const query = params.toString();
    if (query !== searchParams.toString()) {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [filters, tabValue, pathname, router, searchParams]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFiltersChange = (newFilters: Partial<StatisticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const isAllLeagues = filters.leagueId === '0';

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
      <AdPlacement />

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
            {isAllLeagues ? (
              <Box p={3}>
                <Typography variant="body1" color="text.secondary">
                  Team statistics are not available when All Leagues is selected. Choose a specific
                  league to view team statistics.
                </Typography>
              </Box>
            ) : (
              <TeamStatistics accountId={accountId} seasonId={filters.seasonId} />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <PlayerCareerSearchTab accountId={accountId} />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            {isAllLeagues ? (
              <Box p={3}>
                <Typography variant="body1" color="text.secondary">
                  Standings are not available when All Leagues is selected. Choose a specific league
                  to view standings.
                </Typography>
              </Box>
            ) : (
              <Standings accountId={accountId} seasonId={filters.seasonId} showHeader={false} />
            )}
          </TabPanel>
        </Paper>
      </Container>
    </main>
  );
}
