'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { Breadcrumbs, CircularProgress, Link as MuiLink, Stack, Typography } from '@mui/material';
import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import { PhotoGalleryAdminManagement } from '../../../../../../../../../components/photo-gallery/admin/PhotoGalleryAdminManagement';
import { useApiClient } from '../../../../../../../../../hooks/useApiClient';
import { getTeamSeasonDetails } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../../../../../../../utils/apiResult';

interface TeamHeader {
  teamId: string;
  teamName: string;
}

const TeamPhotoGalleryAdminContent: React.FC<{
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}> = ({ accountId, seasonId, teamSeasonId }) => {
  const apiClient = useApiClient();
  const [teamHeader, setTeamHeader] = React.useState<TeamHeader | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadTeam = async () => {
      try {
        const result = await getTeamSeasonDetails({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load team');
        setTeamHeader({
          teamId: data.team.id,
          teamName: data.name ?? 'Team',
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load team';
        setError(message);
      }
    };

    void loadTeam();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, apiClient]);

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography color="error">{error}</Typography>
        </Stack>
      </main>
    );
  }

  if (!teamHeader) {
    return (
      <main className="min-h-screen bg-background">
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </main>
    );
  }

  const teamHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  return (
    <PhotoGalleryAdminManagement
      accountId={accountId}
      teamScope={{
        teamId: teamHeader.teamId,
        teamName: teamHeader.teamName,
        breadcrumbs: (
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <MuiLink component={NextLink} color="inherit" href={teamHref}>
              Team Overview
            </MuiLink>
            <Typography color="text.primary">Photo Gallery</Typography>
          </Breadcrumbs>
        ),
      }}
    />
  );
};

export default function TeamPhotoGalleryAdminClient() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params?.accountId[0] : params?.accountId;
  const seasonId = Array.isArray(params?.seasonId) ? params?.seasonId[0] : params?.seasonId;
  const teamSeasonId = Array.isArray(params?.teamSeasonId)
    ? params?.teamSeasonId[0]
    : params?.teamSeasonId;

  if (!accountId || !seasonId || !teamSeasonId) {
    return <div>Invalid route parameters</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute
        requiredRole={['AccountAdmin', 'AccountPhotoAdmin', 'TeamAdmin', 'TeamPhotoAdmin']}
        checkAccountBoundary={true}
      >
        <TeamPhotoGalleryAdminContent
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
        />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
