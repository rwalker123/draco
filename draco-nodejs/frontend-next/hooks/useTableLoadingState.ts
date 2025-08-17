'use client';

import { useState, useEffect } from 'react';

interface LoadingState {
  isInitialLoad: boolean;
  isPaginating: boolean;
  isSearching: boolean;
  shouldShowSkeleton: boolean;
}

interface UseTableLoadingStateProps {
  loading: boolean;
  isInitialLoad: boolean;
  loadingDelay?: number;
}

export const useTableLoadingState = ({
  loading,
  isInitialLoad,
  loadingDelay = 500,
}: UseTableLoadingStateProps): LoadingState => {
  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(false);
  const [loadingTimer, setLoadingTimer] = useState<NodeJS.Timeout | null>(null);

  // Determine loading types
  const isPaginating = loading && !isInitialLoad;
  const isSearching = false; // This can be expanded later if needed

  // Handle loading delay for skeleton display
  useEffect(() => {
    if (loading) {
      // Clear any existing timer
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }

      // Set a new timer to show skeleton after delay
      const timer = setTimeout(() => {
        setShouldShowSkeleton(true);
      }, loadingDelay);

      setLoadingTimer(timer);
    } else {
      // Clear timer and hide skeleton immediately when loading stops
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        setLoadingTimer(null);
      }
      setShouldShowSkeleton(false);
    }

    // Cleanup on unmount
    return () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    };
  }, [loading, loadingDelay]);

  // Reset skeleton state when loading state changes
  useEffect(() => {
    if (!loading) {
      setShouldShowSkeleton(false);
    }
  }, [loading]);

  return {
    isInitialLoad,
    isPaginating,
    isSearching,
    shouldShowSkeleton,
  };
};
