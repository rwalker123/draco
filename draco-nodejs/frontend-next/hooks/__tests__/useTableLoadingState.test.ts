import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableLoadingState } from '../useTableLoadingState';

describe('useTableLoadingState', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial load state correctly', () => {
    const { result } = renderHook(() =>
      useTableLoadingState({ loading: true, isInitialLoad: true }),
    );
    expect(result.current.isInitialLoad).toBe(true);
    expect(result.current.isPaginating).toBe(false);
    expect(result.current.isSearching).toBe(false);
  });

  it('returns paginating state when loading but not initial', () => {
    const { result } = renderHook(() =>
      useTableLoadingState({ loading: true, isInitialLoad: false }),
    );
    expect(result.current.isPaginating).toBe(true);
    expect(result.current.isInitialLoad).toBe(false);
  });

  it('does not show skeleton before delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTableLoadingState({ loading: true, isInitialLoad: true, loadingDelay: 500 }),
    );
    expect(result.current.shouldShowSkeleton).toBe(false);
  });

  it('shows skeleton after delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTableLoadingState({ loading: true, isInitialLoad: true, loadingDelay: 500 }),
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.shouldShowSkeleton).toBe(true);
  });

  it('resets skeleton when loading stops', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      (props: { loading: boolean; isInitialLoad: boolean }) =>
        useTableLoadingState({ ...props, loadingDelay: 500 }),
      { initialProps: { loading: true, isInitialLoad: true } },
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.shouldShowSkeleton).toBe(true);

    rerender({ loading: false, isInitialLoad: false });
    expect(result.current.shouldShowSkeleton).toBe(false);
  });

  it('uses default delay of 500ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTableLoadingState({ loading: true, isInitialLoad: true }),
    );

    vi.advanceTimersByTime(499);
    expect(result.current.shouldShowSkeleton).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.shouldShowSkeleton).toBe(true);
  });
});
