'use client';

import React, { useCallback, memo } from 'react';
import { Box, Paper } from '@mui/material';
import { UserTableSearchProps } from '../../../../types/userTable';

interface SearchableUserTableProps extends UserTableSearchProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  showAdvancedSearch?: boolean;
}

const SearchableUserTable: React.FC<SearchableUserTableProps> = memo(
  ({
    children,
    searchTerm: externalSearchTerm,
    onSearchChange: externalOnSearchChange,
    onSearch: externalOnSearch,
    onClearSearch: externalOnClearSearch,
    searchLoading: externalSearchLoading,
    searchPlaceholder = 'Search users...',
    showAdvancedSearch = false,
  }) => {
    // External search only - no local fallback
    const searchTerm = externalSearchTerm ?? '';
    const searchLoading = externalSearchLoading ?? false;

    const handleSearchChange = useCallback(
      (value: string) => {
        if (externalOnSearchChange) {
          externalOnSearchChange(value);
        }
      },
      [externalOnSearchChange],
    );

    const handleSearch = useCallback(() => {
      if (externalOnSearch) {
        externalOnSearch();
      }
    }, [externalOnSearch]);

    const handleClearSearch = useCallback(() => {
      if (externalOnClearSearch) {
        externalOnClearSearch();
      }
    }, [externalOnClearSearch]);

    return (
      <Paper elevation={1} sx={{ width: '100%' }}>
        <Box sx={{ p: 2 }}>
          {/* Search Controls will be rendered by child components */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                // Pass search props to children
                searchTerm,
                searchLoading,
                searchPlaceholder,
                showAdvancedSearch,
                onSearchChange: handleSearchChange,
                onSearch: handleSearch,
                onClearSearch: handleClearSearch,
              });
            }
            return child;
          })}
        </Box>
      </Paper>
    );
  },
);

SearchableUserTable.displayName = 'SearchableUserTable';

export default SearchableUserTable;
