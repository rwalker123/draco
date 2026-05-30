import { describe, expect, it } from 'vitest';
import type { SchedulerSolveResult } from '@draco/shared-schemas';
import { findSelectedFieldClashes } from '../schedulerAssignmentChecks';

type Assignment = SchedulerSolveResult['assignments'][number];

const assignment = (
  gameId: string,
  fieldId: string,
  startTime: string,
  endTime: string,
): Assignment => ({ gameId, fieldId, startTime, endTime, umpireIds: [] });

describe('findSelectedFieldClashes', () => {
  it('flags two selected assignments on the same field with overlapping times', () => {
    const assignments = [
      assignment('g1', '44', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
      assignment('g2', '44', '2026-04-05T14:00:00Z', '2026-04-05T15:15:00Z'),
    ];
    const clashes = findSelectedFieldClashes(assignments, new Set(['g1', 'g2']));
    expect(clashes).toHaveLength(1);
    expect(clashes[0].fieldId).toBe('44');
    expect(clashes[0].gameIds.sort()).toEqual(['g1', 'g2']);
  });

  it('does not flag overlaps on different fields', () => {
    const assignments = [
      assignment('g1', '44', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
      assignment('g2', '45', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
    ];
    expect(findSelectedFieldClashes(assignments, new Set(['g1', 'g2']))).toHaveLength(0);
  });

  it('does not flag same-field assignments that do not overlap in time', () => {
    const assignments = [
      assignment('g1', '44', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
      assignment('g2', '44', '2026-04-05T14:15:00Z', '2026-04-05T15:30:00Z'),
    ];
    expect(findSelectedFieldClashes(assignments, new Set(['g1', 'g2']))).toHaveLength(0);
  });

  it('ignores assignments that are not selected', () => {
    const assignments = [
      assignment('g1', '44', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
      assignment('g2', '44', '2026-04-05T14:00:00Z', '2026-04-05T15:15:00Z'),
    ];
    expect(findSelectedFieldClashes(assignments, new Set(['g1']))).toHaveLength(0);
  });

  it('groups three overlapping games on one field into a single clash entry', () => {
    const assignments = [
      assignment('g1', '44', '2026-04-05T13:00:00Z', '2026-04-05T14:15:00Z'),
      assignment('g2', '44', '2026-04-05T13:30:00Z', '2026-04-05T14:45:00Z'),
      assignment('g3', '44', '2026-04-05T14:00:00Z', '2026-04-05T15:15:00Z'),
    ];
    const clashes = findSelectedFieldClashes(assignments, new Set(['g1', 'g2', 'g3']));
    expect(clashes).toHaveLength(1);
    expect(clashes[0].gameIds.sort()).toEqual(['g1', 'g2', 'g3']);
  });
});
