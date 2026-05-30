import type { SchedulerSolveResult } from '@draco/shared-schemas';

type Assignment = SchedulerSolveResult['assignments'][number];

export interface FieldClash {
  fieldId: string;
  gameIds: string[];
}

/**
 * Cheap client-side heads-up: among the SELECTED assignments, find groups that share a field
 * with overlapping time ranges. This is a warning only — the backend apply remains the source of
 * truth (it reports true conflicts, including field capacity, via its skipped[] result).
 */
export const findSelectedFieldClashes = (
  assignments: Assignment[],
  selectedGameIds: Set<string>,
): FieldClash[] => {
  const selected = assignments.filter((assignment) => selectedGameIds.has(assignment.gameId));
  const clashesByField = new Map<string, Set<string>>();

  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const a = selected[i];
      const b = selected[j];
      if (a.fieldId !== b.fieldId) continue;

      const aStart = new Date(a.startTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      if (
        Number.isNaN(aStart) ||
        Number.isNaN(aEnd) ||
        Number.isNaN(bStart) ||
        Number.isNaN(bEnd)
      ) {
        continue;
      }

      if (aStart < bEnd && bStart < aEnd) {
        const set = clashesByField.get(a.fieldId) ?? new Set<string>();
        set.add(a.gameId);
        set.add(b.gameId);
        clashesByField.set(a.fieldId, set);
      }
    }
  }

  return Array.from(clashesByField.entries()).map(([fieldId, ids]) => ({
    fieldId,
    gameIds: Array.from(ids),
  }));
};
