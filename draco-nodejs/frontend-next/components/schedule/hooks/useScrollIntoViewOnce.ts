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

    const element = ref.current;
    if (!element) {
      return;
    }

    element.scrollIntoView({ block, behavior });
    hasScrolledRef.current = true;
  }, [targetKey, block, behavior]);

  return ref;
}
