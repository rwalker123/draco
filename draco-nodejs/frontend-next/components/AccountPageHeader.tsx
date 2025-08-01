'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(accountLogoUrl || null);
  const [error, setError] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);

  // Use theme colors for default background if none provided
  const defaultBackground = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
  const headerBackground = background || defaultBackground;

  // Helper to add or update cachebuster param
  function addCacheBuster(url: string, buster: number) {
    if (!url) return url;
    const u = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    u.searchParams.set('k', String(buster));
    return u.toString();
  }

  useEffect(() => {
    // Always fetch account name when accountId is provided
    if (accountId) {
      fetch(`/api/accounts/${accountId}/header`)
        .then((res) => res.json())
        .then((data) => {
          // Set account name
          if (data?.data?.name) {
            setAccountName(data.data.name);
          }

          // Handle logo URL
          if (accountLogoUrl) {
            // Use provided logo URL
            setLogoUrl(addCacheBuster(accountLogoUrl, Date.now()));
          } else if (data?.data?.accountLogoUrl) {
            // Use logo URL from API
            setLogoUrl(addCacheBuster(data.data.accountLogoUrl, Date.now()));
          } else {
            setLogoUrl(null);
          }
        })
        .catch(() => {
          setLogoUrl(null);
          setAccountName(null);
        });
    }
  }, [accountId, accountLogoUrl]);

  return (
    <Box
      sx={{
        width: '100%',
        background: headerBackground,
        color: 'white',
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
          {logoUrl && !error ? (
            <Image
              src={logoUrl}
              alt="Account Logo"
              height={LOGO_HEIGHT}
              width={512}
              style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              onError={() => setError(true)}
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
                background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${theme.palette.grey[100]} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))',
              }}
            >
              {accountName || 'Loading...'}
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
                color: 'common.white',
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
        <Box sx={{ p: 4, pt: showLogo || (showSeasonInfo && seasonName) ? 0 : 4 }}>{children}</Box>
      )}
    </Box>
  );
};

export default AccountPageHeader;
