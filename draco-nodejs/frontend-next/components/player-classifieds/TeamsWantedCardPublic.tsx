'use client';

// TeamsWantedCardPublic Component
// Displays an individual Teams Wanted classified ad for public viewing (no sensitive data)

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { ITeamsWantedCardPublicProps } from '../../types/playerClassifieds';
import { sanitizeDisplayText } from '../../utils/sanitization';
import { calculateAge } from '../../utils/dateUtils';

const TeamsWantedCardPublic: React.FC<ITeamsWantedCardPublicProps> = ({
  classified,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isAuthenticated,
  isAccountMember,
}) => {
  // Parse positions from comma-separated string and sanitize each position
  const positionsPlayed = (classified.positionsPlayed || '')
    .split(',')
    .map((pos) => sanitizeDisplayText(pos.trim()))
    .filter((pos) => pos.length > 0); // Remove empty positions

  // Get experience color
  const getExperienceColor = (experience: string) => {
    const colors: Record<
      string,
      'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
    > = {
      beginner: 'success',
      intermediate: 'info',
      advanced: 'warning',
      expert: 'error',
    };
    return colors[experience.toLowerCase()] || 'default';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" gutterBottom>
            {sanitizeDisplayText(classified.name)}
          </Typography>
          <Box display="flex" gap={1}>
            {canEdit(classified) && (
              <IconButton
                size="small"
                onClick={() => onEdit(classified.id.toString(), 'access-code-required')}
                aria-label="Edit classified"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {canDelete(classified) && (
              <IconButton
                size="small"
                onClick={() => onDelete(classified.id.toString(), 'access-code-required')}
                aria-label="Delete classified"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Experience Level */}
        <Box mb={2}>
          <Chip
            label={sanitizeDisplayText(classified.experience)}
            size="small"
            color={getExperienceColor(classified.experience)}
            variant="outlined"
          />
        </Box>

        {/* Positions Played */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Positions Played:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {positionsPlayed.map((position: string) => (
              <Chip
                key={position}
                label={position}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Box>

        {/* Contact Info - Show email and phone for authenticated users */}
        {isAuthenticated && (
          <Box mb={2}>
            {/* Email */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {sanitizeDisplayText(classified.email)}
              </Typography>
            </Box>

            {/* Phone - Only show for account members */}
            {isAccountMember && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {sanitizeDisplayText(classified.phone)}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Age */}
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Age: {calculateAge(classified.birthDate)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', px: 2, pb: 2 }}>
        <Button size="small" variant="text">
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default TeamsWantedCardPublic;
