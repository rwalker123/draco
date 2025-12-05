import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  useTheme,
} from '@mui/material';
import UserAvatar from '../UserAvatar';
import {
  Groups as ManagerIcon,
  ExpandMore,
  ExpandLess,
  Email as EmailIcon,
} from '@mui/icons-material';
import { TeamManagerWithTeamsType } from '@draco/shared-schemas';
import { alpha } from '@mui/material/styles';

interface TeamManagersListProps {
  teamManagers: TeamManagerWithTeamsType[];
}

const TeamManagersList: React.FC<TeamManagersListProps> = ({ teamManagers }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();

  if (teamManagers.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      sx={{
        backgroundColor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.12)
            : alpha(theme.palette.primary.light, 0.2),
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        mb: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ManagerIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primary.light
                    : theme.palette.primary.dark,
              }}
            >
              Team Managers ({teamManagers.length})
            </Typography>
          </Box>
          <IconButton
            onClick={handleToggle}
            size="small"
            sx={{ color: theme.palette.primary.main }}
          >
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
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.5)
                      : alpha(theme.palette.common.white, 0.9),
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.85em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {manager.email || 'No email provided'}
                    </Typography>
                    {manager.email && (
                      <IconButton
                        size="small"
                        component="a"
                        href={`mailto:${manager.email}`}
                        aria-label={`Email ${manager.firstName} ${manager.lastName}`}
                        sx={{ color: theme.palette.primary.main, flexShrink: 0 }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
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
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
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
