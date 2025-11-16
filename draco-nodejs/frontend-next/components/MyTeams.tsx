import React from 'react';
import { Box, Typography, Paper, Button, SxProps, Theme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TeamAvatar from './TeamAvatar';
import WidgetShell from './ui/WidgetShell';
import { alpha, useTheme } from '@mui/material/styles';

export interface UserTeam {
  id: string;
  name: string;
  leagueName: string;
  divisionName?: string;
  record?: string;
  standing?: number;
  nextGame?: {
    date: string;
    opponent: string;
    location: string;
  };
  logoUrl?: string;
  teamId?: string;
}

interface MyTeamsProps {
  userTeams: UserTeam[];
  onViewTeam: (teamSeasonId: string) => void;
  sx?: SxProps<Theme>;
  title?: string;
  emptyStateMessage?: string;
}

const MyTeams: React.FC<MyTeamsProps> = ({
  userTeams,
  onViewTeam,
  sx,
  title,
  emptyStateMessage,
}) => {
  const theme = useTheme();
  const hasTeams = Boolean(userTeams && userTeams.length > 0);

  const tileStyles = React.useMemo(() => {
    const baseColor = theme.palette.primary.main;
    const surface = theme.palette.widget.surface;
    const highlightStart = alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12);
    const highlightMid = alpha(surface, theme.palette.mode === 'dark' ? 0.92 : 0.98);
    const highlightEnd = alpha(surface, theme.palette.mode === 'dark' ? 0.85 : 0.94);
    const overlay = `radial-gradient(circle at 18% 22%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.28 : 0.16)} 0%, ${alpha(baseColor, 0)} 55%),
      radial-gradient(circle at 78% 28%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12)} 0%, ${alpha(baseColor, 0)} 58%),
      radial-gradient(circle at 48% 82%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.18 : 0.1)} 0%, ${alpha(baseColor, 0)} 70%)`;

    return {
      background: `linear-gradient(135deg, ${highlightStart} 0%, ${highlightMid} 42%, ${highlightEnd} 100%)`,
      overlay,
      border: theme.palette.widget.border,
      shadow: theme.shadows[theme.palette.mode === 'dark' ? 10 : 3],
      detailBackdrop: alpha(
        theme.palette.text.primary,
        theme.palette.mode === 'dark' ? 0.18 : 0.06,
      ),
    };
  }, [theme]);

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
            <Paper
              key={team.teamId || team.id}
              variant="outlined"
              sx={{
                position: 'relative',
                borderRadius: 2,
                p: { xs: 1.75, sm: 2.25 },
                border: '1px solid',
                borderColor: tileStyles.border,
                boxShadow: tileStyles.shadow,
                background: tileStyles.background,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                flex: '1 1 320px',
                minWidth: 260,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage: tileStyles.overlay,
                  opacity: theme.palette.mode === 'dark' ? 0.7 : 0.55,
                }}
              />
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
              {team.nextGame && (
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    mt: 0.5,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: tileStyles.border,
                    bgcolor: tileStyles.detailBackdrop,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, mb: 0.75, color: 'primary.main' }}
                  >
                    Next Game
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs {team.nextGame.opponent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(team.nextGame.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.nextGame.location}
                  </Typography>
                </Box>
              )}
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => onViewTeam(team.id)}
                sx={{
                  position: 'relative',
                  zIndex: 1,
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
            </Paper>
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
