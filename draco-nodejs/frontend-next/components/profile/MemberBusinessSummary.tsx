'use client';

import React from 'react';
import { Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import type { MemberBusinessType } from '@draco/shared-schemas';

interface MemberBusinessSummaryProps {
  business: MemberBusinessType;
  compact?: boolean;
}

const renderLine = (label: string, value?: string | null, compact?: boolean) => {
  if (!value) {
    return null;
  }

  return (
    <Typography variant={compact ? 'caption' : 'body2'} color="text.secondary">
      <strong>{label}: </strong>
      {value}
    </Typography>
  );
};

const MemberBusinessSummary: React.FC<MemberBusinessSummaryProps> = ({
  business,
  compact = false,
}) => {
  const titleVariant = compact ? 'subtitle2' : 'h6';
  const descriptionVariant = compact ? 'body2' : 'body1';

  return (
    <Stack spacing={1.25}>
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
        {renderLine('Email', business.email, compact)}
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
