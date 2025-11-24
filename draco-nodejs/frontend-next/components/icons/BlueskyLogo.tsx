import React from 'react';
import { Box } from '@mui/material';

interface BlueskyLogoProps {
  size?: number;
}

const BlueskyLogo: React.FC<BlueskyLogoProps> = ({ size = 24 }) => {
  return (
    <Box
      component="img"
      src="/branding/bluesky-logo.svg"
      alt="Bluesky logo"
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
      }}
    />
  );
};

export default BlueskyLogo;
