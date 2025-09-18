import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for delayed loading states
 * Shows loading state only after a specified delay to prevent flickering
 * @param isLoading - Whether the operation is currently loading
 * @param delay - The delay in milliseconds before showing loading state (default: 2000ms)
 * @returns Boolean indicating whether to show the loading state
 */
export const useDelayedLoading = (isLoading: boolean, delay: number = 2000): boolean => {
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start the delay timer
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      // Clear timeout and hide loading immediately when not loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowLoading(false);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, delay]);

  return showLoading;
};
