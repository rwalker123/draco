'use client';

import { Target } from 'lucide-react';
import GameListDisplay, { Game } from '../../../../../../../components/GameListDisplay';
import React from 'react';
import { getGameSummary } from '../../../../../../../lib/utils';
import { useAuth } from '../../../../../../../context/AuthContext';
import { useAccountTimezone } from '../../../../../../../context/AccountContext';
import { useSchedulePermissions } from '../../../../../../../hooks/useSchedulePermissions';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../components/TeamInfoCard';
import SponsorCard from '../../../../../../../components/sponsors/SponsorCard';
import { SponsorService } from '../../../../../../../services/sponsorService';
import {
  AnnouncementType,
  SponsorType,
  UpsertPlayersWantedClassifiedType,
} from '@draco/shared-schemas';
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
import { usePendingPhotoSubmissions } from '../../../../../../../hooks/usePendingPhotoSubmissions';
import { usePhotoGallery } from '../../../../../../../hooks/usePhotoGallery';
import PhotoGallerySection from '@/components/photo-gallery/PhotoGallerySection';
import { useGameRecapFlow } from '../../../../../../../hooks/useGameRecapFlow';
import LeadersWidget from '../../../../../../../components/statistics/LeadersWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import { AnnouncementService } from '@/services/announcementService';
import SpecialAnnouncementsWidget, {
  type SpecialAnnouncementCard,
} from '@/components/announcements/SpecialAnnouncementsWidget';
import AccountOptional from '@/components/account/AccountOptional';
import TeamRosterWidget from '@/components/roster/TeamRosterWidget';
import TeamManagersWidget from '@/components/team/TeamManagersWidget';
import TeamFeaturedVideosWidget from '../../../../../../../components/social/TeamFeaturedVideosWidget';
import InformationWidget from '@/components/information/InformationWidget';

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
  const [teamAnnouncements, setTeamAnnouncements] = React.useState<AnnouncementType[]>([]);
  const [teamAnnouncementsLoading, setTeamAnnouncementsLoading] = React.useState(false);
  const [teamAnnouncementsError, setTeamAnnouncementsError] = React.useState<string | null>(null);
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
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
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
  const sponsorService = React.useMemo(
    () => new SponsorService(token, apiClient),
    [token, apiClient],
  );
  const announcementService = React.useMemo(
    () => new AnnouncementService(token, apiClient),
    [token, apiClient],
  );

  React.useEffect(() => {
    apiClientRef.current = apiClient;
  }, [apiClient]);

  React.useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    let isMounted = true;

    const loadTeamSponsors = async () => {
      try {
        setTeamSponsorError(null);
        const sponsors = await sponsorService.listTeamSponsors(accountId, seasonId, teamSeasonId);
        if (!isMounted) {
          return;
        }
        setTeamSponsors(sponsors);
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
  }, [accountId, seasonId, teamSeasonId, sponsorService]);

  React.useEffect(() => {
    if (!accountId || !teamData?.teamId) {
      setTeamAnnouncements([]);
      setTeamAnnouncementsError(null);
      setTeamAnnouncementsLoading(false);
      return;
    }

    let ignore = false;

    const fetchTeamAnnouncements = async () => {
      setTeamAnnouncementsLoading(true);
      setTeamAnnouncementsError(null);

      try {
        const data = await announcementService.listTeamAnnouncements({
          accountId,
          teamId: teamData.teamId!,
        });

        if (ignore) {
          return;
        }

        setTeamAnnouncements(data);
      } catch (err) {
        if (ignore) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load team announcements';
        setTeamAnnouncementsError(message);
        setTeamAnnouncements([]);
      } finally {
        if (!ignore) {
          setTeamAnnouncementsLoading(false);
        }
      }
    };

    void fetchTeamAnnouncements();

    return () => {
      ignore = true;
    };
  }, [accountId, teamData?.teamId, announcementService]);

  const teamModerationTeamId = teamData?.teamId ?? null;

  const canModerateTeamSubmissions = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRole('PhotoAdmin') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInAccount('AccountPhotoAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId) ||
      hasRoleInTeam('TeamPhotoAdmin', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const canViewRosterDetails = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const shouldShowTeamPendingPanel = Boolean(
    token && canModerateTeamSubmissions && teamModerationTeamId,
  );
  const showTeamSubmissionPanel = Boolean(teamData?.teamId);
  const resolvedTeamId = teamData?.teamId ?? teamSeason?.team?.id ?? null;
  const showInformationWidget = Boolean(accountId && teamSeasonId);

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
    loading: teamGalleryLoading,
    error: teamGalleryError,
    refresh: refreshTeamGallery,
  } = usePhotoGallery({
    accountId,
    teamId: teamData?.teamId ?? null,
    enabled: Boolean(teamData?.teamId),
  });

  const handleApproveTeamPhoto = React.useCallback(
    async (submissionId: string) => {
      const success = await approveTeamSubmission(submissionId);
      if (success) {
        await refreshTeamGallery();
      }
      return success;
    },
    [approveTeamSubmission, refreshTeamGallery],
  );

  const specialTeamAnnouncements = React.useMemo<SpecialAnnouncementCard[]>(() => {
    if (teamAnnouncements.length === 0) {
      return [];
    }

    const teamName = teamData?.teamName;
    const rawLeagueName = teamData?.leagueName;
    const leagueName =
      rawLeagueName && rawLeagueName !== 'Unknown League' ? rawLeagueName : undefined;
    const heading = teamName ? (leagueName ? `${leagueName} ${teamName}` : teamName) : undefined;
    const sourceLabel = teamName ? `${teamName} Announcement` : 'Team Announcement';

    return teamAnnouncements
      .filter((announcement) => announcement.isSpecial)
      .map<SpecialAnnouncementCard>((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        publishedAt: announcement.publishedAt,
        accountId: announcement.accountId,
        teamId: announcement.teamId,
        visibility: announcement.visibility,
        body: announcement.body,
        sourceLabel,
        heading,
      }));
  }, [teamAnnouncements, teamData?.teamName, teamData?.leagueName]);

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

  const fetchRecapForTeam = React.useCallback(
    async (game: Game, targetTeamId: string) => {
      const recap = await getGameSummary({
        accountId,
        seasonId,
        gameId: game.id,
        teamSeasonId: targetTeamId,
        token: token ?? undefined,
      });
      return recap ?? null;
    },
    [accountId, seasonId, token],
  );

  const handleRecapSaved = React.useCallback((game: Game, targetTeamId: string, recap: string) => {
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
  }, []);

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

  const handleOpenEditRecap = React.useCallback(
    (game: Game) => {
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
    },
    [openEditRecap],
  );

  const handleOpenViewRecap = React.useCallback(
    (game: Game) => {
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
    },
    [openViewRecap],
  );

  const shouldShowTeamSponsors = teamSponsors.length > 0 || Boolean(teamSponsorError);

  const canManageTeamSponsors = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId) ||
      hasRoleInTeam('TeamManager', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const canEnterStatistics = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const canManageTeamSocials = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const canManageInformationMessages = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInAccount('LeagueAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

  const canViewManagerContacts = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRole('TeamAdmin')
    );
  }, [accountId, hasRole, hasRoleInAccount]);

  const upcomingSections = React.useMemo(
    () => [{ title: 'Upcoming Games', games: upcomingGames }],
    [upcomingGames],
  );
  const hasUpcomingGames = upcomingGames.length > 0;

  const completedSections = React.useMemo(
    () => [{ title: 'Completed Games', games: completedGames }],
    [completedGames],
  );

  const youtubeManagementHref =
    canManageTeamSocials && teamData?.teamId
      ? `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/youtube/manage`
      : undefined;

  const handleOpenPlayersWantedDialog = React.useCallback(() => {
    const parts = [teamData?.leagueName, teamData?.teamName]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length > 0));

    const teamEventName = parts.join(' ').trim();

    setPlayersWantedInitialData({
      teamEventName,
      description: '',
      positionsNeeded: '',
    });
    setPlayersWantedDialogOpen(true);
  }, [teamData]);

  const handleClosePlayersWantedDialog = React.useCallback(() => {
    setPlayersWantedDialogOpen(false);
    setPlayersWantedInitialData(undefined);
  }, []);

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

      {/* Hidden TeamInfoCard to load data */}
      <div style={{ display: 'none' }}>
        <TeamInfoCard
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          onTeamDataLoaded={setTeamData}
        />
      </div>

      {(canManageTeamSponsors || isAccountMember) && (
        <TeamAdminPanel
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          canManageSponsors={canManageTeamSponsors}
          canManageAnnouncements={Boolean(teamData?.teamId)}
          showPlayerClassifiedsLink={isAccountMember}
          playerClassifiedsHref={`/account/${accountId}/player-classifieds?tab=players-wanted`}
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

      {showInformationWidget ? (
        <Box
          sx={{
            mt: informationWidgetVisible ? 4 : 0,
            display: informationWidgetVisible ? 'block' : 'none',
          }}
        >
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

      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {teamData?.teamId ? (
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
            <SpecialAnnouncementsWidget
              announcements={specialTeamAnnouncements}
              loading={teamAnnouncementsLoading}
              error={teamAnnouncementsError}
              title="Team Announcements"
              subtitle={
                teamData?.teamName
                  ? `Special announcements from the ${teamData.teamName}`
                  : undefined
              }
              viewAllHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/announcements`}
              showSourceLabels={false}
            />
          </Box>
        ) : null}

        {!loading ? (
          <Box sx={{ flex: '2 1 640px', minWidth: 320 }}>
            {error ? (
              <Alert severity="error" sx={{ height: '100%' }}>
                {error}
              </Alert>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                }}
              >
                {hasUpcomingGames ? (
                  <Box sx={{ flex: '1 1 320px', minWidth: 280 }}>
                    <GameListDisplay
                      sections={upcomingSections}
                      emptyMessage="No upcoming games."
                      timeZone={timeZone}
                    />
                  </Box>
                ) : null}
                <Box sx={{ flex: '1 1 320px', minWidth: 280 }}>
                  <GameListDisplay
                    sections={completedSections}
                    emptyMessage="No completed games."
                    canEditRecap={canEditRecap}
                    onEditRecap={handleOpenEditRecap}
                    onViewRecap={handleOpenViewRecap}
                    timeZone={timeZone}
                  />
                </Box>
              </Box>
            )}
          </Box>
        ) : null}

        {teamData?.teamId && teamData?.youtubeUserId ? (
          <Box sx={{ flex: '2 1 640px', minWidth: 320 }}>
            <TeamFeaturedVideosWidget
              accountId={accountId}
              seasonId={seasonId}
              teamSeasonId={teamSeasonId}
              youtubeChannelId={teamData?.youtubeUserId ?? null}
              teamName={teamData?.teamName ?? null}
              viewAllHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/videos`}
              channelUrl={`https://www.youtube.com/channel/${teamData.youtubeUserId}`}
            />
          </Box>
        ) : null}

        {teamData?.leagueId ? (
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
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
          </Box>
        ) : null}

        <Box sx={{ flex: '2 1 640px', minWidth: 320 }}>
          <TeamRosterWidget
            accountId={accountId}
            seasonId={seasonId}
            teamSeasonId={teamSeasonId}
            canViewSensitiveDetails={canViewRosterDetails}
          />
        </Box>

        <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
          <TeamManagersWidget
            accountId={accountId}
            seasonId={seasonId}
            teamSeasonId={teamSeasonId}
            teamName={teamData?.teamName ?? null}
            canViewContactInfo={canViewManagerContacts}
          />
        </Box>

        <AccountOptional accountId={accountId} componentId="team.playerInterview.widget">
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
            <SurveySpotlightWidget
              accountId={accountId}
              teamSeasonId={teamSeasonId}
              variant="card"
              icon={<Target className="h-5 w-5" />}
              title="Player Survey Spotlight"
              canAnswerSurvey={isAccountMember}
            />
          </Box>
        </AccountOptional>

        {shouldShowTeamPendingPanel ? (
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
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
            />
          </Box>
        ) : null}

        {teamData?.teamId ? (
          <Box sx={{ flex: '2 1 640px', minWidth: 320 }}>
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
          </Box>
        ) : null}

        {teamData?.teamId && showTeamSubmissionPanel ? (
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
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
          </Box>
        ) : null}

        {shouldShowTeamSponsors ? (
          <Box sx={{ flex: '1 1 360px', minWidth: 300 }}>
            <SponsorCard
              sponsors={teamSponsors}
              title="Team Sponsors"
              emptyMessage={teamSponsorError ?? undefined}
            />
          </Box>
        ) : null}
      </Box>

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
