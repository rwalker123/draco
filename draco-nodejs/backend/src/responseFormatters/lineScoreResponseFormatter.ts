import type { LineScoreSideType, LineScoreType } from '@draco/shared-schemas';
import { gamelinescore } from '#prisma/client';
import { parseStoredLineScoreSide, StoredLineScoreSide } from '../utils/lineScore.js';

export interface LineScoreFormatInput {
  gameId: bigint;
  homeTeamSeasonId: bigint;
  awayTeamSeasonId: bigint;
  homeRuns: number;
  awayRuns: number;
  row: gamelinescore | null;
  hitsByTeam: Map<string, number>;
  teamNames: Map<string, string>;
}

export class LineScoreResponseFormatter {
  static format(input: LineScoreFormatInput): LineScoreType {
    return {
      gameId: input.gameId.toString(),
      home: this.formatSide(
        input.homeTeamSeasonId,
        input.homeRuns,
        parseStoredLineScoreSide(input.row?.home),
        input.hitsByTeam,
        input.teamNames,
      ),
      away: this.formatSide(
        input.awayTeamSeasonId,
        input.awayRuns,
        parseStoredLineScoreSide(input.row?.away),
        input.hitsByTeam,
        input.teamNames,
      ),
    };
  }

  private static formatSide(
    teamSeasonId: bigint,
    runs: number,
    stored: StoredLineScoreSide | null,
    hitsByTeam: Map<string, number>,
    teamNames: Map<string, string>,
  ): LineScoreSideType {
    const teamSeasonIdStr = teamSeasonId.toString();
    const hitsOverride = stored?.hitsOverride ?? null;
    const derivedHits = hitsByTeam.get(teamSeasonIdStr);
    const hits = hitsOverride ?? derivedHits ?? null;

    return {
      teamSeasonId: teamSeasonIdStr,
      teamName: teamNames.get(teamSeasonIdStr) ?? '',
      runsByInning: stored?.runsByInning ?? [],
      errors: stored?.errors ?? null,
      hitsOverride,
      runs,
      hits,
      authoritative: stored?.enteredByTeamSeasonId === teamSeasonIdStr,
      enteredByContactId: stored?.enteredByContactId ?? null,
      enteredAt: stored?.enteredAt ?? null,
    };
  }
}
