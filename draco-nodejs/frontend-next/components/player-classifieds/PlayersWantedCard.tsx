'use client';

// PlayersWantedCard Component
// Displays an individual Players Wanted classified ad

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Avatar,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { IPlayersWantedCardProps } from '../../types/playerClassifieds';
import { formatDate } from '../../utils/dateUtils';
import { playerClassifiedService } from '../../services/playerClassifiedService';
import { useParams } from 'next/navigation';
import { useNotifications } from '../../hooks/useNotifications';
import ContactCreatorDialog from './ContactCreatorDialog';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';
import { ContactPlayersWantedCreatorType } from '@draco/shared-schemas';

const PlayersWantedCard: React.FC<IPlayersWantedCardProps> = ({
  classified,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const { accountId } = useParams();
  const { showNotification } = useNotifications();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Parse positions from comma-separated string
  const positionsNeeded = classified.positionsNeeded.split(',').map((pos) => pos.trim());

  const handleContactTeam = () => {
    setContactDialogOpen(true);
  };

  const handleContactSubmit = async (formData: ContactPlayersWantedCreatorType) => {
    setContactLoading(true);
    try {
      await playerClassifiedService.contactPlayersWantedCreator(
        Array.isArray(accountId) ? accountId[0] : accountId || '',
        classified.id.toString(),
        formData,
      );

      showNotification('Message sent successfully!', 'success');
      setContactDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      showNotification(errorMessage, 'error');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with Edit/Delete Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" gutterBottom color="text.primary">
            {classified.teamEventName}
          </Typography>
          <Box display="flex" gap={1}>
            {canEdit(classified) && (
              <EditIconButton
                tooltipTitle="Edit classified"
                aria-label="Edit classified"
                onClick={() => onEdit(classified.id.toString())}
              />
            )}
            {canDelete(classified) && (
              <DeleteIconButton
                tooltipTitle="Delete classified"
                aria-label="Delete classified"
                onClick={() => onDelete(classified.id.toString())}
              />
            )}
          </Box>
        </Box>

        {/* Creator Information */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar src={classified.creator.photoUrl} sx={{ width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {classified.creator.firstName} {classified.creator.lastName}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {classified.description}
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

        {/* Date Created */}
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Posted {formatDate(classified.dateCreated ?? '')}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button variant="contained" startIcon={<EmailIcon />} onClick={handleContactTeam} fullWidth>
          Contact Team
        </Button>
      </CardActions>

      {/* Contact Creator Dialog */}
      <ContactCreatorDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleContactSubmit}
        loading={contactLoading}
        teamEventName={classified.teamEventName}
        creatorName={`${classified.creator.firstName} ${classified.creator.lastName}`}
      />
    </Card>
  );
};

export default PlayersWantedCard;
