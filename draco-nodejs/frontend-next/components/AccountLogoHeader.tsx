'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';

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
    if (!accountLogoUrl && accountId) {
      // Fetch public account info to get logo URL
      fetch(`/api/accounts/${accountId}/public`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.account?.accountLogoUrl) {
            setLogoUrl(addCacheBuster(data.data.account.accountLogoUrl, Date.now()));
          } else {
            setLogoUrl(null);
          }
        })
        .catch(() => {
          setLogoUrl(null);
        });
    } else if (accountLogoUrl) {
      setLogoUrl(addCacheBuster(accountLogoUrl, Date.now()));
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
        <Box sx={{ color: 'grey.500', fontWeight: 500, fontSize: { xs: 18, sm: 28 } }}>No Logo</Box>
      )}
    </Box>
  );
};

export default AccountLogoHeader;
