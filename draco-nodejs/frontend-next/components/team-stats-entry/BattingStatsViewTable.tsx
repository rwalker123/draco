'use client';

import React, { useCallback, useMemo } from 'react';
import { Alert, Box } from '@mui/material';
import type { GameBattingStatLineType, GameBattingStatsType } from '@draco/shared-schemas';

import StatisticsTable, { type StatsRowBase } from '../statistics/StatisticsTable';
import { battingViewFieldOrder, type BattingViewField } from './battingColumns';
import { useSortableRows } from './tableUtils';

interface BattingStatsViewTableProps {
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
}

type BattingTableRow = StatsRowBase & { id: string };

const BattingStatsViewTable: React.FC<BattingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

  const getValue = useCallback(
    (row: GameBattingStatLineType, field: BattingViewField) =>
      row[field as keyof GameBattingStatLineType],
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows(stats?.stats ?? [], getValue);

  const tableRows = useMemo<BattingTableRow[]>(() => {
    const rows = sortedRows.map((stat) => {
      const row: BattingTableRow = {
        id: stat.statId,
        playerName: stat.playerName ?? null,
        playerNumber: stat.playerNumber ?? null,
        playerId: stat.playerId ?? null,
        contactId: stat.contactId ?? null,
      };

      battingViewFieldOrder.forEach((field) => {
        if (field === 'playerNumber') {
          row.playerNumber = stat.playerNumber ?? null;
        } else if (field === 'playerName') {
          row.playerName = stat.playerName ?? null;
        } else {
          row[field] = ((stat as Record<string, number | string | null | undefined>)[field] ??
            null) as number | string | null;
        }
      });

      return row;
    });

    if (totals) {
      const totalsRow: BattingTableRow = {
        id: 'totals',
        playerName: 'Totals',
        playerNumber: null,
        isTotals: true,
        playerId: null,
        contactId: null,
      };

      battingViewFieldOrder.forEach((field) => {
        if (field === 'playerNumber') {
          totalsRow.playerNumber = null;
        } else if (field === 'playerName') {
          totalsRow.playerName = 'Totals';
        } else {
          totalsRow[field] = ((totals as Record<string, number | string | null | undefined>)[
            field
          ] ?? null) as number | string | null;
        }
      });

      rows.push(totalsRow);
    }

    return rows;
  }, [sortedRows, totals]);

  const sortField = sortConfig?.key as keyof BattingTableRow | undefined;
  const sortOrder = sortConfig?.direction ?? 'asc';

  const handleTableSort = useCallback(
    (field: keyof BattingTableRow) => {
      handleSort(field as BattingViewField);
    },
    [handleSort],
  );

  return (
    <Box>
      {!hasStats && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No batting stats have been recorded for this game yet.
        </Alert>
      )}

      {tableRows.length > 0 && (
        <StatisticsTable
          variant="batting"
          extendedStats
          data={tableRows}
          getRowKey={(row) => row.id}
          sortField={sortField ? String(sortField) : undefined}
          sortOrder={sortOrder}
          onSort={(field) => handleTableSort(field as keyof BattingTableRow)}
          emptyMessage="No batting statistics available for this game."
          playerLinkLabel="Game Batting Stats"
        />
      )}
    </Box>
  );
};

export default BattingStatsViewTable;
