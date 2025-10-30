'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import type {
  CreateGameBattingStatType,
  GameBattingStatsType,
  TeamStatsPlayerSummaryType,
  UpdateGameBattingStatType,
  GameBattingStatLineType,
} from '@draco/shared-schemas';

import type { EditableGridHandle, UnsavedChangesDecision, UnsavedChangesPrompt } from './types';
import BattingStatsEditableGrid from './BattingStatsEditableGrid';
import BattingStatsViewTable from './BattingStatsViewTable';

type Mode = 'view' | 'edit';

interface BattingStatsSectionProps {
  mode: Mode;
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onCreateStat?: (payload: CreateGameBattingStatType) => Promise<void>;
  onUpdateStat?: (statId: string, payload: UpdateGameBattingStatType) => Promise<void>;
  onDeleteStat?: (stat: GameBattingStatLineType) => void;
  onProcessError?: (error: Error) => void;
  onRequestUnsavedDecision?: (prompt: UnsavedChangesPrompt) => Promise<UnsavedChangesDecision>;
  onDirtyStateChange?: (hasDirtyRow: boolean) => void;
  gridRef?: React.Ref<EditableGridHandle>;
  showViewSeason?: boolean;
  onViewSeason?: () => void;
}

const BattingStatsSection: React.FC<BattingStatsSectionProps> = ({
  mode,
  stats,
  totals,
  availablePlayers,
  onCreateStat,
  onUpdateStat,
  onDeleteStat,
  onProcessError,
  onRequestUnsavedDecision,
  onDirtyStateChange,
  gridRef,
  showViewSeason,
  onViewSeason,
}) => {
  if (
    mode === 'edit' &&
    stats &&
    onCreateStat &&
    onUpdateStat &&
    onDeleteStat &&
    onProcessError &&
    onRequestUnsavedDecision
  ) {
    return (
      <BattingStatsEditableGrid
        ref={gridRef}
        stats={stats}
        totals={totals ?? null}
        availablePlayers={availablePlayers}
        onCreateStat={onCreateStat}
        onUpdateStat={onUpdateStat}
        onDeleteStat={onDeleteStat}
        onProcessError={onProcessError}
        onRequestUnsavedDecision={onRequestUnsavedDecision}
        onDirtyStateChange={onDirtyStateChange}
        showViewSeason={showViewSeason}
        onViewSeason={onViewSeason}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Batting Statistics
      </Typography>
      <BattingStatsViewTable stats={stats} totals={totals} />
    </Box>
  );
};

export default BattingStatsSection;
