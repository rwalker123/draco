'use client';

import React from 'react';
import { Paper, Box, Typography, useTheme, type PaperProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type PaperPropsWithoutTitle = Omit<PaperProps, 'title'>;

export type WidgetAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

export interface WidgetShellProps extends PaperPropsWithoutTitle {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  accent?: WidgetAccent | 'none';
  disablePadding?: boolean;
  headerContent?: React.ReactNode;
}

const WidgetShell = React.forwardRef<HTMLDivElement, WidgetShellProps>(
  (
    {
      title,
      subtitle,
      actions,
      accent,
      disablePadding = false,
      headerContent,
      sx,
      children,
      ...paperProps
    },
    ref,
  ) => {
    const theme = useTheme();

    const accentColor = accent && accent !== 'none' ? theme.palette[accent]?.main : undefined;

    const resolvedTitle =
      typeof title === 'string' ? (
        <Typography variant="h6" fontWeight={700} color={theme.palette.widget.headerText}>
          {title}
        </Typography>
      ) : (
        title
      );

    const resolvedSubtitle =
      typeof subtitle === 'string' ? (
        <Typography variant="body2" color={theme.palette.widget.supportingText}>
          {subtitle}
        </Typography>
      ) : (
        subtitle
      );

    const baseSx = {
      position: 'relative',
      p: disablePadding ? 0 : theme.spacing(3),
      borderRadius: 3,
      backgroundColor: theme.palette.widget.surface,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.widget.border}`,
      boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
      overflow: 'hidden',
      '&::before': accentColor
        ? {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            borderTop: `4px solid ${accentColor}`,
            pointerEvents: 'none',
          }
        : {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            borderTop: `4px solid ${theme.palette.widget.border}`,
            pointerEvents: 'none',
          },
    } as const;

    const mergedSx: SxProps<Theme> = Array.isArray(sx)
      ? [baseSx, ...sx]
      : sx
        ? [baseSx, sx]
        : [baseSx];

    return (
      <Paper ref={ref} elevation={0} sx={mergedSx} {...paperProps}>
        {headerContent ? <Box mb={disablePadding ? 0 : 2}>{headerContent}</Box> : null}
        {!headerContent && (resolvedTitle || resolvedSubtitle || actions) ? (
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            gap={2}
            mb={disablePadding ? 0 : 2}
          >
            <Box>
              {resolvedTitle}
              {resolvedSubtitle}
            </Box>
            {actions ? <Box>{actions}</Box> : null}
          </Box>
        ) : null}
        {children}
      </Paper>
    );
  },
);

WidgetShell.displayName = 'WidgetShell';

export default WidgetShell;
