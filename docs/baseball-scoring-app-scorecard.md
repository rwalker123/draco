# Mobile Scorecard Implementation Notes

The Milestone 2 work introduces the live scorecard experience for the Expo app. This document captures the internal architecture so follow-on milestones can extend the core scoring flows without reverse-engineering the state machine.

## Event Pipeline Overview

1. **Composer UI** – Scorekeepers record plays from the `ScorecardView` component. The form emits a `ScoreEventInput` payload describing the batter, runner advances, runner events (stolen bases, caught stealing), or substitutions.
2. **Retrosheet Parser** – `src/utils/retrosheetParser.ts` converts the payload into canonical notation. Examples:
   - Single with a runner scoring: `S;B-1;3-H`
   - Stolen base from first to second: `SB12`
   - Runner caught stealing: `CS2X`
   - Pinch runner substitution: `SUBR:Jamie/Taylor-PR`
3. **State Machine** – `src/state/scorecardStore.ts` applies the event, validates runner movement, calculates runs/outs, and advances innings. Editing or deleting a prior play triggers a full recompute to keep downstream state deterministic.
4. **Persistence** – Events are serialized into `scorecardStorage` with schema version `1`. Each record tracks `createdAt`, `createdBy`, `deviceId`, and the original input payload so future migrations can rebuild notation or derived stats.

## Offline Storage Layout

```
scorecard_log_v1
└── games: {
      [gameId]: {
        metadata: {
          gameId,
          homeTeam,
          awayTeam,
          field,
          scheduledStart
        },
        events: [
          {
            id,
            sequence,
            createdAt,
            createdBy,
            deviceId,
            input: ScoreEventInput
          }
        ],
        lastUpdated
      }
    }
```

Entries older than 30 days are purged on load. Clearing a game through the UI drops the corresponding record, and undo/redo state is intentionally ephemeral (it is not persisted across sessions).

## Derived Stats

The store aggregates totals on every recompute so the UI can surface quick validation checks:

- `pitching.totalPitches` – Sum of pitches reported per at-bat (defaults to 1 if unspecified).
- `batting.atBats`, `hits`, `walks`, `strikeouts` – Derived from the play result type.
- `batting.runs`, `rbi` – Calculated from runner advances and score deltas to keep provisional tallies visible while syncing is offline.

## Validation Rules

- Runner advances must reference existing base occupants; illegal moves throw user-facing errors.
- Multiple runners cannot occupy the same destination base after an event.
- Outs automatically transition innings—top/bottom halves flip after the third out and clear the bases.
- Substitutions targeting runners replace the occupant on the relevant base; other substitution types only log the personnel change.

## Next Steps

- Integrate lineup data so batter defaults originate from the assigned batting order.
- Expand runner decisions to handle complex plays (double plays, errors with RBI exceptions) once backend stat calculations land.
- Wire the mutation queue (Milestone 3) to broadcast stored plays upstream and reconcile conflicts using the event sequence number.
