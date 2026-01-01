'use client';

import React, { useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Groups as TeamIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as AssignIcon,
  PersonRemove as UnassignIcon,
} from '@mui/icons-material';
import type {
  GolfTeamType,
  GolfTeamWithRosterType,
  GolfFlightType,
  GolfFlightWithTeamCountType,
} from '@draco/shared-schemas';
import ConfirmationDialog from '../../common/ConfirmationDialog';

type FlightOption = GolfFlightType | GolfFlightWithTeamCountType;

interface GolfTeamListProps {
  teams: GolfTeamType[] | GolfTeamWithRosterType[];
  flights?: FlightOption[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView?: (team: GolfTeamType | GolfTeamWithRosterType) => void;
  onEdit?: (team: GolfTeamType | GolfTeamWithRosterType) => void;
  onDelete?: (team: GolfTeamType | GolfTeamWithRosterType) => void;
  onAssignToFlight?: (team: GolfTeamType | GolfTeamWithRosterType, flightId: string) => void;
  onRemoveFromFlight?: (team: GolfTeamType | GolfTeamWithRosterType) => void;
  emptyMessage?: string;
  actionsDisabled?: boolean;
  showFlightInfo?: boolean;
  showPlayerCount?: boolean;
}

const isTeamWithRoster = (
  team: GolfTeamType | GolfTeamWithRosterType,
): team is GolfTeamWithRosterType => {
  return 'playerCount' in team;
};

const GolfTeamList: React.FC<GolfTeamListProps> = ({
  teams,
  flights = [],
  loading = false,
  error = null,
  onRetry,
  onView,
  onEdit,
  onDelete,
  onAssignToFlight,
  onRemoveFromFlight,
  emptyMessage = 'No teams available.',
  actionsDisabled = false,
  showFlightInfo = true,
  showPlayerCount = true,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<GolfTeamType | GolfTeamWithRosterType | null>(
    null,
  );
  const [flightMenuAnchor, setFlightMenuAnchor] = useState<null | HTMLElement>(null);
  const [teamToAssign, setTeamToAssign] = useState<GolfTeamType | GolfTeamWithRosterType | null>(
    null,
  );

  const handleDeleteClick = useCallback((team: GolfTeamType | GolfTeamWithRosterType) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (teamToDelete && onDelete) {
      onDelete(teamToDelete);
    }
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  }, [teamToDelete, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  }, []);

  const handleAssignClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, team: GolfTeamType | GolfTeamWithRosterType) => {
      setFlightMenuAnchor(event.currentTarget);
      setTeamToAssign(team);
    },
    [],
  );

  const handleFlightMenuClose = useCallback(() => {
    setFlightMenuAnchor(null);
    setTeamToAssign(null);
  }, []);

  const handleFlightSelect = useCallback(
    (flightId: string) => {
      if (teamToAssign && onAssignToFlight) {
        onAssignToFlight(teamToAssign, flightId);
      }
      handleFlightMenuClose();
    },
    [teamToAssign, onAssignToFlight, handleFlightMenuClose],
  );

  const getPlayerCount = useCallback(
    (team: GolfTeamType | GolfTeamWithRosterType): number | null => {
      if (isTeamWithRoster(team)) {
        return team.playerCount;
      }
      return null;
    },
    [],
  );

  const formatTeamSubtitle = useCallback(
    (team: GolfTeamType | GolfTeamWithRosterType): string => {
      const parts: string[] = [];

      if (showFlightInfo && team.flight) {
        parts.push(`Flight: ${team.flight.name}`);
      }

      if (showPlayerCount) {
        const playerCount = getPlayerCount(team);
        if (playerCount !== null) {
          parts.push(`${playerCount} player${playerCount !== 1 ? 's' : ''}`);
        }
      }

      return parts.join(' · ');
    },
    [showFlightInfo, showPlayerCount, getPlayerCount],
  );

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
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

  if (teams.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <>
      <List disablePadding sx={{ width: '100%' }}>
        {teams.map((team) => {
          const subtitle = formatTeamSubtitle(team);
          const hasNoFlight = !team.flight;

          return (
            <ListItem
              key={team.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
                px: 1.5,
                py: 1.5,
                '&:last-of-type': { mb: 0 },
              }}
            >
              <ListItemAvatar>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TeamIcon fontSize="small" />
                </Box>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={500}>
                      {team.name}
                    </Typography>
                    {hasNoFlight && showFlightInfo && (
                      <Chip label="Unassigned" size="small" color="warning" variant="outlined" />
                    )}
                  </Stack>
                }
                primaryTypographyProps={{ component: 'div' }}
                secondary={subtitle || undefined}
                secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {onView && (
                    <Tooltip title="View Team">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onView(team)}
                          disabled={actionsDisabled}
                          color="primary"
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onEdit && (
                    <Tooltip title="Edit Team">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onEdit(team)}
                          disabled={actionsDisabled}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {hasNoFlight && onAssignToFlight && flights.length > 0 && (
                    <Tooltip title="Assign to Flight">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={(e) => handleAssignClick(e, team)}
                          disabled={actionsDisabled}
                          color="success"
                          size="small"
                        >
                          <AssignIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {!hasNoFlight && onRemoveFromFlight && (
                    <Tooltip title="Remove from Flight">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onRemoveFromFlight(team)}
                          disabled={actionsDisabled}
                          color="warning"
                          size="small"
                        >
                          <UnassignIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete Team">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteClick(team)}
                          color="error"
                          disabled={actionsDisabled}
                          size="small"
                        >
                          <DeleteIcon />
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

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        message={`Are you sure you want to delete "${teamToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonColor="error"
      />

      <Menu
        anchorEl={flightMenuAnchor}
        open={Boolean(flightMenuAnchor)}
        onClose={handleFlightMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {flights.map((flight) => (
          <MenuItem key={flight.id} onClick={() => handleFlightSelect(flight.id)}>
            {flight.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default GolfTeamList;
