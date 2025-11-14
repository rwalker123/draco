'use client';

import React from 'react';
import { Card, Box, CardMedia, CardContent, Typography, Button } from '@mui/material';
import { PlayCircleOutline } from '@mui/icons-material';
import type { SocialVideoType } from '@draco/shared-schemas';
import { formatDuration, formatRelativeTime } from './utils';

interface SocialVideoCardProps {
  video: SocialVideoType;
}

export const SocialVideoCard: React.FC<SocialVideoCardProps> = ({ video }) => {
  const publishedLabel = formatRelativeTime(video.publishedAt);
  const durationLabel = video.isLive ? 'LIVE' : formatDuration(video.durationSeconds);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="160"
          image={video.thumbnailUrl}
          alt={video.title}
          sx={{ borderRadius: 1 }}
        />
        {durationLabel && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: video.isLive ? 'error.main' : 'rgba(0,0,0,0.75)',
              color: 'white',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            <Typography variant="caption">{durationLabel}</Typography>
          </Box>
        )}
        <PlayCircleOutline
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 48,
            color: 'white',
            opacity: 0.85,
          }}
        />
      </Box>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">{video.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {video.description ?? 'Watch the latest highlight.'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {publishedLabel}
        </Typography>
        <Button
          variant="contained"
          size="small"
          component="a"
          href={video.videoUrl}
          target="_blank"
          rel="noreferrer"
        >
          Watch
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialVideoCard;
