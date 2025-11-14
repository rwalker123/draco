'use client';

import React from 'react';
import { Card, Box, CardMedia, CardContent, Typography, Button, IconButton } from '@mui/material';
import { PlayCircleOutline, Close as CloseIcon } from '@mui/icons-material';
import type { SocialVideoType } from '@draco/shared-schemas';
import { formatDuration, formatRelativeTime } from './utils';

interface SocialVideoCardProps {
  video: SocialVideoType;
}

export const SocialVideoCard: React.FC<SocialVideoCardProps> = ({ video }) => {
  const publishedLabel = formatRelativeTime(video.publishedAt);
  const durationLabel = video.isLive ? 'LIVE' : formatDuration(video.durationSeconds);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoId = React.useMemo(() => extractYouTubeId(video.videoUrl), [video.videoUrl]);

  const handleInlinePlay = React.useCallback(() => {
    if (videoId) {
      setIsPlaying(true);
    } else {
      window.open(video.videoUrl, '_blank', 'noreferrer');
    }
  }, [video.videoUrl, videoId]);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{ position: 'relative', cursor: videoId ? 'pointer' : 'default' }}
        onClick={videoId ? handleInlinePlay : undefined}
        role={videoId ? 'button' : undefined}
        aria-label={videoId ? 'Play video inline' : undefined}
      >
        {isPlaying && videoId ? (
          <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 1, overflow: 'hidden' }}>
            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                border: 0,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setIsPlaying(false);
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <>
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
          </>
        )}
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
          Watch on YouTube
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialVideoCard;

const extractYouTubeId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }
    const idFromQuery = parsed.searchParams.get('v');
    if (idFromQuery) {
      return idFromQuery;
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments[0] === 'embed' && segments[1]) {
      return segments[1];
    }
    if (segments[0] === 'shorts' && segments[1]) {
      return segments[1];
    }
  } catch {
    // ignore
  }

  const match = url.match(/(?:v=|be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
};
