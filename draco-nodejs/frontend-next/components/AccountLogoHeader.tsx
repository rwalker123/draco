'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useAccountHeader } from '../hooks/useAccountHeader';

interface AccountLogoHeaderProps {
  accountId: string;
  accountLogoUrl?: string | null;
  style?: React.CSSProperties;
}

const LOGO_HEIGHT = 125;

const AccountLogoHeader: React.FC<AccountLogoHeaderProps> = ({
  accountId,
  accountLogoUrl,
  style,
}) => {
  const theme = useTheme();
  const { accountName, logoUrl } = useAccountHeader(accountId, accountLogoUrl);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  return (
    <Box
      sx={{
        width: '100%',
        height: { xs: 80, sm: LOGO_HEIGHT },
        minHeight: { xs: 60, sm: LOGO_HEIGHT },
        maxHeight: LOGO_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderBottom: 1,
        borderColor: 'divider',
        ...style,
      }}
    >
      {logoUrl && !imageError ? (
        <Image
          src={logoUrl}
          alt="Account Logo"
          height={LOGO_HEIGHT}
          width={512}
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <Typography
          variant="h3"
          component="div"
          sx={{
            color: 'grey.700',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2.5rem' },
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.05em',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))',
          }}
        >
          {accountName || 'Loading...'}
        </Typography>
      )}
    </Box>
  );
};

export default AccountLogoHeader;
