'use client';

import React, { useCallback, useMemo } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import type { PlayerPitchingStatsType } from '@draco/shared-schemas';

import { useSortableRows } from './tableUtils';
import StatisticsTable, { type StatsRowBase } from '../statistics/StatisticsTable';

const seasonColumnKeys = [
  'playerName',
  'w',
  'l',
  's',
  'ipDecimal',
  'h',
  'r',
  'er',
  'bb',
  'so',
  'hr',
  'era',
  'whip',
  'k9',
  'bb9',
] as const;

type SeasonPitchingColumnKey = (typeof seasonColumnKeys)[number];

type StatValue = number | string | null;

type SeasonPitchingRow = StatsRowBase & {
  id: string;
  playerName: string | null;
};

interface SeasonPitchingStatsSectionProps {
  stats: PlayerPitchingStatsType[] | null;
}

const getColumnValue = (
  stat: PlayerPitchingStatsType,
  key: SeasonPitchingColumnKey,
): number | string | null | undefined => {
  if (key === 'playerName') {
    return stat.playerName;
  }

  return stat[key as keyof PlayerPitchingStatsType] as number | string | null | undefined;
};

const SeasonPitchingStatsSection: React.FC<SeasonPitchingStatsSectionProps> = ({ stats }) => {
  const getValue = useCallback(
    (row: PlayerPitchingStatsType, key: SeasonPitchingColumnKey) => getColumnValue(row, key),
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows<
    PlayerPitchingStatsType,
    SeasonPitchingColumnKey
  >(stats ?? [], getValue);

  const totals = useMemo(() => {
    if (!stats || stats.length === 0) {
      return null;
    }

    const aggregate = stats.reduce(
      (acc, current) => {
        acc.w += current.w;
        acc.l += current.l;
        acc.s += current.s;
        acc.ip += current.ip;
        acc.ip2 += current.ip2;
        acc.ipDecimal += current.ipDecimal;
        acc.h += current.h;
        acc.r += current.r;
        acc.er += current.er;
        acc.bb += current.bb;
        acc.so += current.so;
        acc.hr += current.hr;
        return acc;
      },
      {
        w: 0,
        l: 0,
        s: 0,
        ip: 0,
        ip2: 0,
        ipDecimal: 0,
        h: 0,
        r: 0,
        er: 0,
        bb: 0,
        so: 0,
        hr: 0,
      },
    );

    const innings = aggregate.ipDecimal;
    const era = innings > 0 ? (aggregate.er * 9) / innings : null;
    const whip = innings > 0 ? (aggregate.bb + aggregate.h) / innings : null;
    const k9 = innings > 0 ? (aggregate.so * 9) / innings : null;
    const bb9 = innings > 0 ? (aggregate.bb * 9) / innings : null;

    return {
      ...aggregate,
      era,
      whip,
      k9,
      bb9,
    } as Record<string, number | string | null>;
  }, [stats]);

  const tableRows = useMemo<SeasonPitchingRow[]>(() => {
    const rows = sortedRows.map((stat) => {
      const values: Partial<Record<SeasonPitchingColumnKey, StatValue>> = {};
      seasonColumnKeys.forEach((key) => {
        if (key === 'playerName') {
          values[key] = stat.playerName ?? null;
        } else if (key === 'ipDecimal') {
          values[key] = stat.ipDecimal;
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
          : (stat.playerName ?? `player-${stat.playerId ?? 'unknown'}`);

      const row: SeasonPitchingRow = {
        ...(values as Record<string, StatValue>),
        id,
        playerName:
          typeof resolvedPlayerName === 'string' ? resolvedPlayerName : (stat.playerName ?? null),
        ip: stat.ip ?? null,
        ip2: stat.ip2 ?? null,
      };

      return row;
    });

    if (totals) {
      const totalsValues: Partial<Record<SeasonPitchingColumnKey, StatValue>> = {};
      seasonColumnKeys.forEach((key) => {
        if (key === 'playerName') {
          totalsValues[key] = 'Totals';
        } else {
          const raw = totals[key];
          totalsValues[key] = typeof raw === 'number' || typeof raw === 'string' ? raw : null;
        }
      });

      const totalsRow: SeasonPitchingRow = {
        ...(totalsValues as Record<string, StatValue>),
        id: 'totals',
        playerName: 'Totals',
        isTotals: true,
        ip: Number(totals.ip ?? 0),
        ip2: Number(totals.ip2 ?? 0),
      };

      rows.push(totalsRow);
    }

    return rows;
  }, [sortedRows, totals]);

  const sortField = sortConfig?.key as keyof SeasonPitchingRow | undefined;
  const sortOrder = sortConfig?.direction ?? 'asc';

  const handleTableSort = useCallback(
    (field: keyof SeasonPitchingRow) => {
      handleSort(field as SeasonPitchingColumnKey);
    },
    [handleSort],
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Season Pitching Totals
      </Typography>

      {!stats || stats.length === 0 ? (
        <Alert severity="info">
          No pitching statistics have been recorded for this season yet.
        </Alert>
      ) : (
        <StatisticsTable
          variant="pitching"
          extendedStats={false}
          data={tableRows}
          getRowKey={(row) => row.id}
          sortField={sortField ? String(sortField) : undefined}
          sortOrder={sortOrder}
          onSort={(field) => handleTableSort(field as keyof SeasonPitchingRow)}
          emptyMessage="No pitching statistics available for this season."
        />
      )}
    </Box>
  );
};

export default SeasonPitchingStatsSection;
