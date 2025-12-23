'use client';

import { Box, Container, Skeleton, Typography } from '@mui/material';
import { FEATURED_ACCOUNT_IDS } from '@/config/landing';
import { useFeaturedAccounts } from '@/hooks/useFeaturedAccounts';
import FeaturedAccountCard from './FeaturedAccountCard';

export default function CommunityHighlightsSection() {
  const { accounts, loading, error } = useFeaturedAccounts(FEATURED_ACCOUNT_IDS);

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
        >
          Featured Organizations
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={240} />
          ))}
        </Box>
      </Container>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h2" sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}>
        Featured Organizations
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: `repeat(${Math.min(accounts.length, 4)}, 1fr)`,
          },
          gap: 3,
        }}
      >
        {accounts.map((account) => (
          <FeaturedAccountCard key={account.id} account={account} />
        ))}
      </Box>
    </Container>
  );
}
