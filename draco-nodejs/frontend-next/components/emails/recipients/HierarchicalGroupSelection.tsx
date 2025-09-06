'use client';

import React, { useEffect } from 'react';
import { Box, Typography, Switch, Stack, CircularProgress, Alert, Paper } from '@mui/material';
import { HierarchicalGroupSelectionProps } from '../../../types/emails/recipients';
import { useHierarchicalData } from '../../../hooks/useHierarchicalData';
import { useHierarchicalMaps } from '../../../hooks/useHierarchicalMaps';
import { useHierarchicalSelection } from '../../../hooks/useHierarchicalSelection';
import HierarchicalTree from './HierarchicalTree';

const HierarchicalGroupSelection: React.FC<HierarchicalGroupSelectionProps> = ({
  accountId,
  seasonId,
  itemSelectedState,
  managersOnly,
  onSelectionChange,
  loading = false,
}) => {
  // Data fetching
  const {
    hierarchicalData,
    loading: dataLoading,
    error: dataError,
    loadHierarchicalData,
  } = useHierarchicalData();

  // Hierarchy mapping
  const hierarchyMaps = useHierarchicalMaps(hierarchicalData, seasonId);

  // Selection logic
  const { handleSelectionChange } = useHierarchicalSelection(
    itemSelectedState,
    hierarchyMaps,
    managersOnly,
    onSelectionChange,
  );

  // Load data when accountId or seasonId changes
  useEffect(() => {
    if (accountId && seasonId) {
      loadHierarchicalData(accountId, seasonId);
    }
  }, [accountId, seasonId]);

  // Handle managers-only toggle
  const handleManagersOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(itemSelectedState, event.target.checked);
  };

  // Render loading state
  if (loading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading team hierarchy...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (dataError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load team hierarchy: {dataError}
      </Alert>
    );
  }

  // Render empty state
  if (!hierarchicalData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No team data available for this season.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" component="h3">
              Select Teams & Players
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Managers Only
              </Typography>
              <Switch checked={managersOnly} onChange={handleManagersOnlyChange} size="small" />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Scrollable Hierarchical Tree */}
      <Paper
        variant="outlined"
        sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <HierarchicalTree
            hierarchicalData={hierarchicalData}
            seasonId={seasonId}
            hierarchyMaps={hierarchyMaps}
            itemSelectedState={itemSelectedState}
            onSelectionChange={handleSelectionChange}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default HierarchicalGroupSelection;
