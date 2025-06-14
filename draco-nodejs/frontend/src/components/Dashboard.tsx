import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  SportsSoccer,
  Group,
  EmojiEvents,
  TrendingUp,
} from '@mui/icons-material';

export const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Draco Sports Manager
      </Typography>
      
      <Typography variant="h6" color="text.secondary" paragraph>
        Manage your sports leagues, teams, and players with ease
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mt: 2,
        '& > *': { flex: '1 1 250px', minWidth: '250px' }
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SportsSoccer color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Leagues</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              5
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active leagues
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Group color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Teams</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              24
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registered teams
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEvents color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Players</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              480
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active players
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Stats</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              1,250
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Games tracked
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" color="primary">
            View Leagues
          </Button>
          <Button variant="outlined" color="primary">
            Manage Teams
          </Button>
          <Button variant="outlined" color="primary">
            Player Stats
          </Button>
          <Button variant="outlined" color="primary">
            Schedule Games
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip label="New" color="success" size="small" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Detroit MSBL Fall League registration opened
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip label="Update" color="info" size="small" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Blue Water MSBL season schedule updated
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip label="Game" color="warning" size="small" sx={{ mr: 1 }} />
              <Typography variant="body1">
                SCS MSBL championship game scheduled
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}; 