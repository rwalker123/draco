import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import { SponsorType } from '@draco/shared-schemas';

interface SponsorCardProps {
  sponsors: SponsorType[];
  title?: string;
  emptyMessage?: string;
}

const SponsorCard: React.FC<SponsorCardProps> = ({ sponsors, title = 'Sponsors', emptyMessage }) => {
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
          <Stack spacing={3}>
            {sponsors.map((sponsor) => (
              <Stack key={sponsor.id} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {sponsor.photoUrl && (
                  <Box
                    component="img"
                    src={sponsor.photoUrl}
                    alt={sponsor.name}
                    sx={{
                      width: 160,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      boxShadow: 1,
                      bgcolor: 'grey.50',
                    }}
                  />
                )}
                <Stack spacing={1} flex={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {sponsor.name}
                  </Typography>
                  {sponsor.description && (
                    <Typography variant="body2" color="text.secondary">
                      {sponsor.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {sponsor.streetAddress && <Chip size="small" label={sponsor.streetAddress} />}
                    {sponsor.cityStateZip && <Chip size="small" label={sponsor.cityStateZip} />}
                    {sponsor.email && <Chip size="small" label={sponsor.email} />}
                    {sponsor.phone && <Chip size="small" label={sponsor.phone} />}
                    {sponsor.website && <Chip size="small" label={sponsor.website} />}
                  </Stack>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default SponsorCard;
