'use client';

import React, { useMemo } from 'react';
import { Box, Stack, Typography, Alert, CircularProgress, Checkbox, Chip } from '@mui/material';
import { Person as PersonIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { UmpireType } from '@draco/shared-schemas';

export interface UmpiresTabContentProps {
  umpires: UmpireType[];
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const UmpiresTabContent: React.FC<UmpiresTabContentProps> = ({
  umpires,
  selectedIds,
  onToggleAll,
  onToggle,
  loading,
  error,
}) => {
  const umpiresWithEmail = useMemo(
    () => umpires.filter((umpire) => umpire.email?.trim()),
    [umpires],
  );
  const selectableCount = umpiresWithEmail.length;
  const selectedCount = selectedIds.size;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;
  const indeterminate = selectedCount > 0 && selectedCount < selectableCount;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading Umpires...
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
          Select Umpires
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={selectableCount === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GavelIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All Umpires
          </Typography>
          <Chip
            label={`${selectedCount}/${selectableCount} umpires`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
          {umpires.length > selectableCount && (
            <Chip
              label={`${umpires.length - selectableCount} no email`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {umpires.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            No umpires are available.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {umpires.map((umpire) => {
              const hasEmail = Boolean(umpire.email?.trim());
              return (
                <Box
                  key={umpire.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    opacity: hasEmail ? 1 : 0.6,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(umpire.id)}
                    onChange={(event) => onToggle(umpire.id, event.target.checked)}
                    disabled={!hasEmail}
                  />
                  <PersonIcon fontSize="small" color="action" />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {umpire.displayName}
                    </Typography>
                    {hasEmail && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {umpire.email}
                      </Typography>
                    )}
                  </Box>
                  {!hasEmail && (
                    <Chip label="No Email" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default UmpiresTabContent;
