import React from 'react';
import { Box, Typography, Button, Stack, Chip, Paper, Divider } from '@mui/material';
import {
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  People as PeopleIcon,
  Business as LeagueIcon,
  SportsSoccer as TeamIcon,
} from '@mui/icons-material';

/**
 * Manager Selection Summary Component
 * Displays selection statistics and provides bulk selection actions
 */
export interface ManagerSelectionSummaryProps {
  totalManagers: number;
  selectedCount: number;
  selectedLeaguesCount: number;
  selectedTeamsCount: number;
  hasSelection: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const ManagerSelectionSummary: React.FC<ManagerSelectionSummaryProps> = ({
  totalManagers,
  selectedCount,
  selectedLeaguesCount,
  selectedTeamsCount,
  hasSelection,
  onSelectAll,
  onDeselectAll,
}) => {
  const selectionPercentage =
    totalManagers > 0 ? Math.round((selectedCount / totalManagers) * 100) : 0;
  const isAllSelected = selectedCount === totalManagers && totalManagers > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Manager Selection
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SelectAllIcon />}
            onClick={onSelectAll}
            disabled={isAllSelected}
          >
            Select All
          </Button>

          {hasSelection && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={onDeselectAll}
              color="error"
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Selection Statistics */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <PeopleIcon color="primary" />
          <Typography variant="body2">
            {selectedCount} of {totalManagers} managers selected
          </Typography>
          {totalManagers > 0 && (
            <Chip
              label={`${selectionPercentage}%`}
              size="small"
              color={selectionPercentage > 50 ? 'success' : 'default'}
              variant="outlined"
            />
          )}
        </Box>
      </Stack>

      {/* Selection Breakdown */}
      {(selectedLeaguesCount > 0 || selectedTeamsCount > 0) && (
        <>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Selection breakdown:
            </Typography>

            {selectedLeaguesCount > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <LeagueIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  {selectedLeaguesCount} league{selectedLeaguesCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {selectedTeamsCount > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <TeamIcon fontSize="small" color="secondary" />
                <Typography variant="body2">
                  {selectedTeamsCount} team{selectedTeamsCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Stack>
        </>
      )}

      {/* Progress Bar */}
      {totalManagers > 0 && (
        <Box mt={2}>
          <Box
            sx={{
              width: '100%',
              height: 4,
              bgcolor: 'grey.200',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${selectionPercentage}%`,
                height: '100%',
                bgcolor: selectionPercentage > 50 ? 'success.main' : 'primary.main',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {totalManagers === 0 && (
        <Box textAlign="center" py={2}>
          <Typography variant="body2" color="text.secondary">
            No managers available for selection
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ManagerSelectionSummary;
