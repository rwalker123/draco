import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Camera, Play, Star, Award, Target } from 'lucide-react';
import Image from 'next/image';
import GameListDisplay, { Game } from '../../../../../../../components/GameListDisplay';
import React from 'react';
import EnterGameSummaryDialog from '../../../../../../../components/EnterGameRecapDialog';
import { getGameSummary, saveGameSummary } from '../../../../../../../lib/utils';
import { useAuth } from '../../../../../../../context/AuthContext';
import { useSchedulePermissions } from '../../../../../../../hooks/useSchedulePermissions';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../components/TeamInfoCard';

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
  const [summaryDraft, setSummaryDraft] = React.useState('');
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [summaryReadOnly, setSummaryReadOnly] = React.useState(false);
  const [summaryToView, setSummaryToView] = React.useState('');
  const [teamData, setTeamData] = React.useState<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    accountName: string;
    logoUrl?: string;
    record?: { wins: number; losses: number; ties: number };
  } | null>(null);
  const { token } = useAuth();
  const { canEditRecap } = useSchedulePermissions({
    accountId,
    teamSeasonId,
  });

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/games?upcoming=true&recent=true&limit=5`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load games');
        setUpcomingGames(data.data.upcoming || []);
        setCompletedGames(data.data.recent || []);
      })
      .catch((err) => setError(err.message || 'Error loading games'))
      .finally(() => setLoading(false));
  }, [accountId, seasonId, teamSeasonId]);

  const handleEditSummary = async (game: Game) => {
    setSelectedGame(game);
    setSummaryDraft('');
    setSummaryError(null);
    setSummaryReadOnly(false);
    setSummaryDialogOpen(true);
    if (!token) return;
    setSummaryLoading(true);
    try {
      const summary = await getGameSummary({
        accountId,
        seasonId,
        gameId: game.id,
        teamSeasonId, // pass the current teamSeasonId
        token,
      });
      setSummaryDraft(summary);
    } catch (err: unknown) {
      // If the error is a 404 with 'No recap found', treat as empty summary
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string' &&
        ((err as { message: string }).message.includes('No recap found') ||
          (err as { message: string }).message.includes('not found'))
      ) {
        setSummaryDraft('');
        setSummaryError(null);
      } else if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        setSummaryError((err as { message: string }).message);
      } else {
        setSummaryError('Failed to load game summary');
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleViewSummary = async (game: Game) => {
    setSelectedGame(game);
    setSummaryReadOnly(true);
    setSummaryDialogOpen(true);
    setSummaryError(null);
    setSummaryLoading(true);
    // Try to use existing summary if present
    if (game.gameRecaps && game.gameRecaps.length > 0 && game.gameRecaps[0].recap) {
      setSummaryToView(game.gameRecaps[0].recap || '');
      setSummaryLoading(false);
    } else {
      // Fetch from server
      try {
        const summary = await getGameSummary({
          accountId,
          seasonId,
          gameId: game.id,
          teamSeasonId,
        });
        setSummaryToView(summary || '');
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
        setSummaryToView('');
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  const handleCloseSummaryDialog = () => {
    setSummaryDialogOpen(false);
    setSelectedGame(null);
    setSummaryReadOnly(false);
    setSummaryToView('');
  };

  const handleSaveSummary = async (summary: string) => {
    if (!selectedGame || !token) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      await saveGameSummary({
        accountId,
        seasonId,
        gameId: selectedGame.id,
        teamSeasonId, // pass the current teamSeasonId
        summary,
        token,
      });
      // Update the local completedGames state with the new summary
      setCompletedGames((prev) =>
        prev.map((g) =>
          g.id === selectedGame.id
            ? {
                ...g,
                hasGameRecap: true,
                gameRecaps: [{ teamId: teamSeasonId, recap: summary }],
              }
            : g,
        ),
      );
      setSummaryDialogOpen(false);
      setSelectedGame(null);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        setSummaryError((err as { message: string }).message);
      } else {
        setSummaryError('Failed to save game summary');
      }
    } finally {
      setSummaryLoading(false);
    }
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
                  name={teamData?.teamName || 'Loading...'}
                  logoUrl={teamData?.logoUrl || undefined}
                  size={60}
                  alt={`${teamData?.teamName} logo`}
                />
                {teamData?.leagueName && (
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {teamData.leagueName}
                  </Typography>
                )}
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {teamData?.teamName || 'Loading...'}
                </Typography>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Our Sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <Image
                src="/placeholder.png"
                alt="Sponsor 1"
                width={120}
                height={60}
                className="h-12 object-contain"
              />
              <Image
                src="/placeholder.png"
                alt="Sponsor 2"
                width={120}
                height={60}
                className="h-12 object-contain"
              />
            </div>
          </CardContent>
        </Card>
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
      <EnterGameSummaryDialog
        open={summaryDialogOpen}
        onClose={handleCloseSummaryDialog}
        onSave={handleSaveSummary}
        initialSummary={summaryReadOnly ? summaryToView : summaryDraft}
        teamName={
          selectedGame?.homeTeamId === teamSeasonId
            ? selectedGame?.homeTeamName
            : selectedGame?.awayTeamName
        }
        gameDate={selectedGame?.date}
        homeScore={selectedGame?.homeScore}
        awayScore={selectedGame?.awayScore}
        homeTeamName={selectedGame?.homeTeamName}
        awayTeamName={selectedGame?.awayTeamName}
        loading={summaryLoading}
        error={summaryError}
        readOnly={summaryReadOnly}
      />
    </main>
  );
};

export default TeamPage;
