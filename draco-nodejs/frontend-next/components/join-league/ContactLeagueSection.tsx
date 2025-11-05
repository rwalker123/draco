import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ContactSupport, QuestionAnswer, Twitter, Facebook } from '@mui/icons-material';
import Link from 'next/link';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { AccountType } from '@draco/shared-schemas';

interface ContactLeagueSectionProps {
  account: AccountType;
}

const ContactLeagueSection: React.FC<ContactLeagueSectionProps> = ({ account }) => {
  return (
    <SectionCard>
      <SectionHeader
        icon={<ContactSupport />}
        title="Get Connected"
        description="Reach out and stay updated with our community"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Need help getting started? Have questions about joining? We&apos;re here to help!
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            variant="contained"
            href={`/account/${account.id.toString()}/faq`}
            startIcon={<QuestionAnswer />}
            fullWidth
            sx={{
              py: 1.25,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            View League FAQs
          </Button>

          {account.socials?.twitterAccountName && (
            <Button
              variant="outlined"
              href={`https://twitter.com/${account.socials.twitterAccountName?.replace('@', '') || account.socials.twitterAccountName}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Twitter />}
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
              }}
              color="primary"
            >
              Follow on Twitter
            </Button>
          )}

          {account.socials?.facebookFanPage && (
            <Button
              variant="outlined"
              href={account.socials.facebookFanPage}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Facebook />}
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
              }}
              color="primary"
            >
              Like on Facebook
            </Button>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 'auto', textAlign: 'center' }}
        >
          We typically respond within 24 hours
        </Typography>
      </Box>
    </SectionCard>
  );
};

export default ContactLeagueSection;
