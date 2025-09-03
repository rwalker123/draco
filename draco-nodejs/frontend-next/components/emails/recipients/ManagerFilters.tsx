import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

/**
 * Manager Filters Component
 * Provides search, sorting, and filtering capabilities for managers
 */
export interface ManagerFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: 'name' | 'email' | 'teamCount';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'email' | 'teamCount', sortOrder: 'asc' | 'desc') => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  uniqueLeagues: Array<{ id: string; name: string }>;
  uniqueTeams: Array<{ id: string; name: string }>;
  selectedLeagues: Set<string>;
  selectedTeams: Set<string>;
  onLeagueToggle: (leagueId: string) => void;
  onTeamToggle: (teamId: string) => void;
  isLoading: boolean;
}

const ManagerFilters: React.FC<ManagerFiltersProps> = ({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortOrder,
  onSortChange,
  pageSize,
  onPageSizeChange,
  uniqueLeagues,
  uniqueTeams,
  selectedLeagues,
  selectedTeams,
  onLeagueToggle,
  onTeamToggle,
  isLoading,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  // DRY: Reusable event handler for Select components with string values
  const createSelectHandler = <T extends string>(
    valueExtractor: (value: string) => T,
    callback: (value: T) => void,
  ) => {
    return (event: SelectChangeEvent<T>) => {
      const value = valueExtractor(event.target.value);
      callback(value);
    };
  };

  // Type-safe event handlers using the reusable pattern
  const handleSortByChange = createSelectHandler(
    (value: string) => value as 'name' | 'email' | 'teamCount',
    (newSortBy) => onSortChange(newSortBy, sortOrder),
  );

  const handleSortOrderChange = createSelectHandler(
    (value: string) => value as 'asc' | 'desc',
    (newSortOrder) => onSortChange(sortBy, newSortOrder),
  );

  // Separate handler for numeric values to maintain type safety
  const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
    const newPageSize = Number(event.target.value);
    onPageSizeChange(newPageSize);
  };

  const handleClearSearch = () => {
    onSearchQueryChange('');
  };

  const handleClearFilters = () => {
    // Clear all filters
    onSearchQueryChange('');
    selectedLeagues.forEach((leagueId) => onLeagueToggle(leagueId));
    selectedTeams.forEach((teamId) => onTeamToggle(teamId));
  };

  const hasActiveFilters = searchQuery || selectedLeagues.size > 0 || selectedTeams.size > 0;

  return (
    <Box>
      {/* Basic Filters */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        {/* Search */}
        <Box flex={1}>
          <TextField
            fullWidth
            placeholder="Search managers by name, email, team, or league..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              endAdornment: searchQuery && (
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
            disabled={isLoading}
            size="small"
          />
        </Box>

        {/* Sort By */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} onChange={handleSortByChange} label="Sort By" disabled={isLoading}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="teamCount">Team Count</MenuItem>
          </Select>
        </FormControl>

        {/* Sort Order */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            onChange={handleSortOrderChange}
            label="Order"
            disabled={isLoading}
          >
            <MenuItem value="asc">A-Z</MenuItem>
            <MenuItem value="desc">Z-A</MenuItem>
          </Select>
        </FormControl>

        {/* Page Size */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            label="Page Size"
            disabled={isLoading}
          >
            <MenuItem value="25">25</MenuItem>
            <MenuItem value="50">50</MenuItem>
            <MenuItem value="100">100</MenuItem>
            <MenuItem value="200">200</MenuItem>
          </Select>
        </FormControl>

        {/* Advanced Filters Toggle */}
        <Tooltip title="Advanced Filters">
          <IconButton
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            color={showAdvancedFilters ? 'primary' : 'default'}
          >
            <FilterIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Box mb={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>

            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                size="small"
                onDelete={handleClearSearch}
                color="primary"
                variant="outlined"
              />
            )}

            {Array.from(selectedLeagues).map((leagueId) => {
              const league = uniqueLeagues.find((l) => l.id === leagueId);
              return league ? (
                <Chip
                  key={leagueId}
                  label={`League: ${league.name}`}
                  size="small"
                  onDelete={() => onLeagueToggle(leagueId)}
                  color="primary"
                  variant="outlined"
                />
              ) : null;
            })}

            {Array.from(selectedTeams).map((teamId) => {
              const team = uniqueTeams.find((t) => t.id === teamId);
              return team ? (
                <Chip
                  key={teamId}
                  label={`Team: ${team.name}`}
                  size="small"
                  onDelete={() => onTeamToggle(teamId)}
                  color="secondary"
                  variant="outlined"
                />
              ) : null;
            })}

            <Button size="small" onClick={handleClearFilters} startIcon={<ClearIcon />}>
              Clear All
            </Button>
          </Stack>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Box p={2} bgcolor="grey.50" borderRadius={1} mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by League or Team
          </Typography>

          <Stack spacing={2}>
            {/* League Filter */}
            {uniqueLeagues.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Leagues ({uniqueLeagues.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {uniqueLeagues.map((league) => (
                    <Chip
                      key={league.id}
                      label={league.name}
                      size="small"
                      onClick={() => onLeagueToggle(league.id)}
                      color={selectedLeagues.has(league.id) ? 'primary' : 'default'}
                      variant={selectedLeagues.has(league.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Team Filter */}
            {uniqueTeams.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Teams ({uniqueTeams.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {uniqueTeams.map((team) => (
                    <Chip
                      key={team.id}
                      label={team.name}
                      size="small"
                      onClick={() => onTeamToggle(team.id)}
                      color={selectedTeams.has(team.id) ? 'secondary' : 'default'}
                      variant={selectedTeams.has(team.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {uniqueLeagues.length === 0 && uniqueTeams.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No leagues or teams available for filtering
              </Typography>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ManagerFilters;
