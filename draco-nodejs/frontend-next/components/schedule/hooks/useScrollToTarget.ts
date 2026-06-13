import { useEffect, useRef } from 'react';

interface ScrollToTargetOptions {
  block?: ScrollLogicalPosition;
  behavior?: ScrollBehavior;
  ready?: boolean;
  trigger?: number;
}

export function useScrollToTarget<T extends HTMLElement>(
  targetKey: string | null | undefined,
  options: ScrollToTargetOptions = {},
) {
  const { block = 'start', behavior = 'smooth', ready = true, trigger = 0 } = options;
  const ref = useRef<T | null>(null);
  const lastScrolledRef = useRef<{ key: string; trigger: number } | null>(null);

  useEffect(() => {
    if (!ready || !targetKey) {
      return;
    }

    const last = lastScrolledRef.current;
    if (last && last.key === targetKey && last.trigger === trigger) {
      return;
    }

    let frameId: number | null = null;

    const attempt = () => {
      const element = ref.current;
      if (!element) {
        frameId = requestAnimationFrame(attempt);
        return;
      }

      element.scrollIntoView({ block, behavior });
      lastScrolledRef.current = { key: targetKey, trigger };
      frameId = null;
    };

    attempt();

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [targetKey, ready, trigger, block, behavior]);

  return ref;
}
