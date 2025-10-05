import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Collapse, IconButton } from '@mui/material';
import UserAvatar from '../UserAvatar';
import { Groups as ManagerIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { TeamManagerWithTeamsType } from '@draco/shared-schemas';

interface TeamManagersListProps {
  teamManagers: TeamManagerWithTeamsType[];
}

const TeamManagersList: React.FC<TeamManagersListProps> = ({ teamManagers }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (teamManagers.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      sx={{
        backgroundColor: '#E3F2FD', // Light blue background
        borderLeft: '4px solid #1976D2', // Blue left border
        mb: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ManagerIcon sx={{ color: '#1976D2', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0D47A1' }}>
              Team Managers ({teamManagers.length})
            </Typography>
          </Box>
          <IconButton onClick={handleToggle} size="small" sx={{ color: '#1976D2' }}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {teamManagers.map((manager, index) => (
              <Box
                key={`${manager.id}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <UserAvatar
                  user={{
                    id: manager.id,
                    firstName: manager.firstName,
                    lastName: manager.lastName,
                    photoUrl: manager.photoUrl || '',
                  }}
                  size={32}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {manager.firstName} {manager.lastName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.85em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {manager.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {manager.teams.map((team) => (
                      <Chip
                        key={`${manager.id}-${team.teamSeasonId}`}
                        label={team.teamName}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.75rem',
                          height: '20px',
                          borderColor: '#1976D2',
                          color: '#1976D2',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default TeamManagersList;
