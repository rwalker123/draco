'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import type {
  CreateGamePitchingStatType,
  GamePitchingStatLineType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
  UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

import type {
  EditableGridHandle,
  GameOutcome,
  UnsavedChangesDecision,
  UnsavedChangesPrompt,
} from './types';
import PitchingStatsEditableGrid from './PitchingStatsEditableGrid';
import PitchingStatsViewTable from './PitchingStatsViewTable';

type Mode = 'view' | 'edit';

interface PitchingStatsSectionProps {
  mode: Mode;
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onCreateStat?: (payload: CreateGamePitchingStatType) => Promise<void>;
  onUpdateStat?: (statId: string, payload: UpdateGamePitchingStatType) => Promise<void>;
  onDeleteStat?: (stat: GamePitchingStatLineType) => void;
  onProcessError?: (error: Error) => void;
  onRequestUnsavedDecision?: (prompt: UnsavedChangesPrompt) => Promise<UnsavedChangesDecision>;
  onDirtyStateChange?: (hasDirtyRow: boolean) => void;
  gridRef?: React.Ref<EditableGridHandle>;
  showViewSeason?: boolean;
  onViewSeason?: () => void;
  gameOutcome?: GameOutcome;
}

const PitchingStatsSection: React.FC<PitchingStatsSectionProps> = ({
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
  gameOutcome,
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
      <PitchingStatsEditableGrid
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
        gameOutcome={gameOutcome}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Pitching Statistics
      </Typography>
      <PitchingStatsViewTable stats={stats} totals={totals} />
    </Box>
  );
};

export default PitchingStatsSection;
