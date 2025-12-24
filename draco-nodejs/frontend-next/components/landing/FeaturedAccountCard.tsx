'use client';

import { Avatar, Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import type { AccountType } from '@draco/shared-schemas';

interface FeaturedAccountCardProps {
  account: AccountType;
}

export default function FeaturedAccountCard({ account }: FeaturedAccountCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/account/${account.id}/home`);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.widget.surface,
        border: `1px solid ${theme.palette.widget.border}`,
        borderRadius: '12px',
        padding: theme.spacing(3),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Avatar
        src={account.accountLogoUrl ?? undefined}
        alt={account.name}
        sx={{
          width: 80,
          height: 80,
          mb: 2,
          backgroundColor: theme.palette.primary.main,
          fontSize: '2rem',
        }}
      >
        {account.name.charAt(0).toUpperCase()}
      </Avatar>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {account.name}
      </Typography>

      {account.configuration?.affiliation?.name && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {account.configuration.affiliation.name}
        </Typography>
      )}

      {account.configuration?.firstYear && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
          Est. {account.configuration.firstYear}
        </Typography>
      )}

      <Button variant="outlined" size="small" onClick={handleClick}>
        View League
      </Button>
    </Box>
  );
}
