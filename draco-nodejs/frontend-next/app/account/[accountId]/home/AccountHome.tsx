import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Container,
  Chip,
} from '@mui/material';
import {
  CalendarMonth,
  Group,
  Business,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import BaseballAccountHome from '../BaseballAccountHome';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { AccountType, AccountSeasonWithStatusType } from '@draco/shared-schemas';
import PendingPhotoSubmissionsPanel from '../../../../components/photo-submissions/PendingPhotoSubmissionsPanel';
import PhotoSubmissionForm, {
  type PhotoAlbumOption,
} from '../../../../components/photo-submissions/PhotoSubmissionForm';
import { usePendingPhotoSubmissions } from '../../../../hooks/usePendingPhotoSubmissions';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';

const AccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [seasons, setSeasons] = useState<AccountSeasonWithStatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const { hasRole, hasRoleInAccount } = useRole();
  const router = useRouter();
  const { accountId } = useParams();
  const apiClient = useApiClient();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  const canModerateAccountPhotos = useMemo(() => {
    if (!accountIdStr) {
      return false;
    }

    return (
      hasRole('Administrator') ||
      hasRole('PhotoAdmin') ||
      hasRoleInAccount('AccountAdmin', accountIdStr) ||
      hasRoleInAccount('AccountPhotoAdmin', accountIdStr)
    );
  }, [accountIdStr, hasRole, hasRoleInAccount]);

  const shouldShowPendingPanel = Boolean(token && canModerateAccountPhotos && accountIdStr);
  const {
    isMember: isAccountMember,
    loading: membershipLoading,
    error: membershipError,
  } = useAccountMembership(accountIdStr ?? null);

  const {
    submissions: pendingSubmissions,
    loading: pendingLoading,
    error: pendingError,
    successMessage: pendingSuccess,
    processingIds: pendingProcessingIds,
    approve: approvePendingSubmission,
    deny: denyPendingSubmission,
    refresh: refreshPendingSubmissions,
    clearStatus: clearPendingStatus,
  } = usePendingPhotoSubmissions({
    accountId: accountIdStr ?? null,
    enabled: shouldShowPendingPanel,
  });

  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setSeasons([]);
      setError('Account not found or not publicly accessible');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          query: { includeCurrentSeason: true },
          throwOnError: false,
        });

        if (!isMounted) {
          return;
        }

        const accountWithSeasons = unwrapApiResult(
          result,
          'Account not found or not publicly accessible',
        );

        setAccount(accountWithSeasons.account as AccountType);
        setSeasons(accountWithSeasons.seasons ?? []);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load account information', err);
        setError('Failed to load account information');
        setAccount(null);
        setSeasons([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      isMounted = false;
    };
  }, [accountIdStr, apiClient]);

  const handleViewSeasons = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/seasons`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleManageAccount = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/management`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleAccountSettings = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/settings`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  // Helper to get current path safely
  const getCurrentPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading account information...
        </Typography>
      </Container>
    );
  }

  if (error || !account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Account not found'}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => router.push('/accounts')}>
            Back to Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  // Render baseball-specific home page for baseball accounts
  if (account.configuration?.accountType?.name?.toLowerCase() === 'baseball') {
    return <BaseballAccountHome />;
  }

  const currentSeason = seasons.find((s) => s.isCurrent);
  const yearsActive =
    typeof account.configuration?.firstYear === 'number'
      ? new Date().getFullYear() - account.configuration?.firstYear + 1
      : 'N/A';

  const albumOptions: PhotoAlbumOption[] = (() => {
    const options = new Map<string | null, string>();
    options.set(null, 'Main Account Album (Default)');

    pendingSubmissions.forEach((submission) => {
      const album = submission.album;
      if (album?.id && album.title) {
        options.set(album.id, album.title);
      }
    });

    return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
  })();

  const canSubmitPhotos = Boolean(token && isAccountMember);
  const showSubmissionPanel = Boolean(token && accountIdStr);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {account.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Chip
            label={account.configuration?.accountType?.name ?? 'Account'}
            color="primary"
            variant="outlined"
            icon={<Business />}
          />
          {account.configuration?.affiliation && (
            <Chip
              label={account.configuration?.affiliation?.name ?? ''}
              variant="outlined"
              icon={<Group />}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          Established in {account.configuration?.firstYear ?? 'N/A'} •{' '}
          {account.configuration?.timeZone ?? 'Unknown timezone'}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CalendarMonth />}
          onClick={handleViewSeasons}
        >
          View Seasons
        </Button>
        {user && (
          <>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleManageAccount}>
              Manage Account
            </Button>
            <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleAccountSettings}>
              Settings
            </Button>
          </>
        )}
        {!user && (
          <Button
            variant="outlined"
            onClick={() => router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`)}
          >
            Sign In to Manage
          </Button>
        )}
      </Box>

      {showSubmissionPanel && (
        <Paper sx={{ p: 3, mb: 4 }}>
          {membershipLoading ? (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={24} />
              <Typography variant="body2">Checking your access…</Typography>
            </Box>
          ) : membershipError ? (
            <Alert severity="error">{membershipError}</Alert>
          ) : canSubmitPhotos ? (
            <PhotoSubmissionForm
              variant="account"
              accountId={accountIdStr ?? ''}
              contextName={account.name}
              albumOptions={albumOptions}
              onSubmitted={() => {
                void refreshPendingSubmissions();
              }}
            />
          ) : (
            <Alert severity="info">
              You need to be a registered contact for this account to submit photos for moderation.
            </Alert>
          )}
        </Paper>
      )}

      {shouldShowPendingPanel && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <PendingPhotoSubmissionsPanel
            contextLabel={account.name}
            submissions={pendingSubmissions}
            loading={pendingLoading}
            error={pendingError}
            successMessage={pendingSuccess}
            processingIds={pendingProcessingIds}
            onRefresh={refreshPendingSubmissions}
            onApprove={approvePendingSubmission}
            onDeny={denyPendingSubmission}
            onClearStatus={clearPendingStatus}
            emptyMessage="No pending photo submissions for this account."
          />
        </Paper>
      )}

      {/* Current Season Info */}
      {currentSeason && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Current Season
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {currentSeason.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is the active season for {account.name}. View schedules, standings, and more.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<ViewIcon />} onClick={handleViewSeasons}>
              View Season Details
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {seasons.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Seasons
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {yearsActive}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Years Active
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {currentSeason ? 'Active' : 'Off Season'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Status
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Contact & Links */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contact & Links
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {account.urls.length > 0 && (
            <Button
              variant="outlined"
              href={account.urls[0].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Website
            </Button>
          )}
          {account.socials?.twitterAccountName && (
            <Button
              variant="outlined"
              href={`https://twitter.com/${account.socials?.twitterAccountName.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </Button>
          )}
          {account.socials?.facebookFanPage && (
            <Button
              variant="outlined"
              href={account.socials?.facebookFanPage}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </Button>
          )}
        </Box>
      </Paper>

      {/* Recent Seasons */}
      {seasons.length > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Seasons
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {seasons.slice(0, 5).map((season) => (
              <Chip
                key={season.id}
                label={season.name}
                color={season.isCurrent ? 'primary' : 'default'}
                variant={season.isCurrent ? 'filled' : 'outlined'}
                onClick={() => handleViewSeasons()}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </main>
  );
};

export default AccountHome;
