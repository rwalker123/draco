export function logAndRethrow(context: string, error: unknown): never {
  console.error(`Error in ${context}:`, error);
  throw error;
}
