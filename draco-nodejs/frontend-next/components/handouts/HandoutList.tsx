'use client';

import React from 'react';
import {
  Alert,
  Box,
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
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import type { HandoutType } from '@draco/shared-schemas';
import { sanitizeHandoutContent } from '../../utils/sanitization';

export type HandoutListVariant = 'card' | 'panel';

interface HandoutListProps {
  handouts: HandoutType[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (handout: HandoutType) => void;
  onDelete?: (handout: HandoutType) => void;
  maxItems?: number;
  emptyMessage?: string;
  variant?: HandoutListVariant;
  actionsDisabled?: boolean;
}

const listItemPadding: Record<HandoutListVariant, number> = {
  card: 1,
  panel: 1.5,
};

const HandoutList: React.FC<HandoutListProps> = ({
  handouts,
  loading = false,
  error = null,
  onRetry,
  onEdit,
  onDelete,
  maxItems,
  emptyMessage = 'No handouts available yet.',
  variant = 'panel',
  actionsDisabled = false,
}) => {
  const displayedHandouts = React.useMemo(() => {
    if (typeof maxItems === 'number' && maxItems >= 0) {
      return handouts.slice(0, maxItems);
    }
    return handouts;
  }, [handouts, maxItems]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: maxItems ?? 3 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={56} />
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

  if (displayedHandouts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  const remainingCount = handouts.length - displayedHandouts.length;

  return (
    <Stack spacing={remainingCount > 0 ? 1.5 : 0.5}>
      <List disablePadding sx={{ width: '100%' }}>
        {displayedHandouts.map((handout) => {
          const sanitizedDescription = sanitizeHandoutContent(handout.description ?? '');
          const hasDescription = sanitizedDescription.length > 0;

          return (
            <ListItem
              key={handout.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
                px: listItemPadding[variant],
                py: listItemPadding[variant],
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
                  <DescriptionIcon fontSize="small" />
                </Box>
              </ListItemAvatar>
              <ListItemText
                primary={
                  hasDescription ? (
                    <Box
                      component="div"
                      sx={{
                        fontSize: '1rem',
                        color: 'text.primary',
                        wordBreak: 'break-word',
                        '& p': { margin: '0 0 4px', fontSize: 'inherit' },
                        '& p:last-of-type': { marginBottom: 0 },
                        '& ul, & ol': { margin: '4px 0 0 18px', padding: 0 },
                        '& li': { marginBottom: '4px' },
                        '& strong, & b': { fontWeight: 700 },
                        '& em, & i': { fontStyle: 'italic' },
                        '& h1': { fontSize: '1.25rem', fontWeight: 600, margin: '4px 0' },
                        '& h2': { fontSize: '1.15rem', fontWeight: 600, margin: '4px 0' },
                        '& h3': { fontSize: '1.05rem', fontWeight: 600, margin: '4px 0' },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  ) : (
                    <Typography
                      variant="subtitle1"
                      sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                    >
                      No description provided
                    </Typography>
                  )
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {handout.fileName}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Download">
                    <span>
                      <IconButton
                        component="a"
                        href={handout.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        edge="end"
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {onEdit && (
                    <Tooltip title="Edit">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onEdit(handout)}
                          disabled={actionsDisabled}
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onDelete(handout)}
                          color="error"
                          disabled={actionsDisabled}
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
      {remainingCount > 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="right">
          +{remainingCount} more handout{remainingCount === 1 ? '' : 's'} available
        </Typography>
      )}
    </Stack>
  );
};

export default HandoutList;
