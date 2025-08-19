'use client';

// PlayersWantedCard Component
// Displays an individual Players Wanted classified ad

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
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { IPlayersWantedCardProps } from '../../types/playerClassifieds';
import { sanitizeDisplayText } from '../../utils/sanitization';
import { formatDate } from '../../utils/dateUtils';

const PlayersWantedCard: React.FC<IPlayersWantedCardProps> = ({
  classified,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  // Parse positions from comma-separated string and sanitize each position
  const positionsNeeded = classified.positionsNeeded
    .split(',')
    .map((pos) => sanitizeDisplayText(pos.trim()));

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" gutterBottom>
            {sanitizeDisplayText(classified.teamEventName)}
          </Typography>
          <Box display="flex" gap={1}>
            {canEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(classified.id.toString())}
                aria-label="Edit classified"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {canDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(classified.id.toString())}
                aria-label="Delete classified"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" paragraph>
          {sanitizeDisplayText(classified.description)}
        </Typography>

        {/* Positions Needed */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Positions Needed:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {positionsNeeded.map((position: string) => (
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

        {/* Creator Info */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {sanitizeDisplayText(classified.creator.firstName)}{' '}
            {sanitizeDisplayText(classified.creator.lastName)}
          </Typography>
        </Box>

        {/* Date Created */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {formatDate(classified.dateCreated)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" variant="outlined">
          Contact Team
        </Button>
        <Button size="small" variant="text">
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PlayersWantedCard;
