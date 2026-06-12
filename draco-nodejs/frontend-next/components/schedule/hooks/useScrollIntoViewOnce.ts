import { useEffect, useRef } from 'react';

interface ScrollIntoViewOnceOptions {
  block?: ScrollLogicalPosition;
  behavior?: ScrollBehavior;
}

export function useScrollIntoViewOnce<T extends HTMLElement>(
  targetKey: string | null | undefined,
  options: ScrollIntoViewOnceOptions = {},
) {
  const { block = 'start', behavior = 'smooth' } = options;
  const ref = useRef<T | null>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (hasScrolledRef.current || !targetKey) {
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
      hasScrolledRef.current = true;
      frameId = null;
    };

    attempt();

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [targetKey, block, behavior]);

  return ref;
}
