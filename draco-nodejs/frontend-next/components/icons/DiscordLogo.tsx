import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface DiscordLogoProps {
  size?: number;
}

const DiscordLogo: React.FC<DiscordLogoProps> = ({ size = 24 }) => {
  const theme = useTheme();
  const asset =
    theme.palette.mode === 'dark'
      ? '/branding/discord-logo-dark.svg'
      : '/branding/discord-logo-light.svg';

  return (
    <Box
      component="img"
      src={asset}
      alt="Discord logo"
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
      }}
    />
  );
};

export default DiscordLogo;
