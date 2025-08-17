'use client';

// TeamsWantedCard Component
// Displays an individual Teams Wanted classified ad

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
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { ITeamsWantedCardProps } from '../../types/playerClassifieds';

const TeamsWantedCard: React.FC<ITeamsWantedCardProps> = ({ classified, onEdit, onDelete }) => {
  // Parse positions from comma-separated string
  const positionsPlayed = classified.positionsPlayed.split(',').map((pos) => pos.trim());

  // Calculate age from birth date
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
            {classified.name}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              onClick={() => onEdit(classified.id.toString(), 'access-code-required')}
              aria-label="Edit classified"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(classified.id.toString(), 'access-code-required')}
              aria-label="Delete classified"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Experience Level */}
        <Box mb={2}>
          <Chip
            label={classified.experience}
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

        {/* Contact Info */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <EmailIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {classified.email}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {classified.phone}
            </Typography>
          </Box>
        </Box>

        {/* Age and Date Created */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Age: {calculateAge(classified.birthDate)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {formatDate(classified.dateCreated)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" variant="outlined">
          Contact Player
        </Button>
        <Button size="small" variant="text">
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default TeamsWantedCard;
