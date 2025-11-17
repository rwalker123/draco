import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface XLogoProps {
  size?: number;
}

const XLogo: React.FC<XLogoProps> = ({ size = 24 }) => {
  const theme = useTheme();
  const asset =
    theme.palette.mode === 'dark' ? '/branding/x-logo-dark.svg' : '/branding/x-logo-light.svg';

  return (
    <Box
      component="img"
      src={asset}
      alt="X logo"
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
      }}
    />
  );
};

export default XLogo;
