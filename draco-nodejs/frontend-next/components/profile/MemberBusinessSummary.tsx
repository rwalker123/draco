'use client';

import React from 'react';
import { Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import type { MemberBusinessType } from '@draco/shared-schemas';
import UserAvatar from '@/components/users/UserAvatar';

interface MemberBusinessSummaryProps {
  business: MemberBusinessType;
  compact?: boolean;
}

interface RenderLineOptions {
  isEmail?: boolean;
}

const renderLine = (
  label: string,
  value?: string | null,
  compact?: boolean,
  options?: RenderLineOptions,
) => {
  if (!value) {
    return null;
  }

  const emailHref = options?.isEmail ? `mailto:${encodeURIComponent(value.trim())}` : null;

  return (
    <Typography variant={compact ? 'caption' : 'body2'} color="text.secondary">
      <strong>{label}: </strong>
      {options?.isEmail && emailHref ? (
        <MuiLink href={emailHref} underline="hover">
          {value}
        </MuiLink>
      ) : (
        value
      )}
    </Typography>
  );
};

const MemberBusinessSummary: React.FC<MemberBusinessSummaryProps> = ({
  business,
  compact = false,
}) => {
  const titleVariant = compact ? 'subtitle2' : 'h6';
  const descriptionVariant = compact ? 'body2' : 'body1';
  const ownerNameVariant = compact ? 'body2' : 'body1';
  const avatarSize = compact ? 32 : 40;

  const owner = React.useMemo(
    () => ({
      id: business.contact.id,
      firstName: business.contact.firstName,
      lastName: business.contact.lastName,
      photoUrl: business.contact.photoUrl,
    }),
    [
      business.contact.id,
      business.contact.firstName,
      business.contact.lastName,
      business.contact.photoUrl,
    ],
  );

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <UserAvatar user={owner} size={avatarSize} />
        <Typography variant={ownerNameVariant} fontWeight={600}>
          {business.contact.firstName} {business.contact.lastName}
        </Typography>
      </Stack>

      <Box>
        <Typography variant={titleVariant} sx={{ fontWeight: 600 }}>
          {business.name}
        </Typography>
        {business.description ? (
          <Typography variant={descriptionVariant} color="text.secondary">
            {business.description}
          </Typography>
        ) : null}
      </Box>

      <Stack spacing={0.5}>
        {renderLine('Street Address', business.streetAddress, compact)}
        {renderLine('City / State / ZIP', business.cityStateZip, compact)}
        {renderLine('Email', business.email, compact, { isEmail: true })}
        {renderLine('Phone', business.phone, compact)}
        {renderLine('Fax', business.fax, compact)}
      </Stack>

      {business.website ? (
        <MuiLink
          href={business.website}
          target="_blank"
          rel="noreferrer noopener"
          variant={compact ? 'caption' : 'body2'}
          underline="hover"
        >
          Visit website
        </MuiLink>
      ) : null}
    </Stack>
  );
};

export default MemberBusinessSummary;
