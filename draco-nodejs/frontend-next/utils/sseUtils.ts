/**
 * Safely parses JSON data from SSE events.
 * Returns null and logs an error if parsing fails, preventing crashes from malformed server data.
 *
 * @param data - The JSON string to parse
 * @param eventName - The SSE event name (for error logging)
 * @returns The parsed data or null if parsing fails
 */
export function safeJsonParse<T>(data: string, eventName: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Failed to parse ${eventName} event data:`, error);
    return null;
  }
}
