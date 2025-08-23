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
  Email as EmailIcon,
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
}) => {
  // Parse positions from comma-separated string and sanitize each position
  const positionsPlayed = (classified.positionsPlayed || '')
    .split(',')
    .map((pos) => sanitizeDisplayText(pos.trim()))
    .filter((pos) => pos.length > 0); // Remove empty positions

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
          <Typography variant="subtitle2" gutterBottom>
            Experience:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              maxHeight: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {sanitizeDisplayText(classified.experience)}
          </Typography>
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
              <EmailIcon fontSize="small" color="action" />
              <Typography
                variant="caption"
                color="primary"
                component="a"
                href={`mailto:${sanitizeDisplayText(classified.email)}`}
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {sanitizeDisplayText(classified.email)}
              </Typography>
            </Box>

            {/* Phone */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography
                variant="caption"
                color="primary"
                component="a"
                href={`tel:${sanitizeDisplayText(classified.phone)}`}
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {sanitizeDisplayText(classified.phone)}
              </Typography>
            </Box>
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
