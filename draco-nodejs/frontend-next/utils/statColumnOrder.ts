export const reconcileOrder = (saved: string[], canonical: string[]): string[] => {
  const canonicalSet = new Set(canonical);
  const kept = saved.filter((field) => canonicalSet.has(field));
  const keptSet = new Set(kept);
  const appended = canonical.filter((field) => !keptSet.has(field));
  return [...kept, ...appended];
};

export const applyColumnOrder = (originalVisibleFields: string[], saved: string[]): string[] => {
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
  storedFull: string[],
  visibleFields: string[],
  newVisibleOrder: string[],
): string[] => {
  const visibleSet = new Set(visibleFields);
  const queue = [...newVisibleOrder];
  let next = 0;
  return storedFull.map((field) => (visibleSet.has(field) ? queue[next++] : field));
};
