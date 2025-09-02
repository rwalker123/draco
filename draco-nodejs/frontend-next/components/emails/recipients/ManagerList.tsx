import React, { useRef } from 'react';
import { Box, Typography, Pagination, Stack, IconButton, Tooltip } from '@mui/material';
import {
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';
import { ManagerInfo, LeagueNames, TeamNames } from '../../../types/emails/recipients';
import ManagerCard from './ManagerCard';

/**
 * Manager List Component
 * Displays a list of managers with pagination and simple scrolling
 */
export interface ManagerListProps {
  managers: ManagerInfo[];
  leagueNames: LeagueNames;
  teamNames: TeamNames;
  selectedManagers: Set<string>;
  onManagerToggle: (managerId: string) => void;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  compact?: boolean;
}

const ManagerList: React.FC<ManagerListProps> = ({
  managers,
  leagueNames,
  teamNames,
  selectedManagers,
  onManagerToggle,
  totalItems,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onNextPage,
  onPrevPage,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowUp' && hasPrevPage) {
      event.preventDefault();
      onPrevPage();
    } else if (event.key === 'ArrowDown' && hasNextPage) {
      event.preventDefault();
      onNextPage();
    }
  };

  // Empty state
  if (managers.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No managers to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* List Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Managers ({totalItems})
        </Typography>
      </Box>

      {/* Manager List Container */}
      <Box
        ref={containerRef}
        sx={{
          height: 'auto',
          maxHeight: 600,
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Manager Items */}
        <Box sx={{ p: 1 }}>
          {managers.map((manager) => (
            <Box key={manager.id} sx={{ mb: 1 }}>
              <ManagerCard
                manager={manager}
                leagueNames={leagueNames}
                teamNames={teamNames}
                isSelected={selectedManagers.has(manager.id)}
                onToggle={onManagerToggle}
                compact={compact}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="First Page">
              <IconButton onClick={() => onPageChange(1)} disabled={currentPage === 1} size="small">
                <FirstPageIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Previous Page">
              <IconButton onClick={onPrevPage} disabled={!hasPrevPage} size="small">
                <UpIcon />
              </IconButton>
            </Tooltip>

            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              size="small"
              showFirstButton={false}
              showLastButton={false}
              siblingCount={1}
              boundaryCount={1}
            />

            <Tooltip title="Next Page">
              <IconButton onClick={onNextPage} disabled={!hasNextPage} size="small">
                <DownIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Last Page">
              <IconButton
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                size="small"
              >
                <LastPageIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* Selection Summary */}
      {selectedManagers.size > 0 && (
        <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
          <Typography variant="body2" color="primary.contrastText">
            {selectedManagers.size} manager{selectedManagers.size !== 1 ? 's' : ''} selected
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ManagerList;
