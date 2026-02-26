import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClassifiedsPagination } from '../useClassifiedsPagination';

describe('useClassifiedsPagination', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useClassifiedsPagination());
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.limit).toBe(20);
    expect(result.current.pagination.total).toBe(0);
    expect(result.current.pagination.totalPages).toBe(0);
    expect(result.current.pagination.hasNext).toBe(false);
    expect(result.current.pagination.hasPrev).toBe(false);
  });

  it('initializes with custom values', () => {
    const { result } = renderHook(() =>
      useClassifiedsPagination({ initialPage: 2, initialLimit: 10, initialTotal: 50 }),
    );
    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.limit).toBe(10);
    expect(result.current.pagination.total).toBe(50);
    expect(result.current.pagination.totalPages).toBe(5);
    expect(result.current.pagination.hasNext).toBe(true);
    expect(result.current.pagination.hasPrev).toBe(true);
  });

  describe('setPage', () => {
    it('navigates to specific page and updates hasNext/hasPrev', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialTotal: 60, initialLimit: 20 }),
      );

      act(() => {
        result.current.setPage(2);
      });
      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.hasNext).toBe(true);
      expect(result.current.pagination.hasPrev).toBe(true);

      act(() => {
        result.current.setPage(3);
      });
      expect(result.current.pagination.page).toBe(3);
      expect(result.current.pagination.hasNext).toBe(false);
      expect(result.current.pagination.hasPrev).toBe(true);
    });
  });

  describe('setLimit', () => {
    it('resets to page 1 when limit changes', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialPage: 3, initialTotal: 100, initialLimit: 10 }),
      );

      act(() => {
        result.current.setLimit(50);
      });
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.limit).toBe(50);
      expect(result.current.pagination.totalPages).toBe(2);
      expect(result.current.pagination.hasNext).toBe(true);
      expect(result.current.pagination.hasPrev).toBe(false);
    });
  });

  describe('goToNextPage', () => {
    it('advances page when hasNext', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialTotal: 40, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToNextPage();
      });
      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.hasNext).toBe(false);
    });

    it('does nothing on last page', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialPage: 1, initialTotal: 10, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToNextPage();
      });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('goToPrevPage', () => {
    it('goes back when hasPrev', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialPage: 2, initialTotal: 40, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToPrevPage();
      });
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.hasPrev).toBe(false);
    });

    it('does nothing on first page', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialTotal: 40, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToPrevPage();
      });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('goToFirstPage', () => {
    it('navigates to page 1', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialPage: 3, initialTotal: 60, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToFirstPage();
      });
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.hasPrev).toBe(false);
      expect(result.current.pagination.hasNext).toBe(true);
    });
  });

  describe('goToLastPage', () => {
    it('navigates to last page', () => {
      const { result } = renderHook(() =>
        useClassifiedsPagination({ initialTotal: 60, initialLimit: 20 }),
      );

      act(() => {
        result.current.goToLastPage();
      });
      expect(result.current.pagination.page).toBe(3);
      expect(result.current.pagination.hasNext).toBe(false);
      expect(result.current.pagination.hasPrev).toBe(true);
    });
  });
});
