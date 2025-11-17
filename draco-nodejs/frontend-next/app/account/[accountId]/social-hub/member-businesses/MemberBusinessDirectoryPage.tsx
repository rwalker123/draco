'use client';

import React from 'react';
import {
  Alert,
  Breadcrumbs,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { listMemberBusinesses } from '@draco/shared-api-client';
import type { MemberBusinessType } from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import MemberBusinessSummary from '@/components/profile/MemberBusinessSummary';
import { useAccount } from '@/context/AccountContext';
import { useApiClient } from '@/hooks/useApiClient';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';

const MemberBusinessDirectoryPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { currentAccount } = useAccount();
  const apiClient = useApiClient();
  const {
    currentSeasonId,
    currentSeasonName,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId || '');

  const [businesses, setBusinesses] = React.useState<MemberBusinessType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }
    void fetchCurrentSeason();
  }, [accountId, fetchCurrentSeason]);

  React.useEffect(() => {
    if (!accountId || !currentSeasonId) {
      setBusinesses([]);
      return;
    }

    let ignore = false;

    const loadBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listMemberBusinesses({
          client: apiClient,
          path: { accountId },
          query: { seasonId: currentSeasonId },
          throwOnError: false,
        });
        const payload = unwrapApiResult(result, 'Unable to load member businesses.');
        if (!ignore) {
          setBusinesses(payload?.memberBusinesses ?? []);
        }
      } catch (err) {
        if (ignore) {
          return;
        }
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Unable to load member businesses.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadBusinesses();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, currentSeasonId]);

  if (!accountId) {
    return null;
  }

  const seasonLabel = currentSeasonName ? `${currentSeasonName} season` : 'current season';
  const accountName = currentAccount?.name ?? 'this account';

  const renderDirectory = () => {
    if (seasonLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading season details…
          </Typography>
        </Stack>
      );
    }

    if (!currentSeasonId) {
      return (
        <Alert severity="info">
          Start a season for {accountName} to highlight active member businesses.
        </Alert>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (loading) {
      return (
        <Stack spacing={2} sx={{ py: 2 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`business-card-skeleton-${index}`} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      );
    }

    if (!businesses.length) {
      return (
        <Alert severity="info">No member businesses have been published for this season yet.</Alert>
      );
    }

    return (
      <Stack spacing={2} sx={{ mt: 3 }}>
        {businesses.map((business) => (
          <Card key={business.id} variant="outlined" sx={{ borderColor: 'divider' }}>
            <CardContent>
              <MemberBusinessSummary business={business} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Member Businesses</h1>
          <p className="text-base text-muted-foreground">
            Support and promote the companies operated by your rostered members.
          </p>
        </div>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component={NextLink}
            href={`/account/${accountId}/social-hub`}
            underline="hover"
            color="inherit"
          >
            Social Hub
          </Link>
          <Typography color="text.primary">Member Businesses</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          Member Businesses
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Discover businesses owned by active members of {accountName} for the {seasonLabel}.
        </Typography>

        {seasonError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {seasonError}
          </Alert>
        ) : null}

        {renderDirectory()}
      </Container>
    </main>
  );
};

export default MemberBusinessDirectoryPage;
