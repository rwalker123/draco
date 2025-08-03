import { useState, useEffect, useRef, useCallback } from 'react';

export interface SmoothTransitionState {
  isTransitioning: boolean;
  showContent: boolean;
  displayData: unknown;
  opacity: number;
}

export interface UseSmoothTransitionOptions {
  transitionDuration?: number;
  keepPreviousDataVisible?: boolean;
  enableBlur?: boolean;
  staggerDelay?: number;
}

export const useSmoothTransition = (
  data: unknown,
  loading: boolean,
  options: UseSmoothTransitionOptions = {},
) => {
  const { transitionDuration = 400, keepPreviousDataVisible = true, enableBlur = true } = options;

  const [state, setState] = useState<SmoothTransitionState>({
    isTransitioning: false,
    showContent: true,
    displayData: data,
    opacity: 1,
  });

  const dataRef = useRef(data);
  const loadingRef = useRef(loading);
  const isInitialMount = useRef(true);

  // Create a unique key for data changes to help React track transitions
  const dataKey = useRef(0);
  const getDataKey = useCallback(() => {
    return `data-${dataKey.current}`;
  }, []);

  useEffect(() => {
    // Skip transition on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setState((prev) => ({ ...prev, displayData: data }));
      dataRef.current = data;
      loadingRef.current = loading;
      return;
    }

    const dataChanged = dataRef.current !== data;
    const startedLoading = !loadingRef.current && loading;
    const finishedLoading = loadingRef.current && !loading;

    if (startedLoading && dataChanged) {
      // Start transition - fade out slightly and add blur
      dataKey.current += 1;
      setState((prev) => ({
        ...prev,
        isTransitioning: true,
        opacity: keepPreviousDataVisible ? 0.85 : 0.4,
      }));
    }

    if (finishedLoading && dataChanged) {
      // Complete transition - fade out old, fade in new
      setState((prev) => ({
        ...prev,
        showContent: false,
        opacity: 0,
      }));

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          displayData: data,
          showContent: true,
          opacity: 1,
        }));

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isTransitioning: false,
          }));
        }, transitionDuration);
      }, transitionDuration * 0.3);
    }

    // Update refs
    dataRef.current = data;
    loadingRef.current = loading;
  }, [data, loading, transitionDuration, keepPreviousDataVisible]);

  const transitionStyles = {
    opacity: state.opacity,
    filter: state.isTransitioning && enableBlur ? 'blur(0.5px)' : 'none',
    transform: state.isTransitioning ? 'scale(0.998)' : 'scale(1)',
    transition: `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  };

  const containerStyles = {
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const progressBarStyles = loading
    ? {
        '&::before': {
          content: '""',
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, 
        transparent 0%, 
        rgba(25, 118, 210, 0.4) 50%, 
        transparent 100%)`,
          animation: 'smoothSlide 1.5s ease-in-out infinite',
          zIndex: 1,
        },
        '@keyframes smoothSlide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }
    : {};

  return {
    ...state,
    transitionStyles,
    containerStyles: { ...containerStyles, ...progressBarStyles },
    dataKey: getDataKey(),
    isLoading: loading,
  };
};
