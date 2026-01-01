'use client';

import React from 'react';
import {
  Alert,
  Avatar,
  Button,
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
import { SwapHoriz as SubIcon, PersonAdd as SignIcon } from '@mui/icons-material';
import type { GolfSubstituteType } from '@draco/shared-schemas';

interface SubstituteListProps {
  substitutes: GolfSubstituteType[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSignToTeam?: (sub: GolfSubstituteType) => void;
  emptyMessage?: string;
  actionsDisabled?: boolean;
  showDifferential?: boolean;
}

const SubstituteList: React.FC<SubstituteListProps> = ({
  substitutes,
  loading = false,
  error = null,
  onRetry,
  onSignToTeam,
  emptyMessage = 'No substitutes available.',
  actionsDisabled = false,
  showDifferential = true,
}) => {
  const formatPlayerName = (sub: GolfSubstituteType): string => {
    const { firstName, lastName, middleName } = sub.player;
    if (middleName) {
      return `${firstName} ${middleName} ${lastName}`;
    }
    return `${firstName} ${lastName}`;
  };

  const getPlayerInitials = (sub: GolfSubstituteType): string => {
    const { firstName, lastName } = sub.player;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDifferential = (differential: number | null | undefined): string => {
    if (differential === null || differential === undefined) {
      return 'N/A';
    }
    return differential >= 0 ? `+${differential.toFixed(1)}` : differential.toFixed(1);
  };

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 3 }).map((_, index) => (
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

  if (substitutes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List disablePadding sx={{ width: '100%' }}>
      {substitutes.map((sub) => {
        const playerName = formatPlayerName(sub);
        const initials = getPlayerInitials(sub);

        return (
          <ListItem
            key={sub.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 1,
              px: 1.5,
              py: 1,
              '&:last-of-type': { mb: 0 },
            }}
          >
            <ListItemAvatar>
              <Avatar
                src={sub.player.photoUrl || undefined}
                sx={{
                  bgcolor: 'secondary.main',
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
                  <SubIcon fontSize="small" color="secondary" />
                  <Typography variant="body1" fontWeight={500}>
                    {playerName}
                  </Typography>
                </Stack>
              }
              primaryTypographyProps={{ component: 'div' }}
              secondary={
                showDifferential
                  ? `Differential: ${formatDifferential(sub.initialDifferential)}`
                  : undefined
              }
              secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
            <ListItemSecondaryAction>
              {onSignToTeam && (
                <Tooltip title="Sign to Team">
                  <span>
                    <IconButton
                      edge="end"
                      onClick={() => onSignToTeam(sub)}
                      disabled={actionsDisabled}
                      color="primary"
                      size="small"
                    >
                      <SignIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
};

export default SubstituteList;
