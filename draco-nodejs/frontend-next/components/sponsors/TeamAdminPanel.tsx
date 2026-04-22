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
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import WidgetShell from '../ui/WidgetShell';
import AccountOptional from '../account/AccountOptional';
import { useAuth } from '../../context/AuthContext';
import { useAccountSettings } from '../../hooks/useAccountSettings';
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
  emailComposeHref?: string;
  emailHistoryHref?: string;
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
  emailComposeHref,
  emailHistoryHref,
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
  const { settings: accountSettings } = useAccountSettings(accountId);
  const teamEmailSetting = accountSettings?.find(
    (setting) => setting.definition.key === 'EnableTeamEmail',
  );
  const isTeamEmailEnabled =
    (teamEmailSetting?.effectiveValue ?? teamEmailSetting?.value ?? true) === true;
  const shouldShowEmailComposeLink = Boolean(emailComposeHref) && isTeamEmailEnabled;
  const shouldShowEmailHistoryLink = Boolean(emailHistoryHref) && isTeamEmailEnabled;
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

  const operationsButtons: React.ReactNode[] = [];
  if (shouldShowStatEntryLink) {
    operationsButtons.push(
      <Button
        key="statistics"
        variant="contained"
        color="primary"
        startIcon={<BarChartIcon />}
        component={Link}
        href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/stat-entry`}
      >
        Enter Statistics
      </Button>,
    );
  }
  if (shouldShowEmailComposeLink) {
    operationsButtons.push(
      <Button
        key="email-compose"
        variant="contained"
        color="primary"
        startIcon={<EmailIcon />}
        component={Link}
        href={emailComposeHref!}
      >
        Email Team
      </Button>,
    );
  }
  operationsButtons.push(
    <AccountOptional key="roster-card" accountId={accountId} componentId="team.printableRosterCard">
      <Button
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        component={Link}
        href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster-card`}
      >
        Printable Roster Card
      </Button>
    </AccountOptional>,
  );

  const communicationsButtons: React.ReactNode[] = [];
  if (shouldShowAnnouncementsLink) {
    communicationsButtons.push(
      <Button
        key="announcements"
        variant="contained"
        color="primary"
        startIcon={<CampaignIcon />}
        component={Link}
        href={announcementsHref!}
      >
        Announcements
      </Button>,
    );
  }
  if (shouldShowInformationMessagesLink) {
    communicationsButtons.push(
      <Button
        key="information"
        variant="contained"
        color="primary"
        startIcon={<InfoOutlinedIcon />}
        component={Link}
        href={informationMessagesHref!}
      >
        Information
      </Button>,
    );
  }
  if (shouldShowEmailHistoryLink) {
    communicationsButtons.push(
      <Button
        key="email-history"
        variant="contained"
        color="primary"
        startIcon={<HistoryIcon />}
        component={Link}
        href={emailHistoryHref!}
      >
        Email History
      </Button>,
    );
  }

  const contentButtons: React.ReactNode[] = [];
  if (shouldShowYouTubeLink) {
    contentButtons.push(
      <Button
        key="youtube"
        variant="contained"
        color="primary"
        startIcon={<YouTubeIcon />}
        component={Link}
        href={youtubeHref!}
      >
        YouTube
      </Button>,
    );
  }
  if (shouldShowHandoutsLink) {
    contentButtons.push(
      <Button
        key="handouts"
        variant="contained"
        color="primary"
        startIcon={<DescriptionIcon />}
        component={Link}
        href={handoutsHref!}
      >
        Handouts
      </Button>,
    );
  }
  if (canManageSponsors) {
    contentButtons.push(
      <Button
        key="sponsors"
        variant="contained"
        color="primary"
        startIcon={<HandshakeIcon />}
        component={Link}
        href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`}
      >
        Sponsors
      </Button>,
    );
  }

  const buttonGroups = [
    { title: 'Team Operations', buttons: operationsButtons },
    { title: 'Communications', buttons: communicationsButtons },
    { title: 'Content & Resources', buttons: contentButtons },
  ].filter((group) => group.buttons.length > 0);

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
          <Stack spacing={2.5}>
            {buttonGroups.map((group) => (
              <Box key={group.title}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, fontWeight: 600, letterSpacing: 0.8 }}
                >
                  {group.title}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {group.buttons}
                </Stack>
              </Box>
            ))}
          </Stack>
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
