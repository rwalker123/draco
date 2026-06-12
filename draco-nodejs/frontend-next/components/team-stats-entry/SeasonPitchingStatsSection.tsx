'use client';

import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import type { PlayerPitchingStatsType } from '@draco/shared-schemas';

import { useSortableRows } from './tableUtils';
import StatisticsTable, { type StatsRowBase } from '../statistics/StatisticsTable';

const seasonColumnKeys = [
  'playerName',
  'ipDecimal',
  'w',
  'l',
  's',
  'h',
  'r',
  'er',
  'd',
  't',
  'hr',
  'so',
  'bb',
  'bf',
  'wp',
  'hbp',
  'bk',
  'sc',
  'era',
  'whip',
  'k9',
  'bb9',
  'oba',
  'slg',
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

const computePitchingTotals = (
  stats: PlayerPitchingStatsType[] | null,
): Record<string, number | string | null> | null => {
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
      acc.d += current.d ?? 0;
      acc.t += current.t ?? 0;
      acc.bf += current.bf;
      acc.wp += current.wp;
      acc.hbp += current.hbp;
      acc.bk += current.bk ?? 0;
      acc.sc += current.sc ?? 0;
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
      d: 0,
      t: 0,
      bf: 0,
      wp: 0,
      hbp: 0,
      bk: 0,
      sc: 0,
    },
  );

  const innings = aggregate.ipDecimal;
  const era = innings > 0 ? (aggregate.er * 9) / innings : null;
  const whip = innings > 0 ? (aggregate.bb + aggregate.h) / innings : null;
  const k9 = innings > 0 ? (aggregate.so * 9) / innings : null;
  const bb9 = innings > 0 ? (aggregate.bb * 9) / innings : null;
  const opponentAtBats = aggregate.bf - aggregate.bb - aggregate.hbp - aggregate.sc;
  const oba = opponentAtBats > 0 ? aggregate.h / opponentAtBats : null;
  const totalBasesAgainst =
    aggregate.d * 2 +
    aggregate.t * 3 +
    aggregate.hr * 4 +
    (aggregate.h - aggregate.d - aggregate.t - aggregate.hr);
  const slg = opponentAtBats > 0 ? totalBasesAgainst / opponentAtBats : null;

  return {
    ...aggregate,
    era,
    whip,
    k9,
    bb9,
    oba,
    slg,
  } as Record<string, number | string | null>;
};

const SeasonPitchingStatsSection: React.FC<SeasonPitchingStatsSectionProps> = ({ stats }) => {
  const getValue = (row: PlayerPitchingStatsType, key: SeasonPitchingColumnKey) =>
    getColumnValue(row, key);

  const { sortedRows, sortConfig, handleSort } = useSortableRows<
    PlayerPitchingStatsType,
    SeasonPitchingColumnKey
  >(stats ?? [], getValue);

  const totals = computePitchingTotals(stats);

  const tableRows: SeasonPitchingRow[] = sortedRows.map((stat) => {
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
      stat.contactId !== undefined && stat.contactId !== null && stat.contactId !== ''
        ? String(stat.contactId)
        : (stat.playerName ?? `player-${stat.contactId ?? 'unknown'}`);

    return {
      ...(values as Record<string, StatValue>),
      id,
      playerName:
        typeof resolvedPlayerName === 'string' ? resolvedPlayerName : (stat.playerName ?? null),
      ip: stat.ip ?? null,
      ip2: stat.ip2 ?? null,
      contactId: stat.contactId ?? null,
    };
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
      contactId: null,
    };

    tableRows.push(totalsRow);
  }

  const sortField = sortConfig?.key as keyof SeasonPitchingRow | undefined;
  const sortOrder = sortConfig?.direction ?? 'asc';

  const handleTableSort = (field: keyof SeasonPitchingRow) => {
    handleSort(field as SeasonPitchingColumnKey);
  };

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
          extendedStats
          omitFields={['playerNumber']}
          data={tableRows}
          getRowKey={(row) => row.id}
          sortField={sortField ? String(sortField) : undefined}
          sortOrder={sortOrder}
          onSort={(field) => handleTableSort(field as keyof SeasonPitchingRow)}
          emptyMessage="No pitching statistics available for this season."
          playerLinkLabel="Season Pitching Stats"
        />
      )}
    </Box>
  );
};

export default SeasonPitchingStatsSection;
