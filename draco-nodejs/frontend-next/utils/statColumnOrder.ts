export const reconcileOrder = (
  saved: readonly string[],
  canonical: readonly string[],
): string[] => {
  const canonicalSet = new Set(canonical);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const field of saved) {
    if (canonicalSet.has(field) && !seen.has(field)) {
      seen.add(field);
      kept.push(field);
    }
  }
  const appended = canonical.filter((field) => !seen.has(field));
  return [...kept, ...appended];
};

export const applyColumnOrder = (
  originalVisibleFields: readonly string[],
  saved: readonly string[],
): string[] => {
  if (saved.length === 0) {
    return [...originalVisibleFields];
  }
  const visibleSet = new Set(originalVisibleFields);
  const queue = saved.filter((field) => visibleSet.has(field));
  const savedSet = new Set(saved);
  let next = 0;
  return originalVisibleFields.map((field) => (savedSet.has(field) ? queue[next++] : field));
};

export const mergeColumnOrder = (
  storedFull: readonly string[],
  visibleFields: readonly string[],
  newVisibleOrder: readonly string[],
): string[] => {
  const visibleSet = new Set(visibleFields);
  const queue = [...newVisibleOrder];
  let next = 0;
  return storedFull.map((field) => (visibleSet.has(field) ? queue[next++] : field));
};
