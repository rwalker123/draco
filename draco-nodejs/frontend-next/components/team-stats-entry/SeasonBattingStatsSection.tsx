'use client';

import React, { useCallback, useMemo } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import type { PlayerBattingStatsType } from '@draco/shared-schemas';

import { useSortableRows } from './tableUtils';
import StatisticsTable, { type StatsRowBase } from '../statistics/StatisticsTable';

const seasonColumnKeys = [
  'playerName',
  'ab',
  'h',
  'r',
  'd',
  't',
  'hr',
  'rbi',
  'bb',
  'so',
  'hbp',
  'sb',
  'sf',
  'sh',
  'tb',
  'pa',
  'avg',
  'obp',
  'slg',
  'ops',
] as const;

type SeasonBattingColumnKey = (typeof seasonColumnKeys)[number];

type StatValue = number | string | null;

type SeasonBattingRow = StatsRowBase & {
  id: string;
  playerName: string | null;
};

interface SeasonBattingStatsSectionProps {
  stats: PlayerBattingStatsType[] | null;
}

const getColumnValue = (
  stat: PlayerBattingStatsType,
  key: SeasonBattingColumnKey,
): number | string | null | undefined => {
  if (key === 'playerName') {
    return stat.playerName;
  }

  if (key === 'ops') {
    return stat.ops;
  }

  return stat[key as keyof PlayerBattingStatsType] as number | string | null | undefined;
};

const SeasonBattingStatsSection: React.FC<SeasonBattingStatsSectionProps> = ({ stats }) => {
  const getValue = useCallback(
    (row: PlayerBattingStatsType, key: SeasonBattingColumnKey) => getColumnValue(row, key),
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows<
    PlayerBattingStatsType,
    SeasonBattingColumnKey
  >(stats ?? [], getValue);

  const totals = useMemo(() => {
    if (!stats || stats.length === 0) {
      return null;
    }

    const aggregate = stats.reduce(
      (acc, current) => {
        acc.ab += current.ab;
        acc.h += current.h;
        acc.r += current.r;
        acc.d += current.d;
        acc.t += current.t;
        acc.hr += current.hr;
        acc.rbi += current.rbi;
        acc.bb += current.bb;
        acc.so += current.so;
        acc.hbp += current.hbp;
        acc.sb += current.sb;
        acc.sf += current.sf;
        acc.sh += current.sh;
        acc.tb += current.tb;
        acc.pa += current.pa;
        return acc;
      },
      {
        ab: 0,
        h: 0,
        r: 0,
        d: 0,
        t: 0,
        hr: 0,
        rbi: 0,
        bb: 0,
        so: 0,
        hbp: 0,
        sb: 0,
        sf: 0,
        sh: 0,
        tb: 0,
        pa: 0,
      },
    );

    const avg = aggregate.ab > 0 ? aggregate.h / aggregate.ab : null;
    const obpDenominator = aggregate.ab + aggregate.bb + aggregate.hbp + aggregate.sf;
    const obp =
      obpDenominator > 0 ? (aggregate.h + aggregate.bb + aggregate.hbp) / obpDenominator : null;
    const slg = aggregate.ab > 0 ? aggregate.tb / aggregate.ab : null;
    const ops = obp !== null && slg !== null ? obp + slg : null;

    return {
      ...aggregate,
      avg,
      obp,
      slg,
      ops,
    } as Record<string, number | string | null>;
  }, [stats]);

  const tableRows = useMemo<SeasonBattingRow[]>(() => {
    const rows = sortedRows.map((stat) => {
      const values: Partial<Record<SeasonBattingColumnKey, StatValue>> = {};
      seasonColumnKeys.forEach((key) => {
        if (key === 'playerName') {
          values[key] = stat.playerName ?? null;
        } else {
          const raw = (stat as Record<string, unknown>)[key];
          if (typeof raw === 'number' || typeof raw === 'string') {
            values[key] = raw;
          } else if (raw === null || raw === undefined) {
            values[key] = null;
          } else {
            values[key] = null;
          }
        }
      });

      const resolvedPlayerName = values.playerName;
      const id =
        stat.playerId !== undefined && stat.playerId !== null && stat.playerId !== ''
          ? String(stat.playerId)
          : (stat.playerName ?? undefined ?? `player-${stat.playerId ?? 'unknown'}`);

      const row: SeasonBattingRow = {
        ...(values as Record<string, StatValue>),
        id,
        playerName:
          typeof resolvedPlayerName === 'string' ? resolvedPlayerName : (stat.playerName ?? null),
      };

      return row;
    });

    if (totals) {
      const totalsValues: Partial<Record<SeasonBattingColumnKey, StatValue>> = {};
      seasonColumnKeys.forEach((key) => {
        if (key === 'playerName') {
          totalsValues[key] = 'Totals';
        } else {
          const raw = totals[key];
          if (typeof raw === 'number' || typeof raw === 'string') {
            totalsValues[key] = raw;
          } else if (raw === null || raw === undefined) {
            totalsValues[key] = null;
          } else {
            totalsValues[key] = null;
          }
        }
      });

      const totalsRow: SeasonBattingRow = {
        ...(totalsValues as Record<string, StatValue>),
        id: 'totals',
        playerName: 'Totals',
        isTotals: true,
      };

      rows.push(totalsRow);
    }

    return rows;
  }, [sortedRows, totals]);

  const sortField = sortConfig?.key as keyof SeasonBattingRow | undefined;
  const sortOrder = sortConfig?.direction ?? 'asc';

  const handleTableSort = useCallback(
    (field: keyof SeasonBattingRow) => {
      handleSort(field as SeasonBattingColumnKey);
    },
    [handleSort],
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Season Batting Totals
      </Typography>

      {!stats || stats.length === 0 ? (
        <Alert severity="info">No batting statistics have been recorded for this season yet.</Alert>
      ) : (
        <StatisticsTable
          variant="batting"
          extendedStats={false}
          data={tableRows}
          getRowKey={(row) => row.id}
          sortField={sortField ? String(sortField) : undefined}
          sortOrder={sortOrder}
          onSort={(field) => handleTableSort(field as keyof SeasonBattingRow)}
          emptyMessage="No batting statistics available for this season."
        />
      )}
    </Box>
  );
};

export default SeasonBattingStatsSection;
