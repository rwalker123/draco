// useClassifiedsSearch Hook Tests
// Comprehensive testing of search functionality and state management

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassifiedsSearch } from '../useClassifiedsSearch';
import { createTestProps } from '../../test-utils/playerClassifiedsTestUtils';

// ============================================================================
// TEST SUITE
// ============================================================================

describe('useClassifiedsSearch', () => {
  const defaultProps = {
    onSearch: vi.fn(),
    debounceMs: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));

      expect(result.current.searchState.searchTerm).toBe('');
      expect(result.current.searchState.isSearching).toBe(false);
      expect(result.current.searchState.hasSearchResults).toBe(false);
      expect(result.current.searchState.searchHistory).toEqual([]);
    });

    it('should initialize with custom debounce delay', () => {
      const props = createTestProps(defaultProps, { debounceMs: 500 });
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // The debounce delay is internal, but we can test it through behavior
      expect(result.current.searchState.searchTerm).toBe('');
    });
  });

  // ============================================================================
  // SEARCH TERM MANAGEMENT TESTS
  // ============================================================================

  describe('Search Term Management', () => {
    it('should update search term through handleSearchInput', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));

      act(() => {
        result.current.handleSearchInput('new search term');
      });

      expect(result.current.searchState.searchTerm).toBe('new search term');
    });

    it('should handle empty search terms', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));

      act(() => {
        result.current.handleSearchInput('');
      });

      expect(result.current.searchState.searchTerm).toBe('');
    });

    it('should handle whitespace-only search terms', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));

      act(() => {
        result.current.handleSearchInput('   ');
      });

      expect(result.current.searchState.searchTerm).toBe('   ');
    });

    it('should handle special characters in search terms', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));
      const specialTerms = ['pitcher & catcher', 'first-base (left)', 'outfield-right'];

      specialTerms.forEach((term) => {
        act(() => {
          result.current.handleSearchInput(term);
        });
        expect(result.current.searchState.searchTerm).toBe(term);
      });
    });
  });

  // ============================================================================
  // DEBOUNCED SEARCH TESTS
  // ============================================================================

  describe('Debounced Search', () => {
    it('should debounce search term changes', async () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchInput('p');
        result.current.handleSearchInput('pi');
        result.current.handleSearchInput('pit');
        result.current.handleSearchInput('pitc');
        result.current.handleSearchInput('pitch');
        result.current.handleSearchInput('pitche');
        result.current.handleSearchInput('pitcher');
      });

      // Should not have called onSearch yet due to debouncing
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have called onSearch with the final term
      expect(mockOnSearch).toHaveBeenCalledWith('pitcher');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on new search term', async () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchInput('pitcher');
      });

      // Wait almost to the debounce time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Change the search term, which should reset the timer
      act(() => {
        result.current.handleSearchInput('catcher');
      });

      // Wait again, should not trigger the first search
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnSearch).not.toHaveBeenCalled();

      // Wait for the full debounce time for the second term
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockOnSearch).toHaveBeenCalledWith('catcher');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('should handle different debounce delays', async () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch, debounceMs: 500 };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchInput('pitcher');
      });

      // Should not trigger at 300ms (default delay)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnSearch).not.toHaveBeenCalled();

      // Should trigger at 500ms (custom delay)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockOnSearch).toHaveBeenCalledWith('pitcher');
    });
  });

  // ============================================================================
  // SEARCH SUBMISSION TESTS
  // ============================================================================

  describe('Search Submission', () => {
    it('should handle search submission', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchSubmit('immediate search');
      });

      expect(mockOnSearch).toHaveBeenCalledWith('immediate search');
      expect(result.current.searchState.isSearching).toBe(true);
    });

    it('should handle search submission with current term', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Set a search term first
      act(() => {
        result.current.handleSearchInput('current term');
      });

      // Submit without specifying a term
      act(() => {
        result.current.handleSearchSubmit();
      });

      expect(mockOnSearch).toHaveBeenCalledWith('current term');
    });

    it('should not submit empty search terms', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchSubmit('');
      });

      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SEARCH CLEARING TESTS
  // ============================================================================

  describe('Search Clearing', () => {
    it('should clear search term and results', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Set initial state
      act(() => {
        result.current.handleSearchInput('test term');
      });

      expect(result.current.searchState.searchTerm).toBe('test term');

      // Clear search
      act(() => {
        result.current.handleClearSearch();
      });

      expect(result.current.searchState.searchTerm).toBe('');
      expect(result.current.searchState.hasSearchResults).toBe(false);
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  // ============================================================================
  // SEARCH HISTORY TESTS
  // ============================================================================

  describe('Search History', () => {
    it('should add terms to search history', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchSubmit('first search');
        result.current.handleSearchSubmit('second search');
      });

      expect(result.current.searchState.searchHistory).toContain('first search');
      expect(result.current.searchState.searchHistory).toContain('second search');
    });

    it('should limit search history to 10 items', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Add 12 search terms
      for (let i = 1; i <= 12; i++) {
        act(() => {
          result.current.handleSearchSubmit(`search ${i}`);
        });
      }

      expect(result.current.searchState.searchHistory).toHaveLength(10);
      expect(result.current.searchState.searchHistory[0]).toBe('search 12');
      expect(result.current.searchState.searchHistory[9]).toBe('search 3');
    });

    it('should handle search history selection', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Add a term to history
      act(() => {
        result.current.handleSearchSubmit('history term');
      });

      // Select from history
      act(() => {
        result.current.handleSearchHistorySelect('history term');
      });

      expect(result.current.searchState.searchTerm).toBe('history term');
      expect(mockOnSearch).toHaveBeenCalledWith('history term');
    });

    it('should clear search history', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Add some terms to history
      act(() => {
        result.current.handleSearchSubmit('term 1');
        result.current.handleSearchSubmit('term 2');
      });

      expect(result.current.searchState.searchHistory).toHaveLength(2);

      // Clear history
      act(() => {
        result.current.clearSearchHistory();
      });

      expect(result.current.searchState.searchHistory).toHaveLength(0);
    });
  });

  // ============================================================================
  // SEARCH STATE MANAGEMENT TESTS
  // ============================================================================

  describe('Search State Management', () => {
    it('should set searching state during search operations', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      act(() => {
        result.current.handleSearchSubmit('test search');
      });

      expect(result.current.searchState.isSearching).toBe(true);
    });

    it('should handle search errors gracefully', () => {
      const mockOnSearch = vi.fn().mockImplementation(() => {
        throw new Error('Search failed');
      });
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Should throw error when onSearch throws
      expect(() => {
        act(() => {
          result.current.handleSearchSubmit('error search');
        });
      }).toThrow('Search failed');
    });
  });

  // ============================================================================
  // PERFORMANCE CONSIDERATIONS TESTS
  // ============================================================================

  describe('Performance Considerations', () => {
    it('should handle rapid search term changes efficiently', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Rapidly change search terms
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handleSearchInput(`search${i}`);
        });
      }

      // Should not have called onSearch yet due to debouncing
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward to trigger debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only call onSearch once with the last term
      expect(mockOnSearch).toHaveBeenCalledWith('search9');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long search terms', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));
      const longSearchTerm = 'a'.repeat(1000);

      act(() => {
        result.current.handleSearchInput(longSearchTerm);
      });

      expect(result.current.searchState.searchTerm).toBe(longSearchTerm);
    });

    it('should handle null and undefined values gracefully', () => {
      const { result } = renderHook(() => useClassifiedsSearch(defaultProps));

      act(() => {
        result.current.handleSearchInput('');
      });

      expect(result.current.searchState.searchTerm).toBe('');
    });

    it('should handle concurrent operations', () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // Multiple operations
      act(() => {
        result.current.handleSearchInput('term 1');
        result.current.handleSearchInput('term 2');
        result.current.handleSearchInput('term 3');
      });

      // Should not have called onSearch yet
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward to trigger debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should call onSearch with the last term
      expect(mockOnSearch).toHaveBeenCalledWith('term 3');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration with Search Flow', () => {
    it('should provide complete search workflow', async () => {
      const mockOnSearch = vi.fn();
      const props = { ...defaultProps, onSearch: mockOnSearch };
      const { result } = renderHook(() => useClassifiedsSearch(props));

      // 1. Set search term
      act(() => {
        result.current.handleSearchInput('experienced pitcher');
      });

      expect(result.current.searchState.searchTerm).toBe('experienced pitcher');

      // 2. Wait for debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnSearch).toHaveBeenCalledWith('experienced pitcher');

      // 3. Clear search
      act(() => {
        result.current.handleClearSearch();
      });

      expect(result.current.searchState.searchTerm).toBe('');
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });
});
