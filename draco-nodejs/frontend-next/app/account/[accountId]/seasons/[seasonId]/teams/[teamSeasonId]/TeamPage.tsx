'use client';

import { Target } from 'lucide-react';
import GameListDisplay, { Game } from '../../../../../../../components/GameListDisplay';
import React from 'react';
import { getGameSummary } from '../../../../../../../lib/utils';
import { useAuth } from '../../../../../../../context/AuthContext';
import { useAccountTimezone } from '../../../../../../../context/AccountContext';
import { useSchedulePermissions } from '../../../../../../../hooks/useSchedulePermissions';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import AdPlacement from '../../../../../../../components/ads/AdPlacement';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import {
  getTeamSeasonDetails as apiGetTeamSeasonDetails,
  getAccountDiscordLinkStatus as apiGetDiscordLinkStatus,
  listTeamSponsors as apiListTeamSponsors,
  type SponsorList,
} from '@draco/shared-api-client';
import type { TeamSeasonRecordType } from '@draco/shared-schemas';
import SponsorCard from '../../../../../../../components/sponsors/SponsorCard';
import { SponsorType, UpsertPlayersWantedClassifiedType } from '@draco/shared-schemas';
import { useRole } from '../../../../../../../context/RoleContext';
import TeamAdminPanel from '../../../../../../../components/sponsors/TeamAdminPanel';
import { useAccountMembership } from '../../../../../../../hooks/useAccountMembership';
import { useTeamMembership } from '../../../../../../../hooks/useTeamMembership';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';
import {
  listTeamSeasonGames as apiListTeamSeasonGames,
  type RecentGames,
} from '@draco/shared-api-client';
import CreatePlayersWantedDialog from '@/components/player-classifieds/CreatePlayersWantedDialog';
import PendingPhotoSubmissionsPanel from '../../../../../../../components/photo-submissions/PendingPhotoSubmissionsPanel';
import PhotoSubmissionPanel from '../../../../../../../components/photo-submissions/PhotoSubmissionPanel';
import type { PhotoAlbumOption } from '@/components/photo-submissions/PhotoSubmissionForm';
import { usePendingPhotoSubmissions } from '../../../../../../../hooks/usePendingPhotoSubmissions';
import { usePhotoGallery } from '../../../../../../../hooks/usePhotoGallery';
import PhotoGallerySection from '@/components/photo-gallery/PhotoGallerySection';
import { useGameRecapFlow } from '../../../../../../../hooks/useGameRecapFlow';
import LeadersWidget from '../../../../../../../components/statistics/LeadersWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import SpecialAnnouncementsWidget from '@/components/announcements/SpecialAnnouncementsWidget';
import AccountOptional from '@/components/account/AccountOptional';
import TeamRosterWidget from '@/components/roster/TeamRosterWidget';
import TeamManagersWidget from '@/components/team/TeamManagersWidget';
import TeamFeaturedVideosWidget from '../../../../../../../components/social/TeamFeaturedVideosWidget';
import InformationWidget from '@/components/information/InformationWidget';
import TeamForumWidget from '@/components/team/TeamForumWidget';
import CommunityChatsWidget from '@/components/social/CommunityChatsWidget';
import Link from '@mui/material/Link';
import type { DiscordLinkStatusType } from '@draco/shared-schemas';
import { useCurrentSeason } from '../../../../../../../hooks/useCurrentSeason';

interface TeamPageProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const TeamPage: React.FC<TeamPageProps> = ({ accountId, seasonId, teamSeasonId }) => {
  const [upcomingGames, setUpcomingGames] = React.useState<Game[]>([]);
  const [completedGames, setCompletedGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [teamData, setTeamData] = React.useState<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    accountName: string;
    logoUrl?: string;
    record?: { wins: number; losses: number; ties: number };
    teamId?: string;
    leagueId?: string;
    youtubeUserId?: string | null;
  } | null>(null);
  const [teamSponsors, setTeamSponsors] = React.useState<SponsorType[]>([]);
  const [teamSponsorError, setTeamSponsorError] = React.useState<string | null>(null);
  const [informationWidgetVisible, setInformationWidgetVisible] = React.useState(true);
  const [playersWantedDialogOpen, setPlayersWantedDialogOpen] = React.useState(false);
  const [playersWantedInitialData, setPlayersWantedInitialData] = React.useState<
    UpsertPlayersWantedClassifiedType | undefined
  >(undefined);
  const { token } = useAuth();
  const { canEditRecap } = useSchedulePermissions({
    accountId,
    teamSeasonId,
  });
  const { hasRole, hasRoleInAccount, hasRoleInTeam, hasPermission } = useRole();
  const timeZone = useAccountTimezone();
  const { isMember } = useAccountMembership(accountId);
  const isAccountMember = isMember === true;
  const {
    isMember: isTeamMember,
    loading: teamMembershipLoading,
    error: teamMembershipError,
    teamSeason,
  } = useTeamMembership(isAccountMember ? accountId : null, teamSeasonId, seasonId);
  const apiClient = useApiClient();
  const apiClientRef = React.useRef(apiClient);
  const {
    currentSeasonId,
    loading: currentSeasonLoading,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId);
  const [discordLinkStatus, setDiscordLinkStatus] = React.useState<DiscordLinkStatusType | null>(
    null,
  );

  React.useEffect(() => {
    apiClientRef.current = apiClient;
  }, [apiClient]);

  React.useEffect(() => {
    if (accountId) {
      void fetchCurrentSeason();
    }
  }, [accountId, fetchCurrentSeason]);

  const isCurrentSeason = Boolean(currentSeasonId && currentSeasonId === seasonId);

  React.useEffect(() => {
    let cancelled = false;

    const loadTeamData = async () => {
      try {
        const result = await apiGetTeamSeasonDetails({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        });
        if (cancelled) return;
        const data = unwrapApiResult<TeamSeasonRecordType>(
          result,
          'Failed to fetch team information',
        );
        setTeamData({
          teamName: data.name ?? 'Unknown Team',
          leagueName: data.league?.name ?? '',
          seasonName: data.season?.name ?? '',
          accountName: '',
          logoUrl: data.team.logoUrl ?? undefined,
          record: {
            wins: data.record.w,
            losses: data.record.l,
            ties: data.record.t,
          },
          teamId: data.team.id,
          leagueId: data.league?.id ? String(data.league.id) : undefined,
          youtubeUserId: data.team.youtubeUserId ?? null,
        });
      } catch {
        // Team data is optional for page rendering
      }
    };

    loadTeamData();

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, teamSeasonId, apiClient]);

  React.useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    let isMounted = true;

    const loadTeamSponsors = async () => {
      try {
        setTeamSponsorError(null);
        const result = await apiListTeamSponsors({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        });
        if (!isMounted) {
          return;
        }
        const data = unwrapApiResult<SponsorList>(result, 'Failed to load team sponsors');
        setTeamSponsors(data.sponsors ?? []);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to load team sponsors at this time.';
        setTeamSponsorError(message);
        setTeamSponsors([]);
      }
    };

    void loadTeamSponsors();

    return () => {
      isMounted = false;
    };
  }, [accountId, seasonId, teamSeasonId, apiClient]);

  const teamModerationTeamId = teamData?.teamId ?? null;

  const canModerateTeamSubmissions =
    hasRole('Administrator') ||
    hasRole('PhotoAdmin') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInAccount('AccountPhotoAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId) ||
    hasRoleInTeam('TeamPhotoAdmin', teamSeasonId);

  const canEditPlayerPhotos = hasPermission('account.contacts.photos.manage', { accountId });

  const canViewRosterDetails =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId);

  const canViewCommunityChats =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId) ||
    isTeamMember;

  React.useEffect(() => {
    if (!token || !accountId || !canViewCommunityChats) {
      setDiscordLinkStatus(null);
      return;
    }

    let ignore = false;

    const fetchDiscordStatus = async () => {
      try {
        const result = await apiGetDiscordLinkStatus({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });
        if (ignore) return;
        const status = unwrapApiResult<DiscordLinkStatusType>(
          result,
          'Failed to get Discord link status',
        );
        setDiscordLinkStatus(status);
      } catch {
        if (!ignore) {
          setDiscordLinkStatus(null);
        }
      }
    };

    void fetchDiscordStatus();

    return () => {
      ignore = true;
    };
  }, [token, accountId, canViewCommunityChats, apiClient]);

  const showDiscordLinkAlert =
    token &&
    canViewCommunityChats &&
    discordLinkStatus?.linkingEnabled === true &&
    discordLinkStatus?.linked === false;

  const shouldShowTeamPendingPanel = Boolean(
    token && canModerateTeamSubmissions && teamModerationTeamId && isCurrentSeason,
  );
  const showTeamSubmissionPanel = Boolean(teamData?.teamId && isCurrentSeason);
  const resolvedTeamId = teamData?.teamId ?? teamSeason?.team?.id ?? null;
  const showInformationWidget = Boolean(accountId && teamSeasonId);

  const teamAnnouncementIds = ((): string[] => {
    return teamData?.teamId ? [teamData.teamId] : [];
  })();

  const {
    submissions: teamPendingSubmissions,
    loading: teamPendingLoading,
    error: teamPendingError,
    successMessage: teamPendingSuccess,
    processingIds: teamPendingProcessing,
    approve: approveTeamSubmission,
    deny: denyTeamSubmission,
    refresh: refreshTeamPending,
    clearStatus: clearTeamPendingStatus,
  } = usePendingPhotoSubmissions({
    accountId,
    teamId: teamModerationTeamId,
    enabled: shouldShowTeamPendingPanel,
  });

  const {
    photos: teamGalleryPhotos,
    albums: teamGalleryAlbums,
    loading: teamGalleryLoading,
    error: teamGalleryError,
    refresh: refreshTeamGallery,
  } = usePhotoGallery({
    accountId,
    teamId: teamData?.teamId ?? null,
    enabled: Boolean(teamData?.teamId),
  });

  const teamPendingAlbumOptions = ((): PhotoAlbumOption[] => {
    const options = new Map<string, PhotoAlbumOption>();

    teamGalleryAlbums.forEach((album) => {
      if (album.id) {
        options.set(album.id, {
          id: album.id,
          title: album.title,
          teamId: album.teamId ?? teamData?.teamId ?? null,
        });
      }
    });

    teamPendingSubmissions.forEach((submission) => {
      const album = submission.album;
      if (album?.id && album.title) {
        options.set(album.id, {
          id: album.id,
          title: album.title,
          teamId: album.teamId ?? teamData?.teamId ?? null,
        });
      }
    });

    return Array.from(options.values());
  })();

  const handleApproveTeamPhoto = async (submissionId: string, albumId: string | null) => {
    const success = await approveTeamSubmission(submissionId, albumId);
    if (success) {
      await refreshTeamGallery();
    }
    return success;
  };

  React.useEffect(() => {
    let isMounted = true;

    type ApiGame = RecentGames['recent'][number];

    const transformGame = (game: ApiGame): Game => ({
      id: game.id,
      date: game.gameDate,
      homeTeamId: game.homeTeam.id ?? '',
      visitorTeamId: game.visitorTeam.id ?? '',
      homeTeamName: game.homeTeam.name ?? '',
      visitorTeamName: game.visitorTeam.name ?? '',
      homeScore: game.homeScore,
      visitorScore: game.visitorScore,
      gameStatus: game.gameStatus,
      gameStatusText: game.gameStatusText ?? '',
      gameStatusShortText: game.gameStatusShortText,
      leagueName: game.league.name ?? '',
      fieldId: game.field?.id ?? null,
      fieldName: game.field?.name ?? null,
      fieldShortName: game.field?.shortName ?? null,
      hasGameRecap: game.hasGameRecap ?? false,
      gameRecaps: [],
      gameType: game.gameType ? Number(game.gameType) : undefined,
    });

    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = apiClientRef.current;
        const result = await apiListTeamSeasonGames({
          client,
          path: { accountId, seasonId, teamSeasonId },
          query: { upcoming: true, recent: true, limit: 5 },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load games');

        if (!isMounted) {
          return;
        }

        const upcomingMapped = data.upcoming.map(transformGame);
        const recentMapped = data.recent.map(transformGame);

        setUpcomingGames(upcomingMapped);
        setCompletedGames(recentMapped);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Error loading games';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGames();

    return () => {
      isMounted = false;
    };
  }, [accountId, seasonId, teamSeasonId]);

  const fetchRecapForTeam = async (game: Game, targetTeamId: string) => {
    const recap = await getGameSummary({
      accountId,
      seasonId,
      gameId: game.id,
      teamSeasonId: targetTeamId,
      token: token ?? undefined,
    });
    return recap ?? null;
  };

  const handleRecapSaved = (game: Game, targetTeamId: string, recap: string) => {
    setCompletedGames((prev) =>
      prev.map((entry) =>
        entry.id === game.id
          ? {
              ...entry,
              hasGameRecap: true,
              gameRecaps: [
                ...(entry.gameRecaps?.filter((existing) => existing.teamId !== targetTeamId) ?? []),
                { teamId: targetTeamId, recap },
              ],
            }
          : entry,
      ),
    );
  };

  const {
    openEditRecap,
    openViewRecap,
    dialogs: recapDialogs,
    error: recapError,
    clearError: clearRecapError,
  } = useGameRecapFlow<Game>({
    accountId,
    seasonId,
    fetchRecap: fetchRecapForTeam,
    onRecapSaved: handleRecapSaved,
  });

  const handleOpenEditRecap = (game: Game) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[TeamPage] openEditRecap click', {
        gameId: game.id,
        homeTeamId: game.homeTeamId,
        visitorTeamId: game.visitorTeamId,
        hasGameRecap: game.hasGameRecap,
        availableRecaps: game.gameRecaps?.map((entry) => entry.teamId),
      });
    }
    openEditRecap(game);
  };

  const handleOpenViewRecap = (game: Game) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[TeamPage] openViewRecap click', {
        gameId: game.id,
        homeTeamId: game.homeTeamId,
        visitorTeamId: game.visitorTeamId,
        hasGameRecap: game.hasGameRecap,
        availableRecaps: game.gameRecaps?.map((entry) => entry.teamId),
      });
    }
    openViewRecap(game);
  };

  const shouldShowTeamSponsors = teamSponsors.length > 0 || Boolean(teamSponsorError);

  const canManageTeamSponsors =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId) ||
    hasRoleInTeam('TeamManager', teamSeasonId);

  const canEnterStatistics =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId);

  const canManageTeamSocials =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId);

  const canManageInformationMessages =
    hasRole('Administrator') ||
    hasRoleInAccount('AccountAdmin', accountId) ||
    hasRoleInAccount('LeagueAdmin', accountId) ||
    hasRoleInTeam('TeamAdmin', teamSeasonId);

  const canViewManagerContacts =
    hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId) || hasRole('TeamAdmin');

  const upcomingSections = [{ title: 'Upcoming Games', games: upcomingGames }];
  const hasUpcomingGames = upcomingGames.length > 0;

  const completedSections = [{ title: 'Completed Games', games: completedGames }];

  const youtubeManagementHref =
    canManageTeamSocials && teamData?.teamId
      ? `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/youtube/manage`
      : undefined;

  const handleOpenPlayersWantedDialog = () => {
    const parts = [teamData?.leagueName, teamData?.teamName]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length > 0));

    const teamEventName = parts.join(' ').trim();

    setPlayersWantedInitialData({
      teamEventName,
      description: '',
      positionsNeeded: '',
      notifyOptOut: false,
    });
    setPlayersWantedDialogOpen(true);
  };

  const handleClosePlayersWantedDialog = () => {
    setPlayersWantedDialogOpen(false);
    setPlayersWantedInitialData(undefined);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Account Header with Team Information */}
      <AccountPageHeader accountId={accountId} style={{ marginBottom: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <TeamAvatar
                  name={teamData?.teamName || ''}
                  logoUrl={teamData?.logoUrl || undefined}
                  size={60}
                  alt={teamData?.teamName ? `${teamData.teamName} logo` : 'Team logo'}
                />
                {teamData?.leagueName && (
                  <Typography
                    variant="h4"
                    sx={{ color: 'text.secondary', fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {teamData.leagueName}
                  </Typography>
                )}
                {teamData?.teamName && (
                  <Typography
                    variant="h4"
                    sx={{ color: 'text.primary', fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {teamData.teamName}
                  </Typography>
                )}
              </Box>
              {teamData?.record && (
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                  {teamData.record.wins}-{teamData.record.losses}
                  {teamData.record.ties > 0 ? `-${teamData.record.ties}` : ''}
                </Typography>
              )}
              {teamData?.seasonName && (
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
                  {teamData.seasonName} Season
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </AccountPageHeader>
      <AdPlacement />

      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2.2fr) minmax(0, 1fr)' },
            gap: { xs: 4, lg: 6 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            {(canManageTeamSponsors || isAccountMember) && (
              <TeamAdminPanel
                accountId={accountId}
                seasonId={seasonId}
                teamSeasonId={teamSeasonId}
                isHistoricalSeason={!isCurrentSeason && !currentSeasonLoading}
                canManageSponsors={canManageTeamSponsors}
                canManageAnnouncements={Boolean(teamData?.teamId)}
                showPlayerClassifiedsLink={isAccountMember}
                playerClassifiedsHref={`/account/${accountId}/player-classifieds?tab=players-wanted`}
                teamsWantedHref={`/account/${accountId}/player-classifieds?tab=teams-wanted`}
                onPostPlayersWanted={handleOpenPlayersWantedDialog}
                handoutsHref={
                  teamData?.teamId
                    ? `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/handouts/manage`
                    : undefined
                }
                announcementsHref={
                  teamData?.teamId
                    ? `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/announcements/manage`
                    : undefined
                }
                canEnterStatistics={canEnterStatistics}
                canManageInformationMessages={canManageInformationMessages}
                informationMessagesHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/information-messages/manage`}
                youtubeHref={youtubeManagementHref}
              />
            )}

            <TeamManagersWidget
              accountId={accountId}
              seasonId={seasonId}
              teamSeasonId={teamSeasonId}
              teamName={teamData?.teamName ?? null}
              canViewContactInfo={canViewManagerContacts}
              canEditPhotos={canEditPlayerPhotos}
            />

            {teamData?.teamId && (isTeamMember || teamMembershipLoading) ? (
              <TeamForumWidget
                accountId={accountId}
                seasonId={seasonId}
                teamSeasonId={teamSeasonId}
                teamName={teamData?.teamName ?? null}
                isTeamMember={isTeamMember}
                membershipLoading={teamMembershipLoading}
              />
            ) : null}

            {showDiscordLinkAlert ? (
              <Alert severity="info">
                You haven&apos;t linked a Discord account yet. Until you do, you won&apos;t be able
                to see or post in the team&apos;s Discord channels.{' '}
                <Link href="/profile" underline="hover">
                  Link your Discord account
                </Link>
              </Alert>
            ) : null}

            {teamData?.teamId && canViewCommunityChats ? (
              <CommunityChatsWidget
                accountId={accountId}
                seasonId={seasonId}
                teamSeasonId={teamSeasonId}
              />
            ) : null}

            {showInformationWidget ? (
              <Box sx={{ display: informationWidgetVisible ? 'contents' : 'none' }}>
                <InformationWidget
                  accountId={accountId}
                  teamId={resolvedTeamId ?? undefined}
                  teamSeasonId={teamSeasonId}
                  showAccountMessages={false}
                  showTeamMessages={Boolean(resolvedTeamId)}
                  hideWhenEmpty
                  onVisibilityChange={setInformationWidgetVisible}
                  title="Information Center"
                />
              </Box>
            ) : null}

            {teamData?.teamId ? (
              <SpecialAnnouncementsWidget
                accountId={accountId}
                teamIds={teamAnnouncementIds}
                showAccountAnnouncements={false}
                title="Team Announcements"
                subtitle={
                  teamData?.teamName
                    ? `Special announcements from the ${teamData.teamName}`
                    : undefined
                }
                viewAllHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/announcements`}
                showSourceLabels={false}
              />
            ) : null}

            {teamData?.teamId ? (
              <PhotoGallerySection
                title="Team Photo Gallery"
                description={`Highlights from the ${teamData?.seasonName ?? 'current'} season.`}
                photos={teamGalleryPhotos}
                loading={teamGalleryLoading}
                error={teamGalleryError}
                onRefresh={refreshTeamGallery}
                emptyMessage="No team photos have been published yet."
                accent="team"
                totalCountOverride={teamGalleryPhotos.length}
                sx={{ height: '100%' }}
              />
            ) : null}
            {teamData?.teamId && showTeamSubmissionPanel ? (
              <AccountOptional accountId={accountId} componentId="account.home.photoUploadWidget">
                <PhotoSubmissionPanel
                  variant="team"
                  enabled={showTeamSubmissionPanel}
                  isLoading={teamMembershipLoading}
                  error={teamMembershipError}
                  canSubmit={isTeamMember}
                  accountId={accountId}
                  contextName={teamData.teamName ?? teamSeason?.name ?? 'this team'}
                  teamId={teamData.teamId}
                  onSubmitted={() => {
                    void refreshTeamPending();
                  }}
                />
              </AccountOptional>
            ) : null}

            {shouldShowTeamPendingPanel ? (
              <PendingPhotoSubmissionsPanel
                contextLabel={teamData?.teamName ?? 'this team'}
                submissions={teamPendingSubmissions}
                loading={teamPendingLoading}
                error={teamPendingError}
                successMessage={teamPendingSuccess}
                processingIds={teamPendingProcessing}
                onRefresh={refreshTeamPending}
                onApprove={handleApproveTeamPhoto}
                onDeny={denyTeamSubmission}
                onClearStatus={clearTeamPendingStatus}
                emptyMessage="No pending photo submissions for this team."
                containerSx={{ mb: 0 }}
                albumOptions={teamPendingAlbumOptions}
                isTeamContext
              />
            ) : null}

            <TeamRosterWidget
              accountId={accountId}
              seasonId={seasonId}
              teamSeasonId={teamSeasonId}
              canViewSensitiveDetails={canViewRosterDetails}
              canEditPhotos={canEditPlayerPhotos}
            />

            {shouldShowTeamSponsors ? (
              <SponsorCard
                sponsors={teamSponsors}
                title="Team Sponsors"
                emptyMessage={teamSponsorError ?? undefined}
              />
            ) : null}

            {teamData?.teamId && teamData?.youtubeUserId ? (
              <TeamFeaturedVideosWidget
                accountId={accountId}
                seasonId={seasonId}
                teamSeasonId={teamSeasonId}
                teamId={teamData.teamId}
                youtubeChannelId={teamData?.youtubeUserId ?? null}
                teamName={teamData?.teamName ?? null}
                viewAllHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/videos`}
                channelUrl={`https://www.youtube.com/channel/${teamData.youtubeUserId}`}
              />
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!loading ? (
              error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <>
                  {hasUpcomingGames ? (
                    <GameListDisplay
                      sections={upcomingSections}
                      emptyMessage="No upcoming games."
                      timeZone={timeZone}
                    />
                  ) : null}
                  <GameListDisplay
                    sections={completedSections}
                    emptyMessage="No completed games."
                    canEditRecap={canEditRecap}
                    onEditRecap={handleOpenEditRecap}
                    onViewRecap={handleOpenViewRecap}
                    timeZone={timeZone}
                  />
                </>
              )
            ) : null}

            {teamData?.leagueId ? (
              <LeadersWidget
                variant="team"
                accountId={accountId}
                seasonId={seasonId}
                teamSeasonId={teamSeasonId}
                leagueId={teamData.leagueId}
                leagueName={teamData.leagueName}
                leagues={[
                  {
                    id: teamData.leagueId,
                    name: teamData.leagueName ?? 'League',
                  },
                ]}
                teamId={teamSeasonId}
                randomize
              />
            ) : null}

            <AccountOptional accountId={accountId} componentId="team.playerInterview.widget">
              <SurveySpotlightWidget
                accountId={accountId}
                teamSeasonId={teamSeasonId}
                variant="card"
                icon={<Target className="h-5 w-5" />}
                title="Player Survey Spotlight"
                canAnswerSurvey={isAccountMember}
              />
            </AccountOptional>
          </Box>
        </Box>
      </Container>
      {recapError && (
        <Alert
          severity="error"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: (theme) => theme.zIndex.snackbar,
          }}
          onClose={clearRecapError}
        >
          {recapError}
        </Alert>
      )}

      {recapDialogs}

      <CreatePlayersWantedDialog
        accountId={accountId}
        open={playersWantedDialogOpen}
        onClose={handleClosePlayersWantedDialog}
        initialData={playersWantedInitialData}
      />
    </main>
  );
};

export default TeamPage;
