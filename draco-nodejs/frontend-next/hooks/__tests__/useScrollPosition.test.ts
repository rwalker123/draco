import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPosition } from '../useScrollPosition';

describe('useScrollPosition', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(0);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
  });

  it('initializes with zero position', () => {
    const { result } = renderHook(() => useScrollPosition());
    const pos = result.current.getScrollPosition();
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it('saves scroll position from window', () => {
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(100);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(200);

    const { result } = renderHook(() => useScrollPosition());
    act(() => {
      result.current.saveScrollPosition();
    });

    const pos = result.current.getScrollPosition();
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(200);
  });

  it('sets scroll position manually', () => {
    const { result } = renderHook(() => useScrollPosition());
    act(() => {
      result.current.setScrollPosition({ x: 50, y: 75 });
    });

    const pos = result.current.getScrollPosition();
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(75);
  });

  it('does not save when disabled', () => {
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(100);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(200);

    const { result } = renderHook(() => useScrollPosition({ enabled: false }));
    act(() => {
      result.current.saveScrollPosition();
    });

    const pos = result.current.getScrollPosition();
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it('restores scroll position using requestAnimationFrame', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    const { result } = renderHook(() => useScrollPosition());
    act(() => {
      result.current.setScrollPosition({ x: 100, y: 200 });
    });

    act(() => {
      result.current.restoreScrollPosition();
    });

    expect(rafSpy).toHaveBeenCalled();
    expect(scrollToSpy).toHaveBeenCalledWith(100, 200);

    scrollToSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('does not restore when position is zero', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const { result } = renderHook(() => useScrollPosition());
    act(() => {
      result.current.restoreScrollPosition();
    });

    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
  });

  it('returns a copy from getScrollPosition', () => {
    const { result } = renderHook(() => useScrollPosition());
    act(() => {
      result.current.setScrollPosition({ x: 10, y: 20 });
    });

    const pos1 = result.current.getScrollPosition();
    const pos2 = result.current.getScrollPosition();
    expect(pos1).toEqual(pos2);
    expect(pos1).not.toBe(pos2);
  });
});
