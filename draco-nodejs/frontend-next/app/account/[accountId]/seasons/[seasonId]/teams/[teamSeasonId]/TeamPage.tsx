'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Camera, Play, Star, Award, Target } from 'lucide-react';
import Image from 'next/image';
import GameListDisplay, { Game } from '../../../../../../../components/GameListDisplay';
import React from 'react';
import EnterGameRecapDialog from '../../../../../../../components/EnterGameRecapDialog';
import { getGameSummary } from '../../../../../../../lib/utils';
import { useAuth } from '../../../../../../../context/AuthContext';
import { useSchedulePermissions } from '../../../../../../../hooks/useSchedulePermissions';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../components/TeamInfoCard';
import { SponsorService } from '../../../../../../../services/sponsorService';
import SponsorCard from '../../../../../../../components/sponsors/SponsorCard';
import {
  SponsorType,
  UpsertGameRecapType,
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
import HandoutSection from '@/components/handouts/HandoutSection';
import CreatePlayersWantedDialog from '@/components/player-classifieds/CreatePlayersWantedDialog';
import PendingPhotoSubmissionsPanel from '../../../../../../../components/photo-submissions/PendingPhotoSubmissionsPanel';
import { usePendingPhotoSubmissions } from '../../../../../../../hooks/usePendingPhotoSubmissions';
import PhotoSubmissionForm from '../../../../../../../components/photo-submissions/PhotoSubmissionForm';

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
  const [summaryDialogOpen, setSummaryDialogOpen] = React.useState(false);
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);
  const [dialogRecap, setDialogRecap] = React.useState('');
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [summaryReadOnly, setSummaryReadOnly] = React.useState(false);
  const [teamData, setTeamData] = React.useState<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    accountName: string;
    logoUrl?: string;
    record?: { wins: number; losses: number; ties: number };
    teamId?: string;
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
  } = useTeamMembership(
    isAccountMember ? accountId : null,
    teamSeasonId,
    seasonId,
  );
  const apiClient = useApiClient();

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
        const result = await apiListTeamSeasonGames({
          client: apiClient,
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
  }, [accountId, apiClient, seasonId, teamSeasonId]);

  const handleEditSummary = async (game: Game) => {
    setSelectedGame(game);
    setDialogRecap('');
    setSummaryError(null);
    setSummaryReadOnly(false);

    if (token) {
      try {
        const summary = await getGameSummary({
          accountId,
          seasonId,
          gameId: game.id,
          teamSeasonId, // pass the current teamSeasonId
          token,
        });
        setDialogRecap(summary || '');
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof (err as { message?: unknown }).message === 'string'
        ) {
          const message = (err as { message: string }).message;
          if (message.includes('No recap found') || message.includes('not found')) {
            setDialogRecap('');
            setSummaryError(null);
          } else {
            setSummaryError(message);
          }
        } else {
          setSummaryError('Failed to load game summary');
        }
      }
    }

    setSummaryDialogOpen(true);
  };

  const handleViewSummary = async (game: Game) => {
    setSelectedGame(game);
    setSummaryReadOnly(true);
    setSummaryError(null);

    const existingRecap = game.gameRecaps?.find((recap) => recap.teamId === teamSeasonId)?.recap;

    if (existingRecap) {
      setDialogRecap(existingRecap);
      setSummaryDialogOpen(true);
      return;
    }

    try {
      const summary = await getGameSummary({
        accountId,
        seasonId,
        gameId: game.id,
        teamSeasonId,
      });
      setDialogRecap(summary || '');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        setSummaryError((err as { message: string }).message);
      } else {
        setSummaryError('Failed to load game summary');
      }
      setDialogRecap('');
    }

    setSummaryDialogOpen(true);
  };

  React.useEffect(() => {
    const service = new SponsorService(token);
    service
      .listTeamSponsors(accountId, seasonId, teamSeasonId)
      .then((sponsors) => {
        setTeamSponsors(sponsors);
        setTeamSponsorError(null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load team sponsors:', error);
        setTeamSponsorError('Team sponsors are currently unavailable.');
      });
  }, [accountId, seasonId, teamSeasonId, token]);

  const handleCloseSummaryDialog = () => {
    setSummaryDialogOpen(false);
    setSelectedGame(null);
    setSummaryReadOnly(false);
    setDialogRecap('');
    setSummaryError(null);
  };

  const handleRecapSuccess = React.useCallback(
    (recap: UpsertGameRecapType) => {
      if (!selectedGame) {
        return;
      }

      setSummaryError(null);
      setCompletedGames((prev) =>
        prev.map((g) =>
          g.id === selectedGame.id
            ? {
                ...g,
                hasGameRecap: true,
                gameRecaps: [{ teamId: teamSeasonId, recap: recap.recap }],
              }
            : g,
        ),
      );
    },
    [selectedGame, teamSeasonId],
  );

  const canManageTeamSponsors = React.useMemo(() => {
    return (
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId) ||
      hasRoleInTeam('TeamManager', teamSeasonId)
    );
  }, [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId]);

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

      {teamData?.teamId && teamMembershipError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {teamMembershipError}
        </Alert>
      )}

      {teamData?.teamId && (
        <>
          {teamMembershipLoading ? (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={24} />
                <Typography variant="body2">Checking your team access…</Typography>
              </Box>
            </Paper>
          ) : isTeamMember ? (
            <Paper sx={{ p: 3, mb: 4 }}>
              <PhotoSubmissionForm
                variant="team"
                accountId={accountId}
                teamId={teamData.teamId}
                contextName={teamData.teamName ?? teamSeason?.team?.name ?? 'this team'}
                onSubmitted={() => {
                  void refreshTeamPending();
                }}
              />
            </Paper>
          ) : null}

          {isTeamMember && (
            <Box
              sx={{
                maxWidth: { xs: '100%', md: 420 },
                mb: 4,
                '&:empty': { display: 'none', marginBottom: 0 },
              }}
            >
              <HandoutSection
                scope={{ type: 'team', accountId, teamId: teamData.teamId }}
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

          {!teamMembershipLoading && !isTeamMember && (
            <Alert severity="info" sx={{ mb: 4 }}>
              You need to be on this roster to submit photos for review.
            </Alert>
          )}
        </>
      )}

      {shouldShowTeamPendingPanel && (
        <Box sx={{ mb: 4 }}>
          <PendingPhotoSubmissionsPanel
            contextLabel={teamData?.teamName ?? 'this team'}
            submissions={teamPendingSubmissions}
            loading={teamPendingLoading}
            error={teamPendingError}
            successMessage={teamPendingSuccess}
            processingIds={teamPendingProcessing}
            onRefresh={refreshTeamPending}
            onApprove={approveTeamSubmission}
            onDeny={denyTeamSubmission}
            onClearStatus={clearTeamPendingStatus}
            emptyMessage="No pending photo submissions for this team."
          />
        </Box>
      )}

      {/* Upcoming & Recent Games - Responsive Side by Side */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading games...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <GameListDisplay
              sections={[{ title: 'Upcoming Games', games: upcomingGames }]}
              emptyMessage="No upcoming games."
            />
          </div>
          <div className="flex-1 min-w-0">
            <GameListDisplay
              sections={[{ title: 'Completed Games', games: completedGames }]}
              emptyMessage="No completed games."
              canEditRecap={canEditRecap}
              onEditRecap={handleEditSummary}
              onViewRecap={handleViewSummary}
            />
          </div>
        </div>
      )}

      {/* Stats Leaders & Sponsors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/placeholder.png" alt="Alex Johnson" />
                </Avatar>
                <div>
                  <h4 className="font-semibold">Alex Johnson</h4>
                  <p className="text-sm text-muted-foreground">Pitcher</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>45 hits</span>
                    <span>32 RBIs</span>
                    <span>.312 avg</span>
                  </div>
                </div>
                <Star className="w-5 h-5 text-yellow-400 ml-auto" />
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/placeholder.png" alt="Sarah Chen" />
                </Avatar>
                <div>
                  <h4 className="font-semibold">Sarah Chen</h4>
                  <p className="text-sm text-muted-foreground">Catcher</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>52 hits</span>
                    <span>41 RBIs</span>
                    <span>.298 avg</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <SponsorCard
          sponsors={teamSponsors}
          title="Team Sponsors"
          emptyMessage={teamSponsorError ?? 'No team sponsors have been added yet.'}
        />
      </div>

      {/* Media Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Image
                src="/placeholder.png"
                alt="Photo 1"
                width={120}
                height={80}
                className="rounded"
              />
              <Image
                src="/placeholder.png"
                alt="Photo 2"
                width={120}
                height={80}
                className="rounded"
              />
              <Image
                src="/placeholder.png"
                alt="Photo 3"
                width={120}
                height={80}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
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

      {/* Game Recap Dialog */}
      {selectedGame && (
        <EnterGameRecapDialog
          open={summaryDialogOpen}
          onClose={handleCloseSummaryDialog}
          accountId={accountId}
          seasonId={seasonId}
          gameId={selectedGame.id}
          teamSeasonId={teamSeasonId}
          initialRecap={dialogRecap}
          teamName={
            selectedGame.homeTeamId === teamSeasonId
              ? selectedGame.homeTeamName
              : selectedGame.visitorTeamName
          }
          gameDate={selectedGame.date}
          homeScore={selectedGame.homeScore}
          visitorScore={selectedGame.visitorScore}
          homeTeamName={selectedGame.homeTeamName}
          visitorTeamName={selectedGame.visitorTeamName}
          readOnly={summaryReadOnly}
          onSuccess={handleRecapSuccess}
          onError={setSummaryError}
        />
      )}
      {summaryDialogOpen && summaryError && (
        <Alert
          severity="error"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: (theme) => theme.zIndex.snackbar,
          }}
        >
          {summaryError}
        </Alert>
      )}

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
