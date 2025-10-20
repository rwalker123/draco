import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Container,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Group as GroupIcon,
  LocationOn as LocationIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useRole } from '../../../context/RoleContext';
import TodayScoreboard from '../../../components/TodayScoreboard';
import YesterdayScoreboard from '../../../components/YesterdayScoreboard';
import GameRecapsWidget from '../../../components/GameRecapsWidget';
import MyTeams, { UserTeam } from '../../../components/MyTeams';
import AccountPageHeader from '../../../components/AccountPageHeader';
import OrganizationsWidget from '../../../components/OrganizationsWidget';
import ThemeSwitcher from '../../../components/ThemeSwitcher';
import { JoinLeagueDashboard } from '../../../components/join-league';
import AccountPollsCard from '../../../components/polls/AccountPollsCard';
import { SponsorService } from '../../../services/sponsorService';
import SponsorCard from '../../../components/sponsors/SponsorCard';
import { getAccountById, getAccountUserTeams, listSeasonTeams } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { useAccountMembership } from '../../../hooks/useAccountMembership';
import { unwrapApiResult } from '../../../utils/apiResult';
import { AccountSeasonWithStatusType, AccountType, SponsorType } from '@draco/shared-schemas';
import HandoutSection from '@/components/handouts/HandoutSection';
import TodaysBirthdaysCard from '@/components/birthdays/TodaysBirthdaysCard';
import PendingPhotoSubmissionsPanel from '@/components/photo-submissions/PendingPhotoSubmissionsPanel';
import PhotoSubmissionForm, {
  type PhotoAlbumOption,
} from '@/components/photo-submissions/PhotoSubmissionForm';
import { usePendingPhotoSubmissions } from '../../../hooks/usePendingPhotoSubmissions';
import { usePhotoGallery } from '../../../hooks/usePhotoGallery';
import PhotoGallerySection from '@/components/photo-gallery/PhotoGallerySection';

const BaseballAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreboardLayout, setScoreboardLayout] = useState<'vertical' | 'horizontal'>('horizontal');
  const [hasAnyGames, setHasAnyGames] = useState(false);
  const [showOrganizationsWidget, setShowOrganizationsWidget] = useState(false);
  const [accountSponsors, setAccountSponsors] = useState<SponsorType[]>([]);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const { hasRole, hasRoleInAccount } = useRole();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();
  const {
    isMember,
    contact,
    loading: membershipLoading,
    error: membershipError,
  } = useAccountMembership(accountIdStr);
  const isAccountMember = isMember === true;
  const hasAccountContact = Boolean(contact);
  const canSubmitPhotos = Boolean(token && isAccountMember);
  const showSubmissionPanel = Boolean(token && accountIdStr);

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

  const submissionAlbumOptions: PhotoAlbumOption[] = useMemo(() => {
    const options = new Map<string | null, string>();
    options.set(null, 'Main Account Album (Default)');

    pendingSubmissions.forEach((submission) => {
      const album = submission.album;
      if (album?.id && album.title) {
        options.set(album.id, album.title);
      }
    });

    return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
  }, [pendingSubmissions]);

  const {
    photos: galleryPhotos,
    albums: galleryAlbums,
    loading: galleryLoading,
    error: galleryError,
    refresh: refreshGallery,
  } = usePhotoGallery({ accountId: accountIdStr ?? null });

  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string>('all');
  const [seasonTeamIds, setSeasonTeamIds] = useState<string[] | null>(null);

  const seasonFilteredPhotos = useMemo(() => {
    if (seasonTeamIds === null || seasonTeamIds.length === 0) {
      return galleryPhotos;
    }

    const allowedTeamIds = new Set(seasonTeamIds);
    return galleryPhotos.filter((photo) => {
      if (!photo.teamId) {
        return true;
      }
      return allowedTeamIds.has(photo.teamId);
    });
  }, [galleryPhotos, seasonTeamIds]);

  const seasonFilteredAlbums = useMemo(() => {
    if (seasonTeamIds === null || seasonTeamIds.length === 0) {
      return galleryAlbums;
    }

    const allowedTeamIds = new Set(seasonTeamIds);
    const albumCounts = new Map<string, number>();

    seasonFilteredPhotos.forEach((photo) => {
      const key = photo.albumId ?? 'null';
      albumCounts.set(key, (albumCounts.get(key) ?? 0) + 1);
    });

    return galleryAlbums
      .filter((album) => {
        if (!album.teamId) {
          return true;
        }
        return allowedTeamIds.has(album.teamId);
      })
      .map((album) => {
        const key = album.id ?? 'null';
        const photoCount = albumCounts.get(key) ?? 0;
        return { ...album, photoCount };
      })
      .filter((album) => album.photoCount > 0 || album.id === null);
  }, [galleryAlbums, seasonFilteredPhotos, seasonTeamIds]);

  useEffect(() => {
    if (selectedAlbumKey === 'all') {
      return;
    }

    const hasAlbum = seasonFilteredAlbums.some(
      (album) => (album.id ?? 'null') === selectedAlbumKey,
    );
    if (!hasAlbum) {
      setSelectedAlbumKey('all');
    }
  }, [seasonFilteredAlbums, selectedAlbumKey]);

  const filteredGalleryPhotos = useMemo(() => {
    if (selectedAlbumKey === 'all') {
      return seasonFilteredPhotos;
    }

    if (selectedAlbumKey === 'null') {
      return seasonFilteredPhotos.filter((photo) => photo.albumId === null);
    }

    return seasonFilteredPhotos.filter((photo) => photo.albumId === selectedAlbumKey);
  }, [seasonFilteredPhotos, selectedAlbumKey]);

  const handleAlbumTabChange = useCallback((value: string) => {
    setSelectedAlbumKey(value);
  }, []);

  const handleApprovePendingSubmission = useCallback(
    async (submissionId: string) => {
      const success = await approvePendingSubmission(submissionId);
      if (success) {
        await refreshGallery();
      }
      return success;
    },
    [approvePendingSubmission, refreshGallery],
  );

  // Fetch public account data
  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setCurrentSeason(null);
      setError('Account ID not found');
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

        const {
          account: accountData,
          seasons,
          currentSeason: responseCurrentSeason,
        } = unwrapApiResult(result, 'Account not found or not publicly accessible');
        setAccount(accountData as AccountType);

        const currentSeasonCandidate = seasons?.find((season) => season.isCurrent) ?? {
          ...responseCurrentSeason,
          isCurrent: true,
        };
        setCurrentSeason(currentSeasonCandidate as AccountSeasonWithStatusType);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to fetch account data:', err);
        setError('Failed to load account data');
        setAccount(null);
        setCurrentSeason(null);
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

  useEffect(() => {
    if (!accountIdStr || !currentSeason?.id) {
      setSeasonTeamIds(null);
      return;
    }

    let ignore = false;

    const fetchSeasonTeams = async () => {
      try {
        const result = await listSeasonTeams({
          client: apiClient,
          path: { accountId: accountIdStr, seasonId: currentSeason.id },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const teams = unwrapApiResult(result, 'Failed to load season teams');
        if (!Array.isArray(teams)) {
          setSeasonTeamIds([]);
          return;
        }

        const ids = teams
          .map((team) => team.team?.id)
          .filter((value): value is string => Boolean(value));

        setSeasonTeamIds(ids);
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to load season teams:', err);
          setSeasonTeamIds([]);
        }
      }
    };

    void fetchSeasonTeams();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, currentSeason?.id, apiClient]);

  // Fetch user teams if logged in
  useEffect(() => {
    if (!accountIdStr || !user || !token) return;

    let ignore = false;

    const fetchUserTeams = async () => {
      try {
        const result = await getAccountUserTeams({
          client: apiClient,
          path: { accountId: accountIdStr },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const teamsResponse = unwrapApiResult(result, 'Failed to load teams');

        if (ignore) {
          return;
        }

        const normalizedTeams = Array.isArray(teamsResponse) ? teamsResponse : [];
        const teams: UserTeam[] = normalizedTeams.map((team) => ({
          id: team.id,
          name: team.name ?? 'Team',
          leagueName: team.league?.name ?? 'Unknown League',
          divisionName: team.division?.name ?? undefined,
          teamId: team.team?.id,
        }));

        setUserTeams(teams);
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to fetch user teams:', err);
        }
      }
    };

    fetchUserTeams();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, user, token, apiClient]);

  useEffect(() => {
    if (!accountIdStr) return;

    const service = new SponsorService();
    service
      .listAccountSponsors(accountIdStr)
      .then((sponsors) => {
        setAccountSponsors(sponsors);
        setSponsorError(null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load account sponsors:', error);
        setSponsorError('Sponsors are currently unavailable.');
      });
  }, [accountIdStr]);

  const handleViewTeam = (teamSeasonId: string) => {
    if (!currentSeason) return;
    router.push(`/account/${accountIdStr}/seasons/${currentSeason.id}/teams/${teamSeasonId}`);
  };

  // Early return if accountId is missing - must be after all hooks
  if (!accountIdStr) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account ID not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Unified Header with Logo and Page Content */}
      <Box>
        <AccountPageHeader accountId={account.id} accountLogoUrl={account.accountLogoUrl}>
          {account.configuration?.affiliation &&
            account.configuration.affiliation.name &&
            account.configuration.affiliation.name.trim().toLowerCase() !== 'no affiliation' && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  mb: 1,
                  justifyContent: 'center',
                }}
              >
                {account.configuration.affiliation.url ? (
                  <Chip
                    label={account.configuration.affiliation.name}
                    component="a"
                    href={account.configuration.affiliation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      textDecoration: 'none',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        textDecoration: 'underline',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                ) : (
                  <Chip
                    label={account.configuration.affiliation.name}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                )}
              </Box>
            )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
              }}
            >
              <LocationIcon fontSize="small" />
              {currentSeason ? `${currentSeason.name} Season` : 'No Current Season'} • Established{' '}
              {account.configuration?.firstYear}
            </Typography>
            <ThemeSwitcher />
          </Box>
        </AccountPageHeader>
      </Box>

      {/* Main Content - Single Column Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Ways to Join the League Dashboard */}
        <JoinLeagueDashboard
          accountId={accountIdStr}
          account={account}
          token={token || undefined}
          isAccountMember={isAccountMember}
        />

        {showSubmissionPanel && (
          <Paper sx={{ p: 3, mb: 2 }}>
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
                albumOptions={submissionAlbumOptions}
                onSubmitted={() => {
                  void refreshPendingSubmissions();
                }}
              />
            ) : (
              <Alert severity="info">
                You need to be a registered contact for this account to submit photos for
                moderation.
              </Alert>
            )}
          </Paper>
        )}

        {shouldShowPendingPanel && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <PendingPhotoSubmissionsPanel
              contextLabel={account.name}
              submissions={pendingSubmissions}
              loading={pendingLoading}
              error={pendingError}
              successMessage={pendingSuccess}
              processingIds={pendingProcessingIds}
              onRefresh={refreshPendingSubmissions}
              onApprove={handleApprovePendingSubmission}
              onDeny={denyPendingSubmission}
              onClearStatus={clearPendingStatus}
              emptyMessage="No pending photo submissions for this account."
            />
          </Paper>
        )}

        {/* Scoreboard Layout Toggle */}
        {hasAnyGames && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ToggleButtonGroup
              value={scoreboardLayout}
              exclusive
              onChange={(_, newLayout) => {
                if (newLayout !== null) {
                  setScoreboardLayout(newLayout);
                }
              }}
              aria-label="scoreboard layout"
              size="small"
            >
              <ToggleButton value="vertical" aria-label="vertical layout">
                <ViewListIcon sx={{ mr: 1 }} />
                Vertical
              </ToggleButton>
              <ToggleButton value="horizontal" aria-label="horizontal layout">
                <ViewModuleIcon sx={{ mr: 1 }} />
                Horizontal
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Scoreboard Widgets - Layout changes based on selected layout */}
        {currentSeason && (
          <Box
            sx={{
              display: scoreboardLayout === 'horizontal' ? 'flex' : 'grid',
              flexDirection: scoreboardLayout === 'horizontal' ? 'column' : undefined,
              gridTemplateColumns:
                scoreboardLayout === 'vertical'
                  ? {
                      xs: '1fr',
                      md: '1fr 1fr',
                    }
                  : undefined,
              gap: scoreboardLayout === 'horizontal' ? 1 : 3,
            }}
          >
            <TodayScoreboard
              accountId={accountIdStr}
              layout={scoreboardLayout}
              currentSeasonId={currentSeason.id}
              onGamesLoaded={(games) => {
                if (games && games.length > 0) setHasAnyGames(true);
              }}
            />
            <YesterdayScoreboard
              accountId={accountIdStr}
              layout={scoreboardLayout}
              currentSeasonId={currentSeason.id}
              onGamesLoaded={(games) => {
                if (games && games.length > 0) setHasAnyGames(true);
              }}
            />
          </Box>
        )}

        <PhotoGallerySection
          title="Photo Gallery"
          description={`Relive the highlights from ${account?.name ?? 'this organization'}.`}
          photos={filteredGalleryPhotos}
          albums={seasonFilteredAlbums}
          loading={galleryLoading}
          error={galleryError}
          onRefresh={refreshGallery}
          emptyMessage="No photos have been published yet."
          enableAlbumTabs
          selectedAlbumKey={selectedAlbumKey}
          onAlbumChange={handleAlbumTabChange}
          totalCountOverride={seasonFilteredPhotos.length}
        />

        <TodaysBirthdaysCard accountId={accountIdStr} hasActiveSeason={Boolean(currentSeason)} />

        {hasAccountContact && <AccountPollsCard accountId={accountIdStr} isAuthorizedForAccount />}

        {hasAccountContact && (
          <Box
            sx={{
              maxWidth: { xs: '100%', sm: 420 },
              alignSelf: 'flex-start',
              width: '100%',
              '&:empty': { display: 'none' },
            }}
          >
            <HandoutSection
              scope={{ type: 'account', accountId: accountIdStr }}
              title="Latest Handouts"
              description="Quick access to recently added documents."
              allowManage={false}
              variant="card"
              maxItems={3}
              viewAllHref={`/account/${accountIdStr}/handouts`}
              emptyMessage="No handouts are available yet."
              hideWhenEmpty
            />
          </Box>
        )}

        {/* Game Recaps Widget */}
        {currentSeason && <GameRecapsWidget accountId={accountIdStr} seasonId={currentSeason.id} />}

        <SponsorCard
          sponsors={accountSponsors}
          title="Account Sponsors"
          emptyMessage={sponsorError ?? 'No sponsors have been added yet.'}
        />

        {/* User Teams Section */}
        {user && userTeams.length > 0 && (
          <MyTeams userTeams={userTeams} onViewTeam={handleViewTeam} title="Your Teams" />
        )}

        {/* Contact & Links */}
        <Paper sx={{ p: 4, borderRadius: 2, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Connect With Us
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {account.urls.length > 0 && (
              <Button
                variant="contained"
                href={account.urls[0].url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                Visit Website
              </Button>
            )}
            {account.socials?.twitterAccountName && (
              <Button
                variant="outlined"
                href={`https://twitter.com/${account.socials.twitterAccountName?.replace('@', '') || account.socials.twitterAccountName}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Twitter
              </Button>
            )}
            {account.socials?.facebookFanPage && (
              <Button
                variant="outlined"
                href={account.socials.facebookFanPage}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Facebook
              </Button>
            )}
          </Box>
        </Paper>

        {/* User Organizations Widget */}
        {user && (
          <Box sx={{ display: showOrganizationsWidget ? 'block' : 'none' }}>
            <OrganizationsWidget
              title="Your Other Organizations"
              showSearch={false}
              maxDisplay={3}
              sx={{ mb: 0 }}
              excludeAccountId={accountIdStr}
              onOrganizationsLoaded={(organizations) => {
                setShowOrganizationsWidget(organizations.length > 0);
              }}
            />
          </Box>
        )}
      </Box>
    </main>
  );
};

export default BaseballAccountHome;
