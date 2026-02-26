import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialog } from '../useDialog';

describe('useDialog', () => {
  it('starts closed with no data', () => {
    const { result } = renderHook(() => useDialog<string>());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('opens without data', () => {
    const { result } = renderHook(() => useDialog<string>());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('opens with data', () => {
    const { result } = renderHook(() => useDialog<{ id: string; name: string }>());
    act(() => {
      result.current.open({ id: '1', name: 'Test' });
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ id: '1', name: 'Test' });
  });

  it('closes and clears data', () => {
    const { result } = renderHook(() => useDialog<string>());
    act(() => {
      result.current.open('some data');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('supports reopen with different data', () => {
    const { result } = renderHook(() => useDialog<number>());
    act(() => {
      result.current.open(1);
    });
    expect(result.current.data).toBe(1);

    act(() => {
      result.current.close();
    });

    act(() => {
      result.current.open(2);
    });
    expect(result.current.data).toBe(2);
  });
});
