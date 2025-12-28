'use client';

import React, { useState, useCallback } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOff as InactiveIcon,
  SwapHoriz as SubIcon,
} from '@mui/icons-material';
import type { GolfRosterEntryType } from '@draco/shared-schemas';
import ConfirmationDialog from '../../common/ConfirmationDialog';

interface GolfRosterProps {
  roster: GolfRosterEntryType[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (entry: GolfRosterEntryType) => void;
  onRelease?: (entry: GolfRosterEntryType) => void;
  onDelete?: (entry: GolfRosterEntryType) => void;
  emptyMessage?: string;
  actionsDisabled?: boolean;
  showDifferential?: boolean;
}

const GolfRoster: React.FC<GolfRosterProps> = ({
  roster,
  loading = false,
  error = null,
  onRetry,
  onEdit,
  onRelease,
  onDelete,
  emptyMessage = 'No players on roster.',
  actionsDisabled = false,
  showDifferential = true,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GolfRosterEntryType | null>(null);

  const handleDeleteClick = useCallback((entry: GolfRosterEntryType) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  }, []);

  const handleReleaseClick = useCallback((entry: GolfRosterEntryType) => {
    setSelectedEntry(entry);
    setReleaseDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (selectedEntry && onDelete) {
      onDelete(selectedEntry);
    }
    setDeleteDialogOpen(false);
    setSelectedEntry(null);
  }, [selectedEntry, onDelete]);

  const handleReleaseConfirm = useCallback(() => {
    if (selectedEntry && onRelease) {
      onRelease(selectedEntry);
    }
    setReleaseDialogOpen(false);
    setSelectedEntry(null);
  }, [selectedEntry, onRelease]);

  const handleDialogCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setReleaseDialogOpen(false);
    setSelectedEntry(null);
  }, []);

  const formatPlayerName = useCallback((entry: GolfRosterEntryType): string => {
    const { firstName, lastName, middleName } = entry.player;
    if (middleName) {
      return `${firstName} ${middleName} ${lastName}`;
    }
    return `${firstName} ${lastName}`;
  }, []);

  const getPlayerInitials = useCallback((entry: GolfRosterEntryType): string => {
    const { firstName, lastName } = entry.player;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, []);

  const formatDifferential = useCallback((differential: number | null | undefined): string => {
    if (differential === null || differential === undefined) {
      return 'N/A';
    }
    return differential >= 0 ? `+${differential.toFixed(1)}` : differential.toFixed(1);
  }, []);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
        sx={{ alignItems: 'center' }}
      >
        {error}
      </Alert>
    );
  }

  if (roster.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  const activePlayers = roster.filter((entry) => entry.isActive && !entry.isSub);
  const substitutes = roster.filter((entry) => entry.isSub);
  const inactivePlayers = roster.filter((entry) => !entry.isActive && !entry.isSub);

  const renderPlayerList = (
    players: GolfRosterEntryType[],
    title?: string,
    titleColor?: 'text.primary' | 'text.secondary' | 'warning.main',
  ) => {
    if (players.length === 0) return null;

    return (
      <Box>
        {title && (
          <Typography
            variant="subtitle2"
            color={titleColor || 'text.secondary'}
            sx={{ mb: 1, px: 1 }}
          >
            {title}
          </Typography>
        )}
        <List disablePadding>
          {players.map((entry) => {
            const playerName = formatPlayerName(entry);
            const initials = getPlayerInitials(entry);

            return (
              <ListItem
                key={entry.id}
                sx={{
                  border: '1px solid',
                  borderColor: entry.isActive ? 'divider' : 'action.disabled',
                  borderRadius: 2,
                  mb: 1,
                  px: 1.5,
                  py: 1,
                  opacity: entry.isActive ? 1 : 0.7,
                  '&:last-of-type': { mb: 0 },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={entry.player.photoUrl || undefined}
                    sx={{
                      bgcolor: entry.isSub ? 'secondary.main' : 'primary.main',
                      width: 36,
                      height: 36,
                    }}
                  >
                    {initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1" fontWeight={500}>
                        {playerName}
                      </Typography>
                      {entry.isSub && (
                        <Chip
                          icon={<SubIcon />}
                          label="Sub"
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      )}
                      {!entry.isActive && (
                        <Chip
                          icon={<InactiveIcon />}
                          label="Inactive"
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Stack>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondary={
                    showDifferential
                      ? `Initial Differential: ${formatDifferential(entry.initialDifferential)}`
                      : undefined
                  }
                  secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {onEdit && (
                      <Tooltip title="Edit Player">
                        <span>
                          <IconButton
                            edge="end"
                            onClick={() => onEdit(entry)}
                            disabled={actionsDisabled}
                            color="primary"
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {onRelease && entry.isActive && (
                      <Tooltip title="Release Player">
                        <span>
                          <IconButton
                            edge="end"
                            onClick={() => handleReleaseClick(entry)}
                            disabled={actionsDisabled}
                            color="warning"
                            size="small"
                          >
                            <InactiveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title="Delete Player">
                        <span>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteClick(entry)}
                            color="error"
                            disabled={actionsDisabled}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <>
      <Stack spacing={3}>
        {renderPlayerList(activePlayers, activePlayers.length > 0 ? 'Active Players' : undefined)}
        {renderPlayerList(substitutes, 'Substitutes')}
        {renderPlayerList(inactivePlayers, 'Inactive Players', 'text.secondary')}
      </Stack>

      <ConfirmationDialog
        open={releaseDialogOpen}
        onClose={handleDialogCancel}
        onConfirm={handleReleaseConfirm}
        title="Release Player"
        message={`Are you sure you want to release "${selectedEntry ? formatPlayerName(selectedEntry) : ''}"? They will be marked as inactive.`}
        confirmText="Release"
        confirmButtonColor="warning"
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDialogCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Player"
        message={`Are you sure you want to permanently delete "${selectedEntry ? formatPlayerName(selectedEntry) : ''}" from the roster? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonColor="error"
      />
    </>
  );
};

export default GolfRoster;
