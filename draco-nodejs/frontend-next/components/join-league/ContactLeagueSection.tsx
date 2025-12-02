import React from 'react';
import { Avatar, Box, Button, Card, CardContent, Link as MuiLink, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ContactSupport, QuestionAnswer, Facebook, Search } from '@mui/icons-material';
import Link from 'next/link';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { AccountType } from '@draco/shared-schemas';
import AccountOptional from '../account/AccountOptional';
import XLogo from '../icons/XLogo';
import DiscordLogo from '../icons/DiscordLogo';
import BlueskyLogo from '../icons/BlueskyLogo';

const buildFacebookPageUrl = (value?: string | null): string | null => {
  const trimmed = value?.trim().replace(/^@+/, '') ?? '';
  if (!trimmed) {
    return null;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://www.facebook.com/${trimmed}`;
};

const sanitizeHandle = (handle?: string | null): string | null => {
  if (!handle) {
    return null;
  }

  const trimmed = handle.trim().replace(/^@+/, '');
  return trimmed.length ? trimmed : null;
};

const buildTwitterFollowUrl = (handle: string): string =>
  `https://x.com/intent/follow?screen_name=${encodeURIComponent(handle)}`;

const buildBlueskyProfileUrl = (handle: string): string =>
  `https://bsky.app/profile/${encodeURIComponent(handle)}`;

interface ContactLeagueSectionProps {
  account: AccountType;
}

const ContactLeagueSection: React.FC<ContactLeagueSectionProps> = ({ account }) => {
  const twitterHandle = sanitizeHandle(account.socials?.twitterAccountName);
  const blueskyHandle = sanitizeHandle(account.socials?.blueskyHandle);
  const facebookPageUrl = buildFacebookPageUrl(account.socials?.facebookFanPage);
  const facebookConnected = Boolean(facebookPageUrl);
  const playerClassifiedsHref = `/account/${account.id.toString()}/player-classifieds?tab=teams-wanted`;
  const guildId = account.discordIntegration?.guildId ?? null;
  const discordServerUrl = guildId ? `https://discord.com/channels/${guildId}` : null;

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

        <Card
          sx={(theme) => ({
            borderRadius: 2,
            border: `1px solid ${theme.palette.widget.border}`,
          })}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
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
                  startIcon={<XLogo size={20} />}
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

              {blueskyHandle && (
                <Button
                  variant="outlined"
                  href={buildBlueskyProfileUrl(blueskyHandle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<BlueskyLogo size={20} />}
                  fullWidth
                  sx={{
                    py: 1.25,
                    textTransform: 'none',
                  }}
                  color="primary"
                >
                  Follow us on Bluesky
                </Button>
              )}

              {discordServerUrl && (
                <Button
                  variant="outlined"
                  href={discordServerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DiscordLogo size={20} />}
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

              {facebookConnected && facebookPageUrl && (
                <Button
                  variant="outlined"
                  href={facebookPageUrl}
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
          </CardContent>
        </Card>

        <AccountOptional
          accountId={account.id.toString()}
          componentId="home.playerClassified.widget"
        >
          <Card
            sx={(theme) => ({
              mt: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.widget.border}`,
            })}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                '&:last-child': { pb: 2 },
              }}
            >
              <Avatar
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.2 : 0.1,
                  ),
                  color: theme.palette.primary.main,
                })}
              >
                <Search />
              </Avatar>
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
                  <MuiLink
                    component={Link}
                    href={playerClassifiedsHref}
                    underline="always"
                    sx={{ fontWeight: 600 }}
                  >
                    Teams Wanted classifieds
                  </MuiLink>{' '}
                  to get matched with open rosters.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </AccountOptional>
      </Box>
    </SectionCard>
  );
};

export default ContactLeagueSection;
