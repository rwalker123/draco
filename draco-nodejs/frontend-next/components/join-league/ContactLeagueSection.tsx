import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ContactSupport, Language, Twitter, Facebook } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { SocialAccount } from '../../types/account';

interface ContactLeagueSectionProps {
  account: SocialAccount;
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
          {account.urls.length > 0 && (
            <Button
              variant="contained"
              href={account.urls[0].url}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Language />}
              fullWidth
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                borderRadius: 2,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              Visit Our Website
            </Button>
          )}

          {account.twitterAccountName && (
            <Button
              variant="outlined"
              href={`https://twitter.com/${account.twitterAccountName?.replace('@', '') || account.twitterAccountName}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Twitter />}
              fullWidth
              sx={{
                py: 1.5,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              Follow on Twitter
            </Button>
          )}

          {account.facebookFanPage && (
            <Button
              variant="outlined"
              href={account.facebookFanPage}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Facebook />}
              fullWidth
              sx={{
                py: 1.5,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.main',
                  color: 'white',
                },
              }}
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
