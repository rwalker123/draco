/**
 * URL utility functions for building search parameters and handling URL operations
 */

/**
 * Builds URLSearchParams from an object with proper handling for different value types
 *
 * @param params - Object with parameters to convert to URLSearchParams
 * @returns URLSearchParams instance with all valid parameters added
 *
 * @example
 * ```typescript
 * const params = buildSearchParams({
 *   page: 1,
 *   filters: ['active', 'published'],
 *   date: new Date('2023-01-01'),
 *   optional: undefined, // Will be skipped
 * });
 * // Results in: "page=1&filters=active&filters=published&date=2023-01-01T00:00:00.000Z"
 * ```
 */
export function buildSearchParams(params?: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (!params) {
    return searchParams;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle arrays by appending each value separately
        value.forEach((v) => searchParams.append(key, v.toString()));
      } else if (value instanceof Date) {
        // Handle Date objects by converting to ISO string
        searchParams.append(key, value.toISOString());
      } else {
        // Handle all other types by converting to string
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams;
}
