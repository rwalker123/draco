'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Divider,
  Box,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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

  const cardBackground = React.useMemo(
    () =>
      `linear-gradient(135deg,
        ${theme.palette.background.paper} 0%,
        ${alpha(theme.palette.background.paper, 0.94)} 40%,
        ${alpha(theme.palette.background.paper, 0.88)} 100%)`,
    [theme],
  );

  const cardOverlayTexture = React.useMemo(
    () =>
      `radial-gradient(circle at 16% 20%, ${alpha(theme.palette.common.white, 0.8)} 0%, ${alpha(theme.palette.common.white, 0)} 55%),
       radial-gradient(circle at 82% 25%, ${alpha(theme.palette.common.white, 0.65)} 0%, ${alpha(theme.palette.common.white, 0)} 60%),
       radial-gradient(circle at 50% 80%, ${alpha(theme.palette.common.white, 0.55)} 0%, ${alpha(theme.palette.common.white, 0)} 70%)`,
    [theme],
  );

  if (sponsors.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        }
      />
      <Divider />
      <CardContent>
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
                    background: cardBackground,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    boxShadow: `0 3px 10px ${alpha(theme.palette.common.black, 0.08)}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      backgroundImage: cardOverlayTexture,
                      opacity: 0.55,
                    }}
                  />

                  <Box
                    sx={{
                      width: 78,
                      height: 78,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
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
                          <MuiLink
                            variant="body2"
                            color="primary"
                            href={phoneHref}
                            underline="hover"
                          >
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
      </CardContent>
    </Card>
  );
};

export default SponsorCard;
