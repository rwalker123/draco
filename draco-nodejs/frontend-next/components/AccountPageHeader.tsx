'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useAccountHeader } from '../hooks/useAccountHeader';

interface AccountPageHeaderProps {
  accountId: string;
  accountLogoUrl?: string | null;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  background?: string;
  showLogo?: boolean;
  seasonName?: string | null;
  showSeasonInfo?: boolean;
}

const LOGO_HEIGHT = 125;

const AccountPageHeader: React.FC<AccountPageHeaderProps> = ({
  accountId,
  accountLogoUrl,
  children,
  style,
  background,
  showLogo = true,
  seasonName,
  showSeasonInfo = false,
}) => {
  const theme = useTheme();
  const { accountName, logoUrl } = useAccountHeader(accountId, accountLogoUrl);
  const [imageError, setImageError] = useState(false);

  // Use theme colors for default background if none provided
  const defaultBackground = theme.palette.background.paper;
  const headerBackgroundStyles = background
    ? { background }
    : { backgroundColor: defaultBackground };

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  return (
    <Box
      sx={{
        width: '100%',
        ...headerBackgroundStyles,
        color: theme.palette.text.primary,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'visible',
        ...style,
      }}
    >
      {/* Logo/Name Section */}
      {showLogo && (
        <Box
          sx={{
            width: '100%',
            height: { xs: 80, sm: LOGO_HEIGHT },
            minHeight: { xs: 60, sm: LOGO_HEIGHT },
            maxHeight: LOGO_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
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
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2.5rem' },
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '0.05em',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))',
              }}
            >
              {accountName}
            </Typography>
          )}
        </Box>
      )}

      {/* Season info section */}
      {showSeasonInfo && seasonName && (
        <Box sx={{ px: 4, pb: 2, pt: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                opacity: 0.9,
                fontWeight: 500,
                textAlign: 'center',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {seasonName} Season
            </Typography>
          </Box>
        </Box>
      )}

      {/* Page-specific content */}
      {children && (
        <Box
          sx={{
            p: 4,
            pt: showLogo || (showSeasonInfo && seasonName) ? 0 : 4,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
};

export default AccountPageHeader;
