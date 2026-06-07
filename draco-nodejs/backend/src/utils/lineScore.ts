import { Prisma } from '#prisma/client';
import type { LineScoreSideInputType } from '@draco/shared-schemas';

export interface StoredLineScoreSide {
  runsByInning: (number | null)[];
  errors: number | null;
  hitsOverride: number | null;
  enteredByContactId: string | null;
  enteredByTeamSeasonId: string | null;
  enteredAt: string | null;
}

export function parseStoredLineScoreSide(
  value: Prisma.JsonValue | null | undefined,
): StoredLineScoreSide | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const obj = value as Prisma.JsonObject;

  const runsByInning = Array.isArray(obj.runsByInning)
    ? obj.runsByInning.map((run) => (typeof run === 'number' ? run : null))
    : [];

  return {
    runsByInning,
    errors: typeof obj.errors === 'number' ? obj.errors : null,
    hitsOverride: typeof obj.hitsOverride === 'number' ? obj.hitsOverride : null,
    enteredByContactId: typeof obj.enteredByContactId === 'string' ? obj.enteredByContactId : null,
    enteredByTeamSeasonId:
      typeof obj.enteredByTeamSeasonId === 'string' ? obj.enteredByTeamSeasonId : null,
    enteredAt: typeof obj.enteredAt === 'string' ? obj.enteredAt : null,
  };
}

export function buildStoredLineScoreSide(
  input: LineScoreSideInputType,
  authorContactId: string | null,
  authorTeamSeasonId: bigint,
  enteredAt: string,
): StoredLineScoreSide {
  return {
    runsByInning: input.runsByInning,
    errors: input.errors,
    hitsOverride: input.hitsOverride ?? null,
    enteredByContactId: authorContactId,
    enteredByTeamSeasonId: authorTeamSeasonId.toString(),
    enteredAt,
  };
}
