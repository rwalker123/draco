import React from 'react';
import { Box, Button, SvgIcon, type SvgIconProps, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ContactSupport, QuestionAnswer, Facebook, Search } from '@mui/icons-material';
import Link from 'next/link';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { AccountType } from '@draco/shared-schemas';
import AccountOptional from '../account/AccountOptional';

const sanitizeTwitterHandle = (handle?: string | null): string | null => {
  if (!handle) {
    return null;
  }

  const trimmed = handle.trim().replace(/^@+/, '');
  return trimmed.length ? trimmed : null;
};

const buildTwitterFollowUrl = (handle: string): string =>
  `https://x.com/intent/follow?screen_name=${encodeURIComponent(handle)}`;

const findDiscordServerUrl = (account: AccountType): string | null => {
  const urls = account.urls ?? [];
  for (const entry of urls) {
    if (!entry.url) {
      continue;
    }

    try {
      const parsed = new URL(entry.url);
      const host = parsed.hostname.toLowerCase();
      if (
        host.includes('discord.com') ||
        host.includes('discord.gg') ||
        host.includes('discordapp.com')
      ) {
        return parsed.toString();
      }
    } catch {
      const normalized = entry.url.toLowerCase();
      if (normalized.includes('discord.com') || normalized.includes('discord.gg')) {
        return entry.url;
      }
    }
  }

  return null;
};

const XLogo = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M18.244 2.25h3.015l-6.57 7.494 7.74 10.006h-6.033l-4.72-6.183-5.4 6.183H2.24l7.04-8.06L1.89 2.25h6.18l4.27 5.574L18.244 2.25zm-1.05 17.17h1.67L7.2 3.685H5.41L17.194 19.42z" />
  </SvgIcon>
);

const DiscordLogo = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M20.317 4.369s-1.885-1.469-4.11-1.637l-.196.392c2.027.497 2.966 1.211 2.966 1.211-2.798-1.54-6.067-1.54-8.819 0 0 0 .94-.714 2.967-1.211l-.197-.392c-2.226.168-4.11 1.637-4.11 1.637s-2.102 3.055-2.49 9.427c0 0 1.178 2.031 4.284 2.135 0 0 .52-.635.94-1.178-1.78-.51-2.45-1.57-2.45-1.57s.154.111.434.265c.016.01.034.018.051.027.04.022.08.043.12.063.35.178.7.328 1.02.446.576.213 1.264.428 2.074.574 1.06.189 2.298.258 3.65.014.663-.116 1.344-.292 2.065-.574.5-.195 1.06-.464 1.655-.845 0 0-.7 1.094-2.53 1.592.42.543.938 1.178.938 1.178 3.106-.104 4.284-2.135 4.284-2.135-.388-6.372-2.49-9.427-2.49-9.427zM9.68 12.982c-.78 0-1.42-.713-1.42-1.591 0-.879.62-1.592 1.42-1.592.79 0 1.43.713 1.42 1.592-.01.878-.63 1.591-1.42 1.591zm4.64 0c-.78 0-1.42-.713-1.42-1.591 0-.879.62-1.592 1.42-1.592.79 0 1.43.713 1.42 1.592-.01.878-.63 1.591-1.42 1.591z" />
  </SvgIcon>
);

interface ContactLeagueSectionProps {
  account: AccountType;
}

const ContactLeagueSection: React.FC<ContactLeagueSectionProps> = ({ account }) => {
  const twitterHandle = sanitizeTwitterHandle(account.socials?.twitterAccountName);
  const discordServerUrl = findDiscordServerUrl(account);
  const playerClassifiedsHref = `/account/${account.id.toString()}/player-classifieds?tab=teams-wanted`;

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

          {twitterHandle && (
            <Button
              variant="outlined"
              href={buildTwitterFollowUrl(twitterHandle)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<XLogo />}
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
              }}
              color="primary"
            >
              Follow us on X
            </Button>
          )}

          {discordServerUrl && (
            <Button
              variant="outlined"
              href={discordServerUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<DiscordLogo />}
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
              }}
              color="primary"
            >
              Join us on Discord
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

        <AccountOptional
          accountId={account.id.toString()}
          componentId="home.playerClassified.widget"
        >
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mt: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.widget.border}`,
              backgroundColor: theme.palette.widget.surface,
            })}
          >
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.2 : 0.1,
                ),
                color: theme.palette.primary.main,
              })}
            >
              <Search />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={(theme) => ({
                  fontWeight: 600,
                  color: theme.palette.widget.headerText,
                })}
              >
                Looking for a team?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect with teams looking for players in our{' '}
                <Link href={playerClassifiedsHref} style={{ fontWeight: 600 }}>
                  Teams Wanted classifieds
                </Link>{' '}
                to get matched with open rosters.
              </Typography>
            </Box>
          </Box>
        </AccountOptional>

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
