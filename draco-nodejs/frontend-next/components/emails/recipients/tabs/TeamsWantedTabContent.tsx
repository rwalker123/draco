'use client';

import React from 'react';
import { Box, Stack, Typography, Alert, CircularProgress, Checkbox, Chip } from '@mui/material';
import { Person as PersonIcon, Groups as GroupsIcon } from '@mui/icons-material';
import { TeamsWantedPublicClassifiedType } from '@draco/shared-schemas';

export interface TeamsWantedTabContentProps {
  teamsWanted: TeamsWantedPublicClassifiedType[];
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const TeamsWantedTabContent: React.FC<TeamsWantedTabContentProps> = ({
  teamsWanted,
  selectedIds,
  onToggleAll,
  onToggle,
  loading,
  error,
}) => {
  const selectedCount = selectedIds.size;
  const allSelected = teamsWanted.length > 0 && selectedCount === teamsWanted.length;
  const indeterminate = selectedCount > 0 && selectedCount < teamsWanted.length;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading Teams Wanted...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, overflowY: 'auto', height: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h3" color="text.primary">
          Select Teams Wanted Registrants
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={teamsWanted.length === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GroupsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All Teams Wanted
          </Typography>
          <Chip
            label={`${selectedCount}/${teamsWanted.length} players`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>

        {teamsWanted.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            No Teams Wanted classifieds are available.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {teamsWanted.map((classified) => (
              <Box
                key={classified.id}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 2,
                  py: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Checkbox
                  size="small"
                  checked={selectedIds.has(classified.id)}
                  onChange={(event) => onToggle(classified.id, event.target.checked)}
                />
                <PersonIcon fontSize="small" color="action" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {classified.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {classified.positionsPlayed}
                  </Typography>
                </Box>
                {classified.age ? (
                  <Chip
                    label={`Age ${classified.age}`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default TeamsWantedTabContent;
