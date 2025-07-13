import React, { useState } from 'react';
import { Avatar, Typography } from '@mui/material';
import Image from 'next/image';

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
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: '#1e3a8a',
        fontWeight: 'bold',
        fontSize: size * 0.45,
        color: 'white',
      }}
      alt={alt || name}
    >
      {logoUrl && !imgError ? (
        <Image
          src={logoUrl}
          alt={alt || name}
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: size, height: size }}
          onError={() => setImgError(true)}
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
