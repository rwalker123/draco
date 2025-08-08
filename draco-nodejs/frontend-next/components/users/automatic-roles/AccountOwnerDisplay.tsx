import React from 'react';
import { Box, Typography, Avatar, Card, CardContent } from '@mui/material';
import { AccountCircle as CrownIcon } from '@mui/icons-material';

interface AccountOwnerDisplayProps {
  accountOwner: {
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null; // Keep nullable for component safety, but expect it to always have value
}

const AccountOwnerDisplay: React.FC<AccountOwnerDisplayProps> = ({ accountOwner }) => {
  if (!accountOwner) {
    return null;
  }

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
        <Avatar
          src={accountOwner.photoUrl}
          alt={`${accountOwner.firstName} ${accountOwner.lastName}`}
          sx={{ width: 40, height: 40 }}
        >
          {accountOwner.firstName[0]}
          {accountOwner.lastName[0]}
        </Avatar>
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
