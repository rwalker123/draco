'use client';

import React from 'react';
import { Box, type BoxProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import { sanitizeRichContent } from '../../utils/sanitization';

const baseStyles: SxProps<Theme> = {
  color: 'text.primary',
  fontSize: '1rem',
  lineHeight: 1.6,
  wordBreak: 'break-word',
  '& p': {
    margin: 0,
    marginBottom: 1.5,
  },
  '& p:last-of-type': {
    marginBottom: 0,
  },
  '& ul, & ol, & .editor-list-ul, & .editor-list-ol': {
    paddingLeft: '1.5rem',
    marginTop: 0,
    marginBottom: '1rem',
  },
  '& li, & .editor-listitem': {
    marginBottom: '0.5rem',
  },
  '& strong, & .editor-text-bold': {
    fontWeight: 600,
  },
  '& em, & .editor-text-italic': {
    fontStyle: 'italic',
  },
  '& u, & .editor-text-underline': {
    textDecoration: 'underline',
  },
  '& a, & .editor-link': {
    color: 'primary.main',
    textDecoration: 'underline',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  '& h1, & .editor-heading-h1': {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginTop: '1.5rem',
    marginBottom: '1rem',
  },
  '& h2, & .editor-heading-h2': {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.3,
    marginTop: '1.25rem',
    marginBottom: '0.75rem',
  },
  '& h3, & .editor-heading-h3': {
    fontSize: '1.1rem',
    fontWeight: 600,
    lineHeight: 1.35,
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
  '& h4, & .editor-heading-h4': {
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '0.85rem',
    marginBottom: '0.35rem',
  },
  '& h5, & .editor-heading-h5': {
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '0.75rem',
    marginBottom: '0.25rem',
  },
  '& h6, & .editor-heading-h6': {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginTop: '0.65rem',
    marginBottom: '0.2rem',
  },
  '& h1:first-of-type, & h2:first-of-type, & h3:first-of-type, & h4:first-of-type, & h5:first-of-type, & h6:first-of-type':
    {
      marginTop: 0,
    },
};

const safeRender = (sanitizer: (value: string) => string, html: string): string => {
  try {
    return sanitizer(html);
  } catch {
    return '';
  }
};

export interface RichTextContentProps extends Omit<BoxProps, 'dangerouslySetInnerHTML'> {
  html?: string | null;
  sanitize?: boolean;
  sanitizer?: (value: string) => string;
  emptyFallback?: React.ReactNode;
}

const RichTextContent: React.FC<RichTextContentProps> = ({
  html,
  sanitize = true,
  sanitizer = sanitizeRichContent,
  emptyFallback = null,
  sx,
  ...boxProps
}) => {
  const rendered = !html ? '' : !sanitize ? html : safeRender(sanitizer, html);

  if (!rendered) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  const mergedSx = Array.isArray(sx) ? [baseStyles, ...sx] : sx ? [baseStyles, sx] : [baseStyles];

  return (
    <Box
      {...boxProps}
      sx={mergedSx}
      dangerouslySetInnerHTML={{
        __html: rendered,
      }}
    />
  );
};

export default RichTextContent;
