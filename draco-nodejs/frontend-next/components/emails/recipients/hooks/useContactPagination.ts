'use client';

import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  hasNext: boolean;
  hasPrev: boolean;
  totalContacts: number;
}

export interface UseContactPaginationProps {
  initialRowsPerPage?: number;
  onFetchPage: (page: number, limit: number) => Promise<void>;
  onSearchFetch?: (query: string, page: number, limit: number) => Promise<void>;
}

export interface UseContactPaginationResult {
  currentPage: number;
  rowsPerPage: number;
  serverPaginationState: PaginationState;
  searchCurrentPage: number;
  searchPaginationState: PaginationState;
  hasSearched: boolean;
  lastSearchQuery: string;

  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
  setServerPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>;
  setSearchCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setSearchPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>;
  setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  isInSearchMode: () => boolean;
  paginationState: PaginationState & { currentPage: number; totalPages: number };
  paginationHandlers: {
    handleNextPage: () => void;
    handlePrevPage: () => void;
    handleRowsPerPageChange: (newRowsPerPage: number) => void;
  };
}

export function useContactPagination({
  initialRowsPerPage = 25,
  onFetchPage,
  onSearchFetch,
}: UseContactPaginationProps): UseContactPaginationResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [serverPaginationState, setServerPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });

  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchPaginationState, setSearchPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  const isInSearchMode = useCallback(() => {
    return Boolean(lastSearchQuery?.trim() && hasSearched);
  }, [lastSearchQuery, hasSearched]);

  const paginationState = useMemo(() => {
    if (isInSearchMode()) {
      return {
        hasNext: searchPaginationState.hasNext,
        hasPrev: searchPaginationState.hasPrev,
        totalContacts: searchPaginationState.totalContacts,
        currentPage: searchCurrentPage,
        totalPages: 0,
      };
    }

    return {
      hasNext: serverPaginationState.hasNext,
      hasPrev: serverPaginationState.hasPrev,
      totalContacts: serverPaginationState.totalContacts,
      currentPage: currentPage,
      totalPages: 0,
    };
  }, [
    serverPaginationState,
    searchPaginationState,
    searchCurrentPage,
    currentPage,
    isInSearchMode,
  ]);

  const paginationHandlers = useMemo(
    () => ({
      handleNextPage: () => {
        if (isInSearchMode()) {
          if (searchPaginationState.hasNext && onSearchFetch) {
            void onSearchFetch(lastSearchQuery, searchCurrentPage + 1, rowsPerPage);
          }
        } else {
          if (serverPaginationState.hasNext) {
            void onFetchPage(currentPage + 1, rowsPerPage);
          }
        }
      },
      handlePrevPage: () => {
        if (isInSearchMode()) {
          if (searchPaginationState.hasPrev && searchCurrentPage > 1 && onSearchFetch) {
            void onSearchFetch(lastSearchQuery, searchCurrentPage - 1, rowsPerPage);
          }
        } else {
          if (serverPaginationState.hasPrev && currentPage > 1) {
            void onFetchPage(currentPage - 1, rowsPerPage);
          }
        }
      },
      handleRowsPerPageChange: (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        if (isInSearchMode() && onSearchFetch) {
          void onSearchFetch(lastSearchQuery, 1, newRowsPerPage);
        } else {
          void onFetchPage(1, newRowsPerPage);
        }
      },
    }),
    [
      currentPage,
      rowsPerPage,
      serverPaginationState,
      searchPaginationState,
      searchCurrentPage,
      lastSearchQuery,
      isInSearchMode,
      onFetchPage,
      onSearchFetch,
    ],
  );

  return {
    currentPage,
    rowsPerPage,
    serverPaginationState,
    searchCurrentPage,
    searchPaginationState,
    hasSearched,
    lastSearchQuery,

    setCurrentPage,
    setRowsPerPage,
    setServerPaginationState,
    setSearchCurrentPage,
    setSearchPaginationState,
    setHasSearched,
    setLastSearchQuery,

    isInSearchMode,
    paginationState,
    paginationHandlers,
  };
}
