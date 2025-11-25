'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import { OpenInNew, Close, Undo } from '@mui/icons-material';
import { Twitter } from '@mui/icons-material';
import type { SocialFeedItemType } from '@draco/shared-schemas';
import BlueskyLogo from '../icons/BlueskyLogo';
import { formatRelativeTime } from './utils';

interface SocialPostCardProps {
  item: SocialFeedItemType;
  canDelete?: boolean;
  deleting?: boolean;
  confirmDelete?: (item: SocialFeedItemType) => void;
  onRestore?: (id: string) => void;
  restoring?: boolean;
}

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
  switch (source) {
    case 'twitter':
      return <Twitter sx={{ color: '#1DA1F2' }} fontSize="small" />;
    case 'bluesky':
      return <BlueskyLogo size={18} />;
    default:
      return null;
  }
};

export const SocialPostCard: React.FC<SocialPostCardProps> = ({
  item,
  canDelete,
  deleting = false,
  confirmDelete,
  onRestore,
  restoring = false,
}) => {
  const postedLabel = formatRelativeTime(item.postedAt);
  const authorDisplay = item.authorName ?? item.channelName ?? 'Social';
  const handleDisplay = item.authorHandle ?? item.channelName ?? '';
  const initial = authorDisplay.charAt(0).toUpperCase();
  const mediaAttachment = item.media?.[0];
  const mediaUrl = mediaAttachment?.thumbnailUrl ?? mediaAttachment?.url;
  const isDeleted = Boolean(item.deletedAt);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SourceIcon source={item.source} />
          <Typography variant="caption" color="text.secondary">
            {postedLabel}
          </Typography>
          {isDeleted ? (
            <Chip label="Deleted on site" size="small" color="error" variant="outlined" />
          ) : null}
          {item.permalink ? (
            <IconButton
              size="small"
              sx={{ marginLeft: 'auto' }}
              component="a"
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          ) : null}
          {canDelete && confirmDelete && !isDeleted ? (
            <Tooltip title="Delete from local feed">
              <IconButton
                size="small"
                color="error"
                onClick={() => confirmDelete(item)}
                disabled={deleting}
                aria-label="Delete social post"
                sx={{ ml: item.permalink ? 1 : 'auto' }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {canDelete && onRestore && isDeleted ? (
            <Tooltip title="Restore on site">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onRestore(item.id)}
                disabled={restoring}
                aria-label="Restore social post"
                sx={{ ml: item.permalink ? 1 : 'auto' }}
              >
                <Undo fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>{initial}</Avatar>
          <Box>
            <Typography variant="subtitle2">{authorDisplay}</Typography>
            {handleDisplay ? (
              <Typography variant="caption" color="text.secondary">
                {handleDisplay}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Typography variant="body2" color="text.primary">
          {item.content}
        </Typography>
        {mediaUrl ? (
          <Box
            component="img"
            src={mediaUrl}
            alt={authorDisplay}
            sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 1 }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SocialPostCard;
