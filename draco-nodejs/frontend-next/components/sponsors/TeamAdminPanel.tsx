'use client';

import React from 'react';
import { Button, Box, Stack, Typography } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import Link from 'next/link';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import PrintIcon from '@mui/icons-material/Print';
import WidgetShell from '../ui/WidgetShell';
import AccountOptional from '../account/AccountOptional';

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
}) => {
  const shouldShowClassifiedsLink =
    showPlayerClassifiedsLink && (!!playerClassifiedsHref || !!onPostPlayersWanted);
  const shouldShowHandoutsLink = Boolean(handoutsHref);
  const shouldShowAnnouncementsLink = canManageAnnouncements && Boolean(announcementsHref);

  return (
    <WidgetShell
      title="Team Admin Tools"
      subtitle="Manage the resources that keep your roster thriving."
      accent="info"
      sx={{
        mb: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {shouldShowClassifiedsLink && (
          <AccountOptional accountId={accountId} componentId="team.playerClassified.cta">
            <Typography variant="body2" color="text.secondary">
              Need reinforcements? Easily post a Players Wanted ad to recruit new talent.
            </Typography>
          </AccountOptional>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {canManageSponsors && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<HandshakeIcon />}
              component={Link}
              href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`}
            >
              Manage Team Sponsors
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
              Manage Announcements
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
              Manage Handouts
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
          {shouldShowClassifiedsLink && (
            <AccountOptional accountId={accountId} componentId="team.playerClassified.cta">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonSearchIcon />}
                {...(onPostPlayersWanted
                  ? { onClick: onPostPlayersWanted }
                  : { component: Link, href: playerClassifiedsHref! })}
              >
                Post Players Wanted Ad
              </Button>
            </AccountOptional>
          )}
        </Stack>
      </Box>
    </WidgetShell>
  );
};

export default TeamAdminPanel;
