import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { AccountCircle as CrownIcon } from '@mui/icons-material';
import UserAvatar from '../UserAvatar';

interface AccountOwnerDisplayProps {
  accountOwner: {
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null; // Keep nullable for component safety, but expect it to always have value
  variant?: 'header' | 'card';
}

const AccountOwnerDisplay: React.FC<AccountOwnerDisplayProps> = ({
  accountOwner,
  variant = 'card',
}) => {
  if (!accountOwner) {
    return null;
  }

  if (variant === 'header') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'common.white',
            opacity: 0.8,
            fontWeight: 400,
            textAlign: 'center',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Account Owner
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'common.white',
            opacity: 0.95,
            fontWeight: 600,
            textAlign: 'center',
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          {accountOwner.firstName} {accountOwner.lastName}
        </Typography>
        {accountOwner.email && (
          <Typography
            variant="body2"
            sx={{
              color: 'common.white',
              opacity: 0.8,
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            {accountOwner.email}
          </Typography>
        )}
      </Box>
    );
  }

  // Default card variant
  return (
    <Card
      sx={{
        backgroundColor: '#FFF8E1', // Light gold background
        borderLeft: '4px solid #FFD700', // Gold left border
        mb: 2,
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CrownIcon sx={{ color: '#FFD700', fontSize: 32 }} />
        <UserAvatar
          user={{
            id: accountOwner.contactId,
            firstName: accountOwner.firstName,
            lastName: accountOwner.lastName,
            photoUrl: accountOwner.photoUrl,
          }}
          size={40}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#E65100' }}>
            Account Owner
          </Typography>
          <Typography variant="body1">
            {accountOwner.firstName} {accountOwner.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {accountOwner.email}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AccountOwnerDisplay;
