import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Direction = 'next' | 'prev';

type CarouselOptions = {
  total: number;
  visibleItems?: number;
  loop?: boolean;
};

type UseCarouselResult = {
  currentIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  registerNode: (element: HTMLElement | null) => void;
};

const defaultOptions: CarouselOptions = {
  total: 0,
  visibleItems: 1,
  loop: false,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const useCarousel = (options: CarouselOptions): UseCarouselResult => {
  const {
    total,
    visibleItems = defaultOptions.visibleItems!,
    loop = defaultOptions.loop!,
  } = options;
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const target = children[currentIndex];

    if (target) {
      container.scrollTo({
        left: target.offsetLeft,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const goTo = useCallback(
    (direction: Direction) => {
      setCurrentIndex((prev) => {
        const delta = direction === 'next' ? visibleItems : -visibleItems;
        const rawIndex = prev + delta;

        if (loop) {
          if (rawIndex < 0) {
            return (total + rawIndex) % total;
          }
          return rawIndex % total;
        }

        const maxIndex = Math.max(total - visibleItems, 0);
        return clamp(rawIndex, 0, maxIndex);
      });
    },
    [loop, total, visibleItems],
  );

  const handleNext = useCallback(() => {
    if (!total) return;
    goTo('next');
  }, [goTo, total]);

  const handlePrev = useCallback(() => {
    if (!total) return;
    goTo('prev');
  }, [goTo, total]);

  const canGoPrev = useMemo(() => {
    if (loop || !total) return true;
    return currentIndex > 0;
  }, [currentIndex, loop, total]);

  const canGoNext = useMemo(() => {
    if (loop || !total) return true;
    return currentIndex < Math.max(total - visibleItems, 0);
  }, [currentIndex, loop, total, visibleItems]);

  const registerNode = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return {
    currentIndex,
    canGoNext,
    canGoPrev,
    handleNext,
    handlePrev,
    registerNode,
  };
};

export default useCarousel;
