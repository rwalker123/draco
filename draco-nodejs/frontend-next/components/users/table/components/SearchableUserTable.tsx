'use client';

import React, { useState, useCallback, memo } from 'react';
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
    // Local search state (fallback if external search props not provided)
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [localSearchLoading, setLocalSearchLoading] = useState(false);

    // Use external search props or fall back to local state
    const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
    const searchLoading =
      externalSearchLoading !== undefined ? externalSearchLoading : localSearchLoading;

    const handleSearchChange = useCallback(
      (value: string) => {
        if (externalOnSearchChange) {
          externalOnSearchChange(value);
        } else {
          setLocalSearchTerm(value);
        }
      },
      [externalOnSearchChange],
    );

    const handleSearch = useCallback(() => {
      if (externalOnSearch) {
        externalOnSearch();
      } else {
        // Local search implementation
        setLocalSearchLoading(true);
        // Simulate search delay
        setTimeout(() => {
          setLocalSearchLoading(false);
        }, 500);
      }
    }, [externalOnSearch]);

    const handleClearSearch = useCallback(() => {
      if (externalOnClearSearch) {
        externalOnClearSearch();
      } else {
        setLocalSearchTerm('');
        setLocalSearchLoading(false);
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
