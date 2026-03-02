'use client';

import React from 'react';
import { Alert, Box } from '@mui/material';
import type { GamePitchingStatLineType, GamePitchingStatsType } from '@draco/shared-schemas';

import StatisticsTable, { type StatsRowBase } from '../statistics/StatisticsTable';
import { pitchingViewFieldOrder, type PitchingViewField } from './pitchingColumns';
import { useSortableRows } from './tableUtils';

interface PitchingStatsViewTableProps {
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
}

type StatValue = number | string | null;

type PitchingTableRow = StatsRowBase & {
  id: string;
  playerName: string | null;
  ip?: number | null;
  ip2?: number | null;
};

const PitchingStatsViewTable: React.FC<PitchingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

  const getValue = (row: GamePitchingStatLineType, field: PitchingViewField) =>
    row[field as keyof GamePitchingStatLineType];

  const { sortedRows, sortConfig, handleSort } = useSortableRows(stats?.stats ?? [], getValue);

  const tableRows: PitchingTableRow[] = sortedRows.map((stat) => {
    const values: Partial<Record<PitchingViewField, StatValue>> = {};
    pitchingViewFieldOrder.forEach((field) => {
      if (field === 'playerNumber') {
        const numberValue = stat.playerNumber;
        values[field] = numberValue === null || numberValue === undefined ? null : numberValue;
      } else if (field === 'playerName') {
        values[field] = stat.playerName ?? null;
      } else {
        values[field] = (stat as Record<string, number | string | null | undefined>)[field] ?? null;
      }
    });

    const resolvedPlayerName = values.playerName;
    const resolvedPlayerNumber = values.playerNumber;

    return {
      ...(values as Record<string, StatValue>),
      id: stat.statId,
      playerName:
        typeof resolvedPlayerName === 'string' ? resolvedPlayerName : (stat.playerName ?? null),
      playerNumber:
        typeof resolvedPlayerNumber === 'number' || typeof resolvedPlayerNumber === 'string'
          ? resolvedPlayerNumber
          : null,
      ip: stat.ip ?? null,
      ip2: stat.ip2 ?? null,
      playerId: stat.playerId ?? null,
      contactId: stat.contactId ?? null,
    };
  });

  if (totals) {
    const totalsValues: Partial<Record<PitchingViewField, StatValue>> = {};
    pitchingViewFieldOrder.forEach((field) => {
      if (field === 'playerNumber') {
        totalsValues[field] = null;
      } else if (field === 'playerName') {
        totalsValues[field] = 'Totals';
      } else {
        totalsValues[field] =
          (totals as Record<string, number | string | null | undefined>)[field] ?? null;
      }
    });

    const totalsRow: PitchingTableRow = {
      ...(totalsValues as Record<string, StatValue>),
      id: 'totals',
      playerName: 'Totals',
      isTotals: true,
      ip: Number(totals.ip ?? 0),
      ip2: Number(totals.ip2 ?? 0),
      playerId: null,
      contactId: null,
    };

    tableRows.push(totalsRow);
  }

  const sortField = sortConfig?.key as keyof PitchingTableRow | undefined;
  const sortOrder = sortConfig?.direction ?? 'asc';

  const handleTableSort = (field: keyof PitchingTableRow) => {
    handleSort(field as PitchingViewField);
  };

  return (
    <Box>
      {!hasStats && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No pitching stats have been recorded for this game yet.
        </Alert>
      )}

      {tableRows.length > 0 && (
        <StatisticsTable
          variant="pitching"
          extendedStats
          data={tableRows}
          getRowKey={(row) => row.id}
          sortField={sortField ? String(sortField) : undefined}
          sortOrder={sortOrder}
          onSort={(field) => handleTableSort(field as keyof PitchingTableRow)}
          emptyMessage="No pitching statistics available for this game."
          playerLinkLabel="Game Pitching Stats"
        />
      )}
    </Box>
  );
};

export default PitchingStatsViewTable;
