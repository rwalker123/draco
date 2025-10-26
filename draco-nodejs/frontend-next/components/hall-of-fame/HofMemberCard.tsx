'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { HofMemberType } from '@draco/shared-schemas';
import { sanitizeRichContent } from '@/utils/sanitization';

export interface HofMemberCardProps {
  member: HofMemberType;
  elevation?: number;
  sx?: SxProps<Theme>;
}

const HofMemberCard: React.FC<HofMemberCardProps> = ({ member, elevation = 1, sx }) => {
  const { contact, biographyHtml, yearInducted } = member;
  const sanitizedBio = React.useMemo(() => {
    if (!biographyHtml) {
      return null;
    }

    const sanitized = sanitizeRichContent(biographyHtml);
    return sanitized.length > 0 ? sanitized : null;
  }, [biographyHtml]);

  const displayName = contact.displayName ?? `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <Card
      elevation={elevation}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.0) 80%)',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={contact.photoUrl ?? undefined}
            alt={displayName}
            sx={{
              width: 72,
              height: 72,
              border: '3px solid',
              borderColor: 'warning.light',
              boxShadow: '0 6px 18px rgba(15,23,42,0.25)',
              bgcolor: 'primary.main',
            }}
          >
            {displayName ? displayName.charAt(0) : 'H'}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }} noWrap>
              {displayName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip
                icon={<EmojiEventsIcon fontSize="small" />}
                label={`Class of ${yearInducted}`}
                size="small"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Box>
        </Stack>

        {sanitizedBio ? (
          <Typography
            component="div"
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              '& p': { mb: 1.2, '&:last-of-type': { mb: 0 } },
              '& ul, & ol': {
                pl: 3,
              },
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedBio }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default HofMemberCard;
