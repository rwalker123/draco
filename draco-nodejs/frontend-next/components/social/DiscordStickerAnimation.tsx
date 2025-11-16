'use client';

import Lottie from 'lottie-react';
import { Box, Typography } from '@mui/material';
import React from 'react';

interface DiscordStickerAnimationProps {
  json: string;
  size?: number;
}

const DiscordStickerAnimation: React.FC<DiscordStickerAnimationProps> = ({ json, size = 180 }) => {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DiscordStickerAnimation] Failed to parse sticker JSON', { error });
    }
  }

  if (!parsed) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 2,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Unable to load sticker
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: size, height: size }}>
      <Lottie
        animationData={parsed}
        loop
        autoplay
        style={{ width: size, height: size }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
      />
    </Box>
  );
};

export default DiscordStickerAnimation;
