import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Button, SxProps, Theme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TeamAvatar from './TeamAvatar';

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
}

const MyTeams: React.FC<MyTeamsProps> = ({ userTeams, onViewTeam, sx, title }) => {
  if (!userTeams || userTeams.length === 0) return null;
  return (
    <Paper sx={{ p: 4, mb: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...sx }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <StarIcon sx={{ color: 'warning.main' }} />
        {title || 'Your Teams'}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
        }}
      >
        {userTeams.map((team) => (
          <Card
            key={team.teamId || team.id}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                borderColor: 'primary.main',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TeamAvatar
                  name={team.name}
                  logoUrl={team.logoUrl}
                  size={48}
                  alt={team.name + ' logo'}
                />
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.leagueName}
                  </Typography>
                </Box>
              </Box>
              {team.record && (
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  <strong>Record:</strong> {team.record}
                </Typography>
              )}
              {team.standing && (
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  <strong>Standing:</strong> {team.standing}
                </Typography>
              )}
              {team.nextGame && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
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
                  mt: 2,
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                View Team
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};

export default MyTeams;
