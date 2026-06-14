import React from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import NextLink from 'next/link';
import TeamAvatar from './TeamAvatar';
import WidgetShell from './ui/WidgetShell';
import SubscribeToScheduleButton from './calendar/SubscribeToScheduleButton';
import MyTeamNextGame from './MyTeamNextGame';
import { DEFAULT_TIMEZONE } from '../utils/timezones';

export interface UserTeam {
  id: string;
  name: string;
  leagueName: string;
  divisionName?: string;
  record?: string;
  standing?: number;
  logoUrl?: string;
  teamId?: string;
  seasonId?: string;
}

interface MyTeamsProps {
  userTeams: UserTeam[];
  accountId: string;
  onViewTeam: (teamSeasonId: string) => void;
  sx?: SxProps<Theme>;
  title?: string;
  emptyStateMessage?: string;
  isGolf?: boolean;
  timeZone?: string;
}

const MyTeams: React.FC<MyTeamsProps> = ({
  userTeams,
  accountId,
  onViewTeam,
  sx,
  title,
  emptyStateMessage,
  isGolf = false,
  timeZone = DEFAULT_TIMEZONE,
}) => {
  const hasTeams = Boolean(userTeams && userTeams.length > 0);

  const widgetTitle = (
    <Box display="flex" alignItems="center" gap={1}>
      <StarIcon sx={{ color: 'warning.main' }} />
      <Typography variant="h6" component="h2" fontWeight={600} color="text.primary">
        {title || 'Your Teams'}
      </Typography>
    </Box>
  );

  const widgetSx: SxProps<Theme> = [
    {
      mb: 2,
      display: 'inline-flex',
      flexDirection: 'column',
      alignSelf: 'flex-start',
      width: hasTeams ? 'auto' : '100%',
      maxWidth: '100%',
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <WidgetShell title={widgetTitle} accent="primary" sx={widgetSx}>
      {hasTeams ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'flex-start',
          }}
        >
          {userTeams.map((team) => (
            <WidgetShell
              key={team.teamId || team.id}
              accent="secondary"
              sx={{
                p: { xs: 1.75, sm: 2.25 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                flex: '1 1 320px',
                minWidth: 260,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <TeamAvatar
                  name={team.name}
                  logoUrl={team.logoUrl}
                  size={48}
                  alt={team.name + ' logo'}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    component="h3"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.leagueName}
                  </Typography>
                </Box>
              </Box>
              {team.record && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ position: 'relative', zIndex: 1 }}
                >
                  <strong>Record:</strong> {team.record}
                </Typography>
              )}
              {team.standing && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ position: 'relative', zIndex: 1 }}
                >
                  <strong>Standing:</strong> {team.standing}
                </Typography>
              )}
              {!isGolf && team.seasonId && (
                <MyTeamNextGame
                  accountId={accountId}
                  seasonId={team.seasonId}
                  teamSeasonId={team.id}
                  timeZone={timeZone}
                />
              )}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onViewTeam(team.id)}
                  sx={{
                    alignSelf: 'flex-start',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  View Team
                </Button>
                {!isGolf && team.seasonId && (
                  <Button
                    size="small"
                    component={NextLink}
                    href={`/account/${accountId}/seasons/${team.seasonId}/teams/${team.id}/stat-entry`}
                    startIcon={<BarChartIcon />}
                    sx={{
                      alignSelf: 'flex-start',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Team Statistics
                  </Button>
                )}
                <SubscribeToScheduleButton
                  teamSeasonId={team.id}
                  teamName={team.name}
                  size="small"
                />
              </Box>
            </WidgetShell>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: 120,
            px: 2,
            py: 4,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyStateMessage ??
              'No teams are associated with your profile for this organization yet.'}
          </Typography>
        </Box>
      )}
    </WidgetShell>
  );
};

export default MyTeams;
