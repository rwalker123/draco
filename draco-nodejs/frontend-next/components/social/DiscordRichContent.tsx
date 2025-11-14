'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import type { DiscordRichContentNodeType } from '@draco/shared-schemas';

interface DiscordRichContentProps {
  nodes?: DiscordRichContentNodeType[];
  fallback: string;
}

const renderTextSegments = (text: string, keyPrefix: string) => {
  const parts = text.split(/(\n)/);

  return parts
    .map((segment, index) => {
      if (!segment) {
        return null;
      }

      if (segment === '\n') {
        return <br key={`${keyPrefix}-br-${index}`} />;
      }

      return <React.Fragment key={`${keyPrefix}-txt-${index}`}>{segment}</React.Fragment>;
    })
    .filter(Boolean);
};

const renderNode = (node: DiscordRichContentNodeType, index: number) => {
  switch (node.type) {
    case 'text':
      return renderTextSegments(node.text, `text-${index}`);
    case 'emoji':
      return (
        <Box
          key={`emoji-${index}`}
          component="img"
          src={node.url}
          alt={`emoji: ${node.name}`}
          sx={{
            width: 24,
            height: 24,
            verticalAlign: 'middle',
            mr: 0.5,
          }}
        />
      );
    case 'mention': {
      const prefix = node.mentionType === 'channel' ? '#' : '@';
      const label = node.label ?? `${prefix}${node.id}`;

      return (
        <Typography
          key={`mention-${index}`}
          component="span"
          variant="body2"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 0.5,
            py: 0.25,
            mr: 0.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            fontWeight: 600,
          }}
        >
          {label.startsWith('@') || label.startsWith('#') ? label : `${prefix}${label}`}
        </Typography>
      );
    }
    default:
      return [];
  }
};

const DiscordRichContent = ({ nodes, fallback }: DiscordRichContentProps) => {
  if (!nodes || nodes.length === 0) {
    return (
      <Box component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {fallback}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.6,
      }}
    >
      {nodes.flatMap((node, index) => renderNode(node, index))}
    </Box>
  );
};

export default DiscordRichContent;
