import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Button, SxProps, Theme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
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
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...sx }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#1e3a8a',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <StarIcon sx={{ color: '#fbbf24' }} />
        {title || 'My Teams'}
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
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                borderColor: '#1e3a8a',
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
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.leagueName}
                  </Typography>
                </Box>
              </Box>
              {team.record && (
                <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                  <strong>Record:</strong> {team.record}
                </Typography>
              )}
              {team.standing && (
                <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                  <strong>Standing:</strong> {team.standing}
                </Typography>
              )}
              {team.nextGame && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: '#f9fafb',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
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
                variant="outlined"
                size="small"
                onClick={() => onViewTeam(team.id)}
                sx={{
                  mt: 2,
                  borderColor: '#1e3a8a',
                  color: '#1e3a8a',
                  '&:hover': {
                    bgcolor: '#1e3a8a',
                    color: 'white',
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
