'use client';

import { useState, useEffect, useRef } from 'react';

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine loading types
  const isPaginating = loading && !isInitialLoad;
  const isSearching = false; // This can be expanded later if needed

  // Handle loading delay for skeleton display
  useEffect(() => {
    if (!loading) {
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set a new timer to show skeleton after delay
    timerRef.current = setTimeout(() => {
      setShouldShowSkeleton(true);
      timerRef.current = null;
    }, loadingDelay);

    // Cleanup on unmount or when loading stops
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShouldShowSkeleton(false);
    };
  }, [loading, loadingDelay]);

  return {
    isInitialLoad,
    isPaginating,
    isSearching,
    shouldShowSkeleton,
  };
};
