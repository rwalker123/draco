import React from 'react';
import {
  Card,
  CardContent,
  Checkbox,
  Typography,
  Box,
  Stack,
  Tooltip,
  Avatar,
} from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { ManagerInfo, LeagueNames, TeamNames } from '../../../types/emails/recipients';
import { getManagerDisplayName } from '../../../utils/managerDataTransformers';

/**
 * Manager Card Component
 * Displays individual manager information with selection capabilities
 */
export interface ManagerCardProps {
  manager: ManagerInfo;
  leagueNames: LeagueNames;
  teamNames: TeamNames;
  isSelected: boolean;
  onToggle: (managerId: string) => void;
  showEmail?: boolean;
  showPhone?: boolean;
  compact?: boolean;
}

const ManagerCard: React.FC<ManagerCardProps> = ({
  manager,
  leagueNames,
  teamNames,
  isSelected,
  onToggle,
  showEmail = true,
  showPhone = true,
  compact = false,
}) => {
  const handleToggle = () => {
    onToggle(manager.id);
  };

  const displayName = getManagerDisplayName(manager, leagueNames, teamNames);

  if (compact) {
    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          borderColor: isSelected ? 'primary.main' : 'divider',
          backgroundColor: isSelected ? 'primary.light' : 'background.paper',
        }}
        onClick={handleToggle}
      >
        <CardContent sx={{ py: 1, px: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Checkbox
              checked={isSelected}
              onChange={handleToggle}
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" noWrap>
                {displayName}
              </Typography>
              {showEmail && manager.email && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {manager.email}
                </Typography>
              )}
            </Box>
            {!manager.hasValidEmail && (
              <Tooltip title="No valid email">
                <EmailIcon color="error" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' },
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected ? 'primary.light' : 'background.paper',
      }}
      onClick={handleToggle}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Manager Avatar */}
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {manager.name.charAt(0).toUpperCase()}
          </Avatar>

          {/* Manager Info */}
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h6" component="h3" noWrap>
                {displayName}
              </Typography>
              {!manager.hasValidEmail && (
                <Tooltip title="No valid email">
                  <EmailIcon color="error" fontSize="small" />
                </Tooltip>
              )}
            </Box>

            {/* Contact Information */}
            <Stack direction="row" spacing={2}>
              {showEmail && manager.email && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {manager.email}
                  </Typography>
                </Box>
              )}

              {showPhone && (manager.phone1 || manager.phone2 || manager.phone3) && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {manager.phone1 || manager.phone2 || manager.phone3}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ManagerCard;
