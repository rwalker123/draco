/**
 * Development utility to log component props including seasonId
 * Helps track down components passing empty seasonId
 */
export function debugComponentProps(componentName: string, props: Record<string, unknown>) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) return;

  const { seasonId, accountId, ...otherProps } = props;

  console.log(`🔍 ${componentName}: Component rendered with:`, {
    accountId,
    seasonId: seasonId || '<EMPTY>',
    ...Object.keys(otherProps).reduce(
      (acc, key) => {
        // Only log first few props to avoid noise
        if (Object.keys(acc).length < 5) {
          acc[key] = otherProps[key];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    ),
  });

  // Warn about empty seasonId
  if (!seasonId || seasonId === '') {
    console.warn(`⚠️ ${componentName}: Empty seasonId detected!`, {
      seasonId,
      accountId,
      suggestion: 'Consider using useCurrentSeason hook to fetch valid season ID',
    });
  }
}
