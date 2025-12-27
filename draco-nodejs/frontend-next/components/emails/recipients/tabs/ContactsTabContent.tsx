'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Stack, Typography, Alert, Button } from '@mui/material';
import { RecipientContact, GroupType, ContactGroup } from '../../../../types/emails/recipients';
import { EmailRecipientError } from '../../../../types/errors';
import ContactSelectionPanel from '../ContactSelectionPanel';

interface ErrorState {
  contacts: EmailRecipientError | null;
  teamGroups: EmailRecipientError | null;
  roleGroups: EmailRecipientError | null;
  general: EmailRecipientError | null;
}

export interface ContactsTabContentProps {
  errorState: ErrorState;
  isMobile: boolean;
  clearError: (errorType: keyof ErrorState) => void;
  contacts: RecipientContact[];
  selectedGroups: Map<GroupType, ContactGroup[]>;
  unifiedActions: {
    toggleContact: (contactId: string) => void;
    clearAllRecipients: () => void;
    isContactSelected: (contactId: string) => boolean;
    getTotalSelected: () => number;
  };
  isLoading: boolean;
  paginationError: EmailRecipientError | null;
  currentPage: number;
  _rowsPerPage: number;
  paginationState: {
    hasNext: boolean;
    hasPrev: boolean;
    totalContacts: number;
    totalPages: number;
  };
  paginationHandlers: {
    handleNextPage: () => void;
    handlePrevPage: () => void;
    handleRowsPerPageChange: (newRowsPerPage: number) => void;
  };
  accountId: string;
  searchContacts: RecipientContact[];
  setSearchContacts: (contacts: RecipientContact[]) => void;
  onSearch?: (query: string) => Promise<void>;
}

const ContactsTabContent: React.FC<ContactsTabContentProps> = ({
  errorState,
  isMobile,
  clearError,
  contacts,
  selectedGroups,
  unifiedActions,
  isLoading,
  paginationError,
  currentPage,
  _rowsPerPage,
  paginationState,
  paginationHandlers,
  accountId: _accountId,
  searchContacts,
  setSearchContacts,
  onSearch,
}) => {
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setSearchContacts([]);
        setSearchError(null);
        return;
      }

      if (!onSearch) {
        return;
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearch(trimmedQuery).catch((error) => {
          console.error('Search failed:', error);
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        });
      }, 300);
    },
    [onSearch, setSearchContacts],
  );

  const handleClearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearchContacts([]);
    setSearchError(null);
    setSearchQuery('');
  }, [setSearchContacts]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      triggerSearch(query);
    },
    [triggerSearch],
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const displayContacts = useMemo(() => {
    if (searchQuery?.trim() && searchContacts.length > 0) {
      return searchContacts;
    }
    return contacts;
  }, [searchQuery, searchContacts, contacts]);

  const hasSearchResults = Boolean(searchQuery?.trim() && searchContacts.length > 0);

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {errorState.contacts && (
        <Box sx={{ p: 2 }}>
          <Alert severity="warning" onClose={() => clearError('contacts')}>
            {errorState.contacts.userMessage || errorState.contacts.message}
          </Alert>
        </Box>
      )}

      {paginationError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => {}}>
            Pagination Error: {paginationError.userMessage || paginationError.message}
          </Alert>
        </Box>
      )}

      {searchError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => setSearchError(null)}>
            Search Error: {searchError}
          </Alert>
        </Box>
      )}

      <ContactSelectionPanel
        contacts={displayContacts}
        selectedContactIds={selectedGroups.get('individuals')?.[0]?.ids || new Set()}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onContactToggle={unifiedActions.toggleContact}
        onSelectAll={() => {
          /* TODO: Handle select all */
        }}
        onClearAll={unifiedActions.clearAllRecipients}
        currentPage={currentPage}
        hasNext={paginationState.hasNext}
        hasPrev={paginationState.hasPrev}
        loading={isLoading}
        onNextPage={paginationHandlers.handleNextPage}
        onPrevPage={paginationHandlers.handlePrevPage}
        onRowsPerPageChange={paginationHandlers.handleRowsPerPageChange}
        rowsPerPage={_rowsPerPage}
        error={searchError}
        compact={isMobile}
        searchResultsMessage={
          hasSearchResults ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Showing search results for &ldquo;{searchQuery}&rdquo;
              </Typography>
              <Button size="small" onClick={handleClearSearch} variant="outlined">
                Clear Search
              </Button>
            </Stack>
          ) : undefined
        }
      />
    </Box>
  );
};

export default ContactsTabContent;
