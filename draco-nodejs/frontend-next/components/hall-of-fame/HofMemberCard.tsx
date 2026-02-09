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
import { alpha, useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { HofMemberType } from '@draco/shared-schemas';
import { sanitizeRichContent } from '@/utils/sanitization';
import RichTextContent from '../common/RichTextContent';

export interface HofMemberCardProps {
  member: HofMemberType;
  elevation?: number;
  sx?: SxProps<Theme>;
}

const HofMemberCard: React.FC<HofMemberCardProps> = ({ member, elevation = 1, sx }) => {
  const theme = useTheme();
  const { contact, biographyHtml, yearInducted } = member;
  const sanitized = biographyHtml ? sanitizeRichContent(biographyHtml) : null;
  const sanitizedBio = sanitized && sanitized.length > 0 ? sanitized : null;

  const displayName = contact.displayName ?? `${contact.firstName} ${contact.lastName}`.trim();
  const baseColor = theme.palette.primary.main;
  const avatarShadow = theme.shadows[4];
  const avatarBorderColor = alpha(baseColor, theme.palette.mode === 'dark' ? 0.6 : 0.25);
  const avatarFallbackColor =
    theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.primary.main;

  const baseCardSx: SxProps<Theme> = (themeArg) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    borderRadius: 3,
    border: `1px solid ${themeArg.palette.widget.border}`,
  });

  return (
    <Card elevation={elevation} sx={[baseCardSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={contact.photoUrl ?? undefined}
            alt={displayName}
            sx={{
              width: 72,
              height: 72,
              border: '3px solid',
              borderColor: avatarBorderColor,
              boxShadow: avatarShadow,
              bgcolor: alpha(baseColor, theme.palette.mode === 'dark' ? 0.55 : 0.15),
              color: avatarFallbackColor,
            }}
          >
            {displayName ? displayName.charAt(0) : 'H'}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{ fontWeight: 700, color: 'text.primary' }}
              noWrap
            >
              {displayName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip
                icon={<EmojiEventsIcon fontSize="small" />}
                label={`Class of ${yearInducted}`}
                size="small"
                color="primary"
                sx={{
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: theme.palette.primary.contrastText,
                  },
                }}
              />
            </Stack>
          </Box>
        </Stack>

        {sanitizedBio ? (
          <RichTextContent html={sanitizedBio} sanitize={false} sx={{ mt: 0.5 }} />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default HofMemberCard;
