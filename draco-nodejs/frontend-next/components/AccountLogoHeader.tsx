'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(accountLogoUrl || null);
  const [error, setError] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);

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
            color: 'grey.700',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2.5rem' },
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.05em',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
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
