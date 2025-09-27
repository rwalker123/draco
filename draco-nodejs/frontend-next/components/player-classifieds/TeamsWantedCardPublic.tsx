'use client';

// TeamsWantedCardPublic Component
// Displays an individual Teams Wanted classified ad for public viewing (no sensitive data)

import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, Button } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';
import { ITeamsWantedCardPublicProps } from '../../types/playerClassifieds';
import ContactInfoDialog from './ContactInfoDialog';
import { useAuth } from '../../context/AuthContext';
import { TeamsWantedContactInfoType } from '@draco/shared-schemas';

const TeamsWantedCardPublic: React.FC<ITeamsWantedCardPublicProps> = ({
  classified,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isAuthenticated,
  accessCode,
}) => {
  const { token } = useAuth();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<TeamsWantedContactInfoType | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactInfoClick = async () => {
    setContactDialogOpen(true);
    setContactLoading(true);
    setContactError(null);

    try {
      // Build URL with access code if available
      const url = new URL(
        `/api/accounts/${classified.accountId}/player-classifieds/teams-wanted/${classified.id}/contact`,
        window.location.origin,
      );
      if (accessCode) {
        url.searchParams.set('accessCode', accessCode);
      }

      // Build headers with authorization if token available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.toString(), {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required to view contact information');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this contact information');
        } else if (response.status === 404) {
          throw new Error('Contact information not found');
        } else {
          throw new Error('Failed to fetch contact information');
        }
      }

      const data = await response.json();
      setContactInfo(data);
    } catch (error) {
      setContactError(
        error instanceof Error ? error.message : 'Failed to load contact information',
      );
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactDialogClose = () => {
    setContactDialogOpen(false);
    setContactInfo(null);
    setContactError(null);
  };
  // Parse positions from comma-separated string
  const positionsPlayed = (classified.positionsPlayed || '')
    .split(',')
    .map((pos) => pos.trim())
    .filter((pos) => pos.length > 0); // Remove empty positions

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {classified.name}
            </Typography>
            {/* Age */}
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Age: {classified.age !== null ? classified.age : 'N/A'}
              </Typography>
            </Box>
          </Box>
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
            {classified.experience}
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

        {/* Contact Info - Secure button for authenticated users */}
        {isAuthenticated && (
          <Box mb={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContactPhoneIcon />}
              onClick={handleContactInfoClick}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Contact Info
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Contact Info Dialog */}
      <ContactInfoDialog
        open={contactDialogOpen}
        onClose={handleContactDialogClose}
        contactInfo={contactInfo}
        loading={contactLoading}
        error={contactError}
        playerName={classified.name}
      />
    </Card>
  );
};

export default TeamsWantedCardPublic;
