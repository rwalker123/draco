'use client';

// TeamsWantedCardPublic Component
// Displays an individual Teams Wanted classified ad for public viewing (no sensitive data)

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography, Chip, Box, Button } from '@mui/material';
import {
  Person as PersonIcon,
  ContactPhone as ContactPhoneIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ITeamsWantedCardPublicProps } from '../../types/playerClassifieds';
import ContactInfoDialog from './ContactInfoDialog';
import { useAuth } from '../../context/AuthContext';
import { TeamsWantedContactInfoType } from '@draco/shared-schemas';
import { getTeamsWantedContactInfo } from '@draco/shared-api-client';
import { createApiClient } from '../../lib/apiClientFactory';
import { ApiClientError, unwrapApiResult } from '../../utils/apiResult';
import { formatDate } from '../../utils/dateUtils';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';

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
  const [experienceExpanded, setExperienceExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const experienceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = experienceRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [classified.experience]);

  const handleContactInfoClick = async () => {
    setContactDialogOpen(true);
    setContactLoading(true);
    setContactError(null);

    try {
      const client = createApiClient({ token: token || undefined });
      const result = await getTeamsWantedContactInfo({
        client,
        path: { accountId: classified.accountId, classifiedId: classified.id.toString() },
        query: accessCode ? { accessCode } : undefined,
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to fetch contact information');
      setContactInfo(data as TeamsWantedContactInfoType);
    } catch (error) {
      const status = error instanceof ApiClientError ? error.status : undefined;
      if (status === 401) {
        setContactError('Authentication required to view contact information');
      } else if (status === 403) {
        setContactError('You do not have permission to view this contact information');
      } else if (status === 404) {
        setContactError('Contact information not found');
      } else {
        setContactError(
          error instanceof Error ? error.message : 'Failed to load contact information',
        );
      }
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
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom color="text.primary">
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
              <EditIconButton
                tooltipTitle="Edit classified"
                aria-label="Edit classified"
                onClick={() => onEdit(classified.id.toString(), 'access-code-required')}
              />
            )}
            {canDelete(classified) && (
              <DeleteIconButton
                tooltipTitle="Delete classified"
                aria-label="Delete classified"
                onClick={() => onDelete(classified.id.toString(), 'access-code-required')}
              />
            )}
          </Box>
        </Box>

        {/* Experience Level */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Experience:
          </Typography>
          <Typography
            ref={experienceRef}
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              ...(experienceExpanded
                ? {}
                : {
                    maxHeight: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                  }),
            }}
          >
            {classified.experience}
          </Typography>
          {(isTruncated || experienceExpanded) && (
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setExperienceExpanded(!experienceExpanded)}
            >
              {experienceExpanded ? 'less...' : 'more...'}
            </Typography>
          )}
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

        {/* Date Created */}
        <Box display="flex" alignItems="center" gap={1} mt="auto">
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Posted {formatDate(classified.dateCreated ?? '')}
          </Typography>
        </Box>
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
