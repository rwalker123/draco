// useClassifiedsPagination Hook
// Manages pagination for Player Classifieds

import { useState, useCallback } from 'react';
import {
  IUseClassifiedsPaginationReturn,
  IClassifiedsPagination,
} from '../types/playerClassifieds';

interface UseClassifiedsPaginationProps {
  initialPage?: number;
  initialLimit?: number;
  initialTotal?: number;
}

export const useClassifiedsPagination = ({
  initialPage = 1,
  initialLimit = 20,
  initialTotal = 0,
}: UseClassifiedsPaginationProps = {}): IUseClassifiedsPaginationReturn => {
  // Pagination state
  const [pagination, setPagination] = useState<IClassifiedsPagination>({
    page: initialPage,
    limit: initialLimit,
    total: initialTotal,
    totalPages: Math.ceil(initialTotal / initialLimit),
    hasNext: initialPage < Math.ceil(initialTotal / initialLimit),
    hasPrev: initialPage > 1,
  });

  // Handle page change
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
      hasNext: page < prev.totalPages,
      hasPrev: page > 1,
    }));
  }, []);

  // Handle limit change
  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => {
      const newTotalPages = Math.ceil(prev.total / limit);
      return {
        ...prev,
        limit,
        totalPages: newTotalPages,
        page: 1, // Reset to first page when changing limit
        hasNext: newTotalPages > 1,
        hasPrev: false,
      };
    });
  }, []);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.hasNext) {
        const newPage = prev.page + 1;
        return {
          ...prev,
          page: newPage,
          hasNext: newPage < prev.totalPages,
          hasPrev: newPage > 1,
        };
      }
      return prev;
    });
  }, []);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.hasPrev) {
        const newPage = prev.page - 1;
        return {
          ...prev,
          page: newPage,
          hasNext: newPage < prev.totalPages,
          hasPrev: newPage > 1,
        };
      }
      return prev;
    });
  }, []);

  // Navigate to first page
  const goToFirstPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      hasNext: prev.totalPages > 1,
      hasPrev: false,
    }));
  }, []);

  // Navigate to last page
  const goToLastPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: prev.totalPages,
      hasNext: false,
      hasPrev: prev.totalPages > 1,
    }));
  }, []);

  return {
    pagination,
    setPage,
    setLimit,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
  };
};
