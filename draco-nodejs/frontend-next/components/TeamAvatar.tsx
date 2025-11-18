import React, { useMemo, useState } from 'react';
import { Avatar, Typography } from '@mui/material';
import Image from 'next/image';
import { addCacheBuster } from '../config/teams';

interface TeamAvatarProps {
  name: string;
  logoUrl?: string;
  size?: number;
  alt?: string;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const TeamAvatar: React.FC<TeamAvatarProps> = ({ name, logoUrl, size = 48, alt }) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const initials = getInitials(name);
  // Cache-bust once per logo change to avoid endless reload attempts
  const cacheBustedLogoUrl = useMemo(() => {
    if (!logoUrl) {
      return undefined;
    }
    return addCacheBuster(logoUrl) ?? undefined;
  }, [logoUrl]);
  const imageError = failedLogo === cacheBustedLogoUrl;

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        fontWeight: 'bold',
        fontSize: size * 0.45,
        color: 'white',
      }}
      alt={alt || name}
    >
      {cacheBustedLogoUrl && !imageError ? (
        <Image
          src={cacheBustedLogoUrl as string}
          alt={alt || name}
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: size, height: size }}
          onError={() => setFailedLogo(cacheBustedLogoUrl ?? null)}
        />
      ) : (
        <Typography component="span" sx={{ fontWeight: 'bold', fontSize: size * 0.45 }}>
          {initials}
        </Typography>
      )}
    </Avatar>
  );
};

export default TeamAvatar;
