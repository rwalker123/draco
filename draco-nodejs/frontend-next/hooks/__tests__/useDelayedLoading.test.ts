import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedLoading } from '../useDelayedLoading';

describe('useDelayedLoading', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false initially when not loading', () => {
    const { result } = renderHook(() => useDelayedLoading(false));
    expect(result.current).toBe(false);
  });

  it('returns false initially even when loading (before delay)', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDelayedLoading(true, 2000));
    expect(result.current).toBe(false);
  });

  it('returns true after delay when still loading', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDelayedLoading(true, 500));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);
  });

  it('does not show loading if loading completes before delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ isLoading }) => useDelayedLoading(isLoading, 500), {
      initialProps: { isLoading: true },
    });

    vi.advanceTimersByTime(200);
    rerender({ isLoading: false });
    vi.advanceTimersByTime(300);
    expect(result.current).toBe(false);
  });

  it('resets when loading stops and starts again', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ isLoading }) => useDelayedLoading(isLoading, 500), {
      initialProps: { isLoading: true },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);

    rerender({ isLoading: false });
    expect(result.current).toBe(false);

    rerender({ isLoading: true });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);
  });
});
