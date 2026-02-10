'use client';

import React from 'react';
import { Button, Box, Stack, Typography, Link as MuiLink } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import Link from 'next/link';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import YouTubeIcon from '@mui/icons-material/YouTube';
import WidgetShell from '../ui/WidgetShell';
import AccountOptional from '../account/AccountOptional';
import { useAuth } from '../../context/AuthContext';
import { playerClassifiedService } from '../../services/playerClassifiedService';

interface TeamAdminPanelProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  canManageSponsors?: boolean;
  canManageAnnouncements?: boolean;
  showPlayerClassifiedsLink?: boolean;
  playerClassifiedsHref?: string;
  onPostPlayersWanted?: () => void;
  handoutsHref?: string;
  announcementsHref?: string;
  canEnterStatistics?: boolean;
  informationMessagesHref?: string;
  canManageInformationMessages?: boolean;
  youtubeHref?: string;
  teamsWantedHref?: string;
  isHistoricalSeason?: boolean;
}

const TeamAdminPanel: React.FC<TeamAdminPanelProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  canManageSponsors = true,
  canManageAnnouncements = true,
  showPlayerClassifiedsLink = false,
  playerClassifiedsHref,
  onPostPlayersWanted,
  handoutsHref,
  announcementsHref,
  canEnterStatistics = false,
  informationMessagesHref,
  canManageInformationMessages = false,
  youtubeHref,
  teamsWantedHref,
  isHistoricalSeason = false,
}) => {
  const shouldShowClassifiedsLink =
    showPlayerClassifiedsLink && (!!playerClassifiedsHref || !!onPostPlayersWanted);
  const shouldShowHandoutsLink = Boolean(handoutsHref);
  const shouldShowAnnouncementsLink = canManageAnnouncements && Boolean(announcementsHref);
  const shouldShowStatEntryLink = Boolean(canEnterStatistics);
  const shouldShowInformationMessagesLink = Boolean(
    canManageInformationMessages && informationMessagesHref,
  );
  const shouldShowYouTubeLink = Boolean(youtubeHref);
  const { token } = useAuth();
  const [teamsWantedCount, setTeamsWantedCount] = React.useState<number | null>(null);
  const [teamsWantedCountError, setTeamsWantedCountError] = React.useState(false);

  React.useEffect(() => {
    if (!teamsWantedHref || !token) {
      setTeamsWantedCount(null);
      return;
    }

    const controller = new AbortController();

    const fetchTeamsWantedCount = async () => {
      try {
        const result = await playerClassifiedService.getTeamsWanted(
          accountId,
          { page: 1, limit: 1 },
          token,
          controller.signal,
        );
        if (controller.signal.aborted) {
          return;
        }
        const total = typeof result.total === 'number' ? result.total : result.data.length;
        setTeamsWantedCount(total);
        setTeamsWantedCountError(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load teams wanted count', error);
        setTeamsWantedCount(null);
        setTeamsWantedCountError(true);
      }
    };

    fetchTeamsWantedCount();

    return () => {
      controller.abort();
    };
  }, [accountId, token, teamsWantedHref]);

  const teamsWantedMessage = (() => {
    if (!teamsWantedHref) {
      return null;
    }

    if (teamsWantedCountError) {
      return 'Unable to load player counts right now';
    }

    if (typeof teamsWantedCount === 'number') {
      const noun = teamsWantedCount === 1 ? 'player' : 'players';
      return `${teamsWantedCount} ${noun} looking for teams`;
    }

    return 'Players looking for teams';
  })();

  return (
    <WidgetShell
      title="Team Management"
      subtitle="Manage the resources for your team."
      accent="info"
      sx={{
        mb: 4,
      }}
    >
      {isHistoricalSeason ? (
        <Typography variant="body2" color="text.secondary">
          Team management is only available for the current season.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}
            >
              {canManageSponsors && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<HandshakeIcon />}
                  component={Link}
                  href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`}
                >
                  Sponsors
                </Button>
              )}
              {shouldShowStatEntryLink && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BarChartIcon />}
                  component={Link}
                  href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/stat-entry`}
                >
                  Statistics
                </Button>
              )}
              {shouldShowAnnouncementsLink && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CampaignIcon />}
                  component={Link}
                  href={announcementsHref!}
                >
                  Announcements
                </Button>
              )}
              {shouldShowInformationMessagesLink && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<InfoOutlinedIcon />}
                  component={Link}
                  href={informationMessagesHref!}
                >
                  Information
                </Button>
              )}
              {shouldShowYouTubeLink && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<YouTubeIcon />}
                  component={Link}
                  href={youtubeHref!}
                >
                  YouTube
                </Button>
              )}
              {shouldShowHandoutsLink && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DescriptionIcon />}
                  component={Link}
                  href={handoutsHref!}
                >
                  Handouts
                </Button>
              )}
              <AccountOptional accountId={accountId} componentId="team.printableRosterCard">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PrintIcon />}
                  component={Link}
                  href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster-card`}
                >
                  Printable Roster Card
                </Button>
              </AccountOptional>
            </Stack>
          </Box>
          {shouldShowClassifiedsLink && (
            <Stack direction="column" spacing={2} useFlexGap sx={{ width: '100%', mt: 3 }}>
              <AccountOptional accountId={accountId} componentId="team.playerClassified.cta">
                <Typography variant="body2" color="text.secondary">
                  Need reinforcements? Easily post a Players Wanted ad to recruit new talent.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PersonSearchIcon />}
                    {...(onPostPlayersWanted
                      ? { onClick: onPostPlayersWanted }
                      : { component: Link, href: playerClassifiedsHref! })}
                  >
                    Post Players Wanted Ad
                  </Button>
                  {playerClassifiedsHref && (
                    <Button
                      variant="text"
                      color="primary"
                      component={Link}
                      href={playerClassifiedsHref}
                    >
                      View Players Wanted
                    </Button>
                  )}
                </Stack>
              </AccountOptional>
              {teamsWantedHref && teamsWantedMessage && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                    Players Looking for Teams
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {teamsWantedMessage},{' '}
                    <MuiLink component={Link} href={teamsWantedHref} sx={{ fontWeight: 600 }}>
                      view them now
                    </MuiLink>
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </>
      )}
    </WidgetShell>
  );
};

export default TeamAdminPanel;
