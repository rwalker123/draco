import { useState, useEffect, useRef } from 'react';

export interface SmoothTransitionState {
  isTransitioning: boolean;
  showContent: boolean;
  displayData: unknown;
  opacity: number;
  dataVersion: number;
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
    dataVersion: 0,
  });

  const dataRef = useRef(data);
  const loadingRef = useRef(loading);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip transition on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      dataRef.current = data;
      loadingRef.current = loading;
      return;
    }

    const dataChanged = dataRef.current !== data;
    const startedLoading = !loadingRef.current && loading;
    const finishedLoading = loadingRef.current && !loading;

    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleUpdate = (update: () => void) => {
      Promise.resolve().then(() => {
        if (!cancelled) {
          update();
        }
      });
    };

    if (startedLoading && dataChanged) {
      // Start transition - fade out slightly and add blur
      scheduleUpdate(() => {
        setState((prev) => ({
          ...prev,
          dataVersion: prev.dataVersion + 1,
          isTransitioning: true,
          opacity: keepPreviousDataVisible ? 0.85 : 0.4,
        }));
      });
    }

    if (finishedLoading && dataChanged) {
      // Complete transition - fade out old, fade in new
      scheduleUpdate(() => {
        setState((prev) => ({
          ...prev,
          showContent: false,
          opacity: 0,
        }));
      });

      exitTimer = setTimeout(() => {
        if (cancelled) {
          return;
        }
        setState((prev) => ({
          ...prev,
          displayData: data,
          showContent: true,
          opacity: 1,
        }));

        resetTimer = setTimeout(() => {
          if (cancelled) {
            return;
          }
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

    return () => {
      cancelled = true;
      if (exitTimer) {
        clearTimeout(exitTimer);
      }
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
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
    dataKey: `data-${state.dataVersion}`,
    isLoading: loading,
  };
};
