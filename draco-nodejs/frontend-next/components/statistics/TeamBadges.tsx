'use client';

import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';

interface TeamBadgesProps {
  teams?: string[];
  teamName?: string;
  maxVisible?: number;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

export default function TeamBadges({
  teams,
  teamName,
  maxVisible = 3,
  size = 'small',
  variant = 'outlined',
}: TeamBadgesProps) {
  // If we don't have the teams array, fall back to the single teamName
  const teamsList = teams && teams.length > 0 ? teams : [teamName || ''];

  // Filter out any empty strings
  const validTeams = teamsList.filter((team) => team && team.trim() !== '');

  if (validTeams.length === 0) {
    return null;
  }

  // If we have 1 team or teams fit within the limit, show them all
  if (validTeams.length <= maxVisible) {
    return (
      <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
        {validTeams.map((team, index) => (
          <Chip
            key={`${team}-${index}`}
            label={team}
            size={size}
            variant={variant}
            sx={{ fontSize: '0.75rem' }}
          />
        ))}
      </Box>
    );
  }

  // Show first maxVisible-1 teams + "more" indicator with tooltip
  const visibleTeams = validTeams.slice(0, maxVisible - 1);
  const remainingTeams = validTeams.slice(maxVisible - 1);
  const remainingCount = remainingTeams.length;

  return (
    <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
      {visibleTeams.map((team, index) => (
        <Chip
          key={`${team}-${index}`}
          label={team}
          size={size}
          variant={variant}
          sx={{ fontSize: '0.75rem' }}
        />
      ))}
      <Tooltip
        title={
          <Box>
            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>All Teams ({validTeams.length}):</Box>
            {validTeams.map((team, index) => (
              <Box key={`tooltip-${team}-${index}`} sx={{ fontSize: '0.875rem' }}>
                {team}
              </Box>
            ))}
          </Box>
        }
        arrow
      >
        <Chip
          label={`+${remainingCount} more`}
          size={size}
          variant="filled"
          color="primary"
          sx={{
            fontSize: '0.75rem',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        />
      </Tooltip>
    </Box>
  );
}
