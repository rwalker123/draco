import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { AccountCircle as CrownIcon } from '@mui/icons-material';
import UserAvatar from '../UserAvatar';
import { BaseContactType } from '@draco/shared-schemas';

interface AccountOwnerDisplayProps {
  accountOwner: BaseContactType | null; // Keep nullable for component safety, but expect it to always have value
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
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Account Owner
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
            textAlign: 'center',
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          {accountOwner.firstName} {accountOwner.lastName}
        </Typography>
        {accountOwner.email && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
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
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.paper : '#FFF8E1',
        borderLeft: (theme) =>
          `4px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.main : '#FFD700'}`,
        mb: 2,
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CrownIcon
          sx={(theme) => ({
            color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#FFD700',
            fontSize: 32,
          })}
        />
        <UserAvatar
          user={{
            id: accountOwner.id,
            firstName: accountOwner.firstName,
            lastName: accountOwner.lastName,
            photoUrl: accountOwner.photoUrl || '',
          }}
          size={40}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Account Owner
          </Typography>
          <Typography variant="body1" color="text.primary">
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
