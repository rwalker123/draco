'use client';

import React from 'react';
import { SxProps, Theme } from '@mui/material';
import WidgetShell, { type WidgetAccent } from '../ui/WidgetShell';

export interface SectionCardProps {
  children: React.ReactNode;
  hover?: boolean;
  sx?: SxProps<Theme>;
  accent?: WidgetAccent | 'none';
  disablePadding?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  children,
  hover = true,
  sx,
  accent = 'none',
  disablePadding,
}) => {
  const extraSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <WidgetShell
      accent={accent}
      disablePadding={disablePadding}
      sx={[
        (theme) => ({
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: hover ? 'transform 0.2s ease, box-shadow 0.2s ease' : undefined,
          ...(hover
            ? {
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 10 : 4],
                },
              }
            : {}),
        }),
        ...extraSx,
      ]}
    >
      {children}
    </WidgetShell>
  );
};

export default SectionCard;
