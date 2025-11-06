'use client';

import { Stack, Typography } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { LeagueFaqPublic } from '../../../../components/league-faq/LeagueFaqPublic';

interface LeagueFaqPublicClientProps {
  accountId: string;
}

const LeagueFaqPublicClient: React.FC<LeagueFaqPublicClientProps> = ({ accountId }) => {
  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
            League FAQs
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              opacity: (theme) => (theme.palette.mode === 'dark' ? 0.85 : 0.65),
            }}
          >
            Answers to common questions about the league.
          </Typography>
        </Stack>
      </AccountPageHeader>

      <LeagueFaqPublic accountId={accountId} />
    </main>
  );
};

export default LeagueFaqPublicClient;
