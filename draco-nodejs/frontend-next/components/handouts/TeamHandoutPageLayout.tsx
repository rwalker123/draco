'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Link as MUILink,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import AccountPageHeader from '../AccountPageHeader';
import TeamAvatar from '../TeamAvatar';
import type { TeamHandoutHeaderData } from '@/hooks/useTeamHandoutHeader';

interface TeamHandoutPageLayoutProps {
  accountId: string;
  teamHeader: TeamHandoutHeaderData | null;
  loading: boolean;
  error: string | null;
  title: string;
  breadcrumbHref?: string;
  breadcrumbLabel?: string;
  notAuthorized?: boolean;
  notAuthorizedMessage?: string;
  missingTeamMessage?: string;
  headerDescription?: React.ReactNode;
  children?: React.ReactNode;
}

const TeamHandoutPageLayout: React.FC<TeamHandoutPageLayoutProps> = ({
  accountId,
  teamHeader,
  loading,
  error,
  title,
  breadcrumbHref,
  breadcrumbLabel = 'Team Overview',
  notAuthorized = false,
  notAuthorizedMessage = 'You do not have access to this team.',
  missingTeamMessage = 'Team details are unavailable at the moment.',
  headerDescription,
  children,
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (notAuthorized) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          {notAuthorizedMessage}
        </Alert>
      );
    }

    if (!teamHeader) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          {missingTeamMessage}
        </Alert>
      );
    }

    return children ?? null;
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <TeamAvatar
              name={teamHeader?.teamName || 'Team'}
              logoUrl={teamHeader?.logoUrl}
              size={56}
              alt={`${teamHeader?.teamName || 'Team'} logo`}
            />
            <Stack spacing={0.5}>
              {teamHeader?.leagueName && (
                <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                  {teamHeader.leagueName}
                </Typography>
              )}
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {title}
              </Typography>
              {headerDescription ? (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {headerDescription}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </AccountPageHeader>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {breadcrumbHref ? (
          <Box mb={2}>
            <Breadcrumbs aria-label="breadcrumb">
              <MUILink component={NextLink} color="inherit" underline="hover" href={breadcrumbHref}>
                {breadcrumbLabel}
              </MUILink>
              <Typography color="text.primary">Handouts</Typography>
            </Breadcrumbs>
          </Box>
        ) : null}
        {renderContent()}
      </Container>
    </main>
  );
};

export default TeamHandoutPageLayout;
