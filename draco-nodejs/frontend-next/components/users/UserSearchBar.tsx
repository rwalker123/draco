'use client';

import React from 'react';
import { Paper, Stack, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { UserSearchBarProps } from '../../types/users';

/**
 * UserSearchBar Component
 * Search functionality with debouncing and clear options
 */
const UserSearchBar: React.FC<UserSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  onClear,
  loading,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          onClick={onSearch}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Search
        </Button>
        {searchTerm && (
          <Button variant="text" onClick={onClear}>
            Clear
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default UserSearchBar;
