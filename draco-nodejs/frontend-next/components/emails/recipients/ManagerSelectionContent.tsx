import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Alert, AlertTitle, CircularProgress, Divider } from '@mui/material';
import { useManagerState } from '../../../hooks/useManagerState';
import ManagerFilters from './ManagerFilters';
import ManagerList from './ManagerList';
import ManagerSelectionSummary from './ManagerSelectionSummary';

/**
 * Manager Selection Content Component
 * Main component for manager selection with filtering, sorting, and selection
 *
 * Responsibilities:
 * - Render manager selection UI
 * - Handle user interactions
 * - Display loading/error states
 * - Coordinate between child components
 */
export interface ManagerSelectionContentProps {
  accountId: string;
  seasonId: string;
  selectedManagers: Set<string>;
  selectedLeagues: Set<string>;
  selectedTeams: Set<string>;
  onManagerToggle: (managerId: string) => void;
  onLeagueToggle: (leagueId: string) => void;
  onTeamToggle: (teamId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSearchQueryChange: (query: string) => void;
  searchQuery: string;
}

/**
 * Custom hook to handle manager state logic
 * Separates concerns and makes the component more testable
 */
const useManagerSelectionLogic = (accountId: string, seasonId: string, searchQuery: string) => {
  // Track if initial load has been attempted to prevent React strict mode double-invocation
  const initialLoadAttemptedRef = useRef(false);

  const { state: managerState, actions: managerActions } = useManagerState({
    accountId,
    seasonId,
    initialSearchQuery: searchQuery,
    pageSize: 100,
    debounceMs: 300,
  });

  // Reset initial load tracking when account or season changes
  useEffect(() => {
    initialLoadAttemptedRef.current = false;
  }, [accountId, seasonId]);

  // Load managers on mount - only if we have valid IDs and haven't loaded yet
  useEffect(() => {
    const shouldLoad =
      accountId &&
      seasonId &&
      !managerState.managers.length &&
      !managerState.isLoading &&
      !managerState.error &&
      !initialLoadAttemptedRef.current;

    if (shouldLoad) {
      console.log('🔍 ManagerSelectionContent: Initiating initial manager load');
      initialLoadAttemptedRef.current = true;
      managerActions.fetchManagers();
    }
  }, [
    accountId,
    seasonId,
    managerState.managers.length,
    managerState.isLoading,
    managerState.error,
    managerActions,
  ]); // Include managerActions - now safe since actions are stable

  // Sync search query with manager state - only if query actually changed
  useEffect(() => {
    if (searchQuery !== managerState.searchQuery) {
      managerActions.setSearchQuery(searchQuery);
    }
  }, [searchQuery, managerActions, managerState.searchQuery]);

  return { managerState, managerActions };
};

const ManagerSelectionContent: React.FC<ManagerSelectionContentProps> = ({
  accountId,
  seasonId,
  selectedManagers,
  selectedLeagues,
  selectedTeams,
  onManagerToggle,
  onLeagueToggle,
  onTeamToggle,
  onSelectAll,
  onDeselectAll,
  onSearchQueryChange,
  searchQuery,
}) => {
  // Extract manager state logic
  const { managerState, managerActions } = useManagerSelectionLogic(
    accountId,
    seasonId,
    searchQuery,
  );

  // Computed selection summary
  const selectionSummary = useMemo(() => {
    const totalManagers = managerState.managers.length;
    const selectedCount = selectedManagers.size;
    const selectedLeaguesCount = selectedLeagues.size;
    const selectedTeamsCount = selectedTeams.size;

    return {
      totalManagers,
      selectedCount,
      selectedLeaguesCount,
      selectedTeamsCount,
      hasSelection: selectedCount > 0 || selectedLeaguesCount > 0 || selectedTeamsCount > 0,
    };
  }, [
    managerState.managers.length,
    selectedManagers.size,
    selectedLeagues.size,
    selectedTeams.size,
  ]);

  // Handle manager selection toggle
  const handleManagerToggle = (managerId: string) => {
    onManagerToggle(managerId);
  };

  // Handle league selection toggle
  const handleLeagueToggle = (leagueId: string) => {
    onLeagueToggle(leagueId);
  };

  // Handle team selection toggle
  const handleTeamToggle = (teamId: string) => {
    onTeamToggle(teamId);
  };

  // Handle search query change
  const handleSearchQueryChange = (query: string) => {
    onSearchQueryChange(query);
  };

  // Handle sort change
  const handleSortChange = (sortBy: 'name' | 'email' | 'teamCount', sortOrder: 'asc' | 'desc') => {
    managerActions.setSortBy(sortBy);
    managerActions.setSortOrder(sortOrder);
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    managerActions.setPageSize(pageSize);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    managerActions.goToPage(page);
  };

  // Loading state
  if (managerState.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (managerState.error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error Loading Managers</AlertTitle>
        {managerState.error}
      </Alert>
    );
  }

  // Empty state
  if (managerState.managers.length === 0 && !managerState.isSearching) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Managers Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchQuery
            ? 'No managers match your search criteria.'
            : 'No managers are available for this season.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Selection Summary */}
      <ManagerSelectionSummary
        totalManagers={selectionSummary.totalManagers}
        selectedCount={selectionSummary.selectedCount}
        selectedLeaguesCount={selectionSummary.selectedLeaguesCount}
        selectedTeamsCount={selectionSummary.selectedTeamsCount}
        hasSelection={selectionSummary.hasSelection}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />

      <Divider sx={{ my: 2 }} />

      {/* Filters and Controls */}
      <ManagerFilters
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        sortBy={managerState.sortBy}
        sortOrder={managerState.sortOrder}
        onSortChange={handleSortChange}
        pageSize={managerState.pageSize}
        onPageSizeChange={handlePageSizeChange}
        uniqueLeagues={managerState.uniqueLeagues}
        uniqueTeams={managerState.uniqueTeams}
        selectedLeagues={selectedLeagues}
        selectedTeams={selectedTeams}
        onLeagueToggle={handleLeagueToggle}
        onTeamToggle={handleTeamToggle}
        isLoading={managerState.isSearching}
      />

      <Divider sx={{ my: 2 }} />

      {/* Manager List */}
      <ManagerList
        managers={managerState.paginatedManagers}
        leagueNames={managerState.leagueNames}
        teamNames={managerState.teamNames}
        selectedManagers={selectedManagers}
        onManagerToggle={handleManagerToggle}
        totalItems={managerState.sortedManagers.length}
        currentPage={managerState.currentPage}
        totalPages={managerState.totalPages}
        hasNextPage={managerState.hasNextPage}
        hasPrevPage={managerState.hasPrevPage}
        onPageChange={handlePageChange}
        onNextPage={managerActions.goToNextPage}
        onPrevPage={managerActions.goToPrevPage}
      />

      {/* Loading indicator for search */}
      {managerState.isSearching && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ManagerSelectionContent;
