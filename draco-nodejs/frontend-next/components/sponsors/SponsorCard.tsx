'use client';

import React from 'react';
import { Typography, Stack, Box, Paper, Link as MuiLink } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import WidgetShell from '../ui/WidgetShell';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { SponsorType } from '@draco/shared-schemas';
import { stripPhoneDigits } from '../../utils/phoneNumber';

interface SponsorCardProps {
  sponsors: SponsorType[];
  title?: string;
  emptyMessage?: string;
}

const SponsorCard: React.FC<SponsorCardProps> = ({
  sponsors,
  title = 'Sponsors',
  emptyMessage,
}) => {
  const theme = useTheme();
  const [failedLogos, setFailedLogos] = React.useState<Record<string, boolean>>({});

  const handleImageError = React.useCallback((sponsorId: string) => {
    setFailedLogos((prev) => ({ ...prev, [sponsorId]: true }));
  }, []);

  const tileStyles = React.useMemo(() => {
    const baseColor = theme.palette.primary.main;
    const surface = theme.palette.widget.surface;
    const highlightStart = alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12);
    const highlightMid = alpha(surface, theme.palette.mode === 'dark' ? 0.92 : 0.98);
    const highlightEnd = alpha(surface, theme.palette.mode === 'dark' ? 0.85 : 0.94);
    const overlay = `radial-gradient(circle at 18% 22%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.28 : 0.16)} 0%, ${alpha(baseColor, 0)} 55%),
      radial-gradient(circle at 78% 28%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12)} 0%, ${alpha(baseColor, 0)} 58%),
      radial-gradient(circle at 48% 82%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.18 : 0.1)} 0%, ${alpha(baseColor, 0)} 70%)`;

    return {
      background: `linear-gradient(135deg, ${highlightStart} 0%, ${highlightMid} 42%, ${highlightEnd} 100%)`,
      overlay,
      border: theme.palette.widget.border,
      shadow: theme.shadows[theme.palette.mode === 'dark' ? 10 : 3],
      logoBackdrop: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.06),
    };
  }, [theme]);

  if (sponsors.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <WidgetShell
      title={
        <Typography variant="h6" component="h2" fontWeight={600} color="text.primary">
          {title}
        </Typography>
      }
      accent="primary"
      disablePadding={false}
      sx={{ height: '100%' }}
    >
      {sponsors.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage || 'No sponsors available yet.'}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 2, md: 3 },
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          {sponsors.map((sponsor) => {
            const hasLogo = sponsor.photoUrl && !failedLogos[sponsor.id];
            const phoneDigits = sponsor.phone ? stripPhoneDigits(sponsor.phone) : '';
            const phoneHref = phoneDigits ? `tel:${phoneDigits}` : undefined;
            const emailHref = sponsor.email ? `mailto:${sponsor.email}` : undefined;
            const websiteHref = sponsor.website
              ? sponsor.website.startsWith('http')
                ? sponsor.website
                : `https://${sponsor.website}`
              : undefined;

            return (
              <Paper
                key={sponsor.id}
                variant="outlined"
                sx={{
                  flex: '1 1 300px',
                  maxWidth: 540,
                  minWidth: 240,
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  columnGap: { xs: 1.25, sm: 2 },
                  rowGap: { xs: 1, sm: 1.25 },
                  alignItems: 'start',
                  background: tileStyles.background,
                  border: '1px solid',
                  borderColor: tileStyles.border,
                  boxShadow: tileStyles.shadow,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage: tileStyles.overlay,
                    opacity: theme.palette.mode === 'dark' ? 0.7 : 0.55,
                  }}
                />

                <Box
                  sx={{
                    width: 78,
                    height: 78,
                    borderRadius: 2,
                    bgcolor: tileStyles.logoBackdrop,
                    border: hasLogo ? 'none' : '1px dashed',
                    borderColor: hasLogo ? 'transparent' : theme.palette.divider,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    gridRow: '1 / 2',
                  }}
                >
                  {hasLogo ? (
                    <Box
                      component="img"
                      src={sponsor.photoUrl ?? undefined}
                      alt={sponsor.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => handleImageError(sponsor.id)}
                    />
                  ) : (
                    <BusinessIcon sx={{ color: theme.palette.text.disabled, fontSize: 32 }} />
                  )}
                </Box>

                <Stack spacing={0.75} minWidth={0} sx={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>
                  <Typography variant="subtitle1" component="h3" fontWeight={600} noWrap>
                    {sponsor.name}
                  </Typography>
                  {sponsor.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {sponsor.description}
                    </Typography>
                  )}
                </Stack>

                <Stack spacing={0.5} sx={{ gridColumn: '1 / 3', gridRow: '2 / 3' }}>
                  {(sponsor.streetAddress || sponsor.cityStateZip) && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {[sponsor.streetAddress, sponsor.cityStateZip].filter(Boolean).join(', ')}
                      </Typography>
                    </Stack>
                  )}
                  {sponsor.email && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <MuiLink variant="body2" color="primary" href={emailHref} underline="hover">
                        {sponsor.email}
                      </MuiLink>
                    </Stack>
                  )}
                  {sponsor.phone && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      {phoneHref ? (
                        <MuiLink variant="body2" color="primary" href={phoneHref} underline="hover">
                          {sponsor.phone}
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {sponsor.phone}
                        </Typography>
                      )}
                    </Stack>
                  )}
                  {sponsor.website && websiteHref && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LanguageIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <MuiLink
                        variant="body2"
                        color="primary"
                        href={websiteHref}
                        underline="hover"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {sponsor.website}
                      </MuiLink>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}
    </WidgetShell>
  );
};

export default SponsorCard;
