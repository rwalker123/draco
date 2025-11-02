'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Play, Target } from 'lucide-react';
import Image from 'next/image';
import GameListDisplay, { Game } from '../../../../../../../components/GameListDisplay';
import React from 'react';
import { getGameSummary } from '../../../../../../../lib/utils';
import { useAuth } from '../../../../../../../context/AuthContext';
import { useSchedulePermissions } from '../../../../../../../hooks/useSchedulePermissions';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../components/TeamInfoCard';
import SponsorCard from '../../../../../../../components/sponsors/SponsorCard';
import { SponsorService } from '../../../../../../../services/sponsorService';
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
import HandoutSection from '@/components/handouts/HandoutSection';
import CreatePlayersWantedDialog from '@/components/player-classifieds/CreatePlayersWantedDialog';
import PendingPhotoSubmissionsPanel from '../../../../../../../components/photo-submissions/PendingPhotoSubmissionsPanel';
import PhotoSubmissionPanel from '../../../../../../../components/photo-submissions/PhotoSubmissionPanel';
import { usePendingPhotoSubmissions } from '../../../../../../../hooks/usePendingPhotoSubmissions';
import { usePhotoGallery } from '../../../../../../../hooks/usePhotoGallery';
import PhotoGallerySection from '@/components/photo-gallery/PhotoGallerySection';
import { useGameRecapFlow } from '../../../../../../../hooks/useGameRecapFlow';
import LeadersWidget from '../../../../../../../components/statistics/LeadersWidget';

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
  } | null>(null);
  const [teamSponsors, setTeamSponsors] = React.useState<SponsorType[]>([]);
  const [teamSponsorError, setTeamSponsorError] = React.useState<string | null>(null);
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

  const shouldShowTeamPendingPanel = Boolean(
    token && canModerateTeamSubmissions && teamModerationTeamId,
  );
  const showTeamSubmissionPanel = Boolean(teamData?.teamId);

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

  const teamHandoutScope = React.useMemo(() => {
    if (!teamData?.teamId) {
      return null;
    }
    return {
      type: 'team' as const,
      accountId,
      teamId: teamData.teamId,
    };
  }, [accountId, teamData?.teamId]);

  const upcomingSections = React.useMemo(
    () => [{ title: 'Upcoming Games', games: upcomingGames }],
    [upcomingGames],
  );

  const completedSections = React.useMemo(
    () => [{ title: 'Completed Games', games: completedGames }],
    [completedGames],
  );

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
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {teamData.leagueName}
                  </Typography>
                )}
                {teamData?.teamName && (
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {teamData.teamName}
                  </Typography>
                )}
              </Box>
              {teamData?.record && (
                <Typography
                  variant="h6"
                  sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'medium' }}
                >
                  {teamData.record.wins}-{teamData.record.losses}
                  {teamData.record.ties > 0 ? `-${teamData.record.ties}` : ''}
                </Typography>
              )}
              {teamData?.seasonName && (
                <Typography
                  variant="body1"
                  sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}
                >
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
          showPlayerClassifiedsLink={isAccountMember}
          playerClassifiedsHref={`/account/${accountId}/player-classifieds?tab=players-wanted`}
          onPostPlayersWanted={handleOpenPlayersWantedDialog}
          handoutsHref={
            teamData?.teamId
              ? `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/handouts/manage`
              : undefined
          }
        />
      )}

      {teamData?.leagueId && (
        <Box sx={{ mt: 4 }}>
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
      )}

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
          containerSx={{ mb: 4 }}
        />
      ) : null}

      {teamData?.teamId && (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: showTeamSubmissionPanel
                ? {
                    xs: '1fr',
                    lg: 'minmax(0, 2.1fr) minmax(0, 1fr)',
                  }
                : '1fr',
              alignItems: 'stretch',
              mb: 6,
            }}
          >
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Image
                  src="/placeholder.png"
                  alt="Video 1"
                  width={120}
                  height={80}
                  className="rounded"
                />
                <Image
                  src="/placeholder.png"
                  alt="Video 2"
                  width={120}
                  height={80}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>

          {isTeamMember && teamHandoutScope && (
            <Box
              sx={{
                maxWidth: { xs: '100%', md: 420 },
                mb: 4,
                '&:empty': { display: 'none', marginBottom: 0 },
              }}
            >
              <HandoutSection
                scope={teamHandoutScope}
                title="Team Handouts"
                description="Important documents shared with your roster."
                allowManage={false}
                variant="card"
                maxItems={3}
                viewAllHref={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/handouts`}
                emptyMessage="No team handouts have been posted yet."
                hideWhenEmpty
              />
            </Box>
          )}
        </>
      )}

      {/* Upcoming & Recent Games - Responsive Side by Side */}
      {loading ? null : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <GameListDisplay sections={upcomingSections} emptyMessage="No upcoming games." />
          </div>
          <div className="flex-1 min-w-0">
            <GameListDisplay
              sections={completedSections}
              emptyMessage="No completed games."
              canEditRecap={canEditRecap}
              onEditRecap={handleOpenEditRecap}
              onViewRecap={handleOpenViewRecap}
            />
          </div>
        </div>
      )}

      {/* Stats Leaders & Sponsors */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 min-w-0">
          {shouldShowTeamSponsors && (
            <SponsorCard
              sponsors={teamSponsors}
              title="Team Sponsors"
              emptyMessage={teamSponsorError ?? undefined}
            />
          )}
        </div>
      </div>

      {/* Community Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Team Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-blue-50 p-3 rounded">
                Great batting practice today! Ready for the upcoming game ⚾
              </div>
              <div className="bg-blue-50 p-3 rounded">
                Thanks to all the fans who came out to support us last weekend! 🙌
              </div>
              <Button variant="outline" className="w-full mt-2">
                Share an Update
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Player Survey Spotlight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="italic text-gray-700 mb-2">
              Q: What&#39;s your favorite pre-game meal?
            </div>
            <div className="font-semibold text-blue-800">A: Pasta! - Alex Johnson</div>
            <Button variant="outline" className="w-full mt-4">
              Answer a Survey
            </Button>
          </CardContent>
        </Card>
      </div>

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
