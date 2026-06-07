'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import type { LineScoreSideType, LineScoreType, UpsertLineScoreType } from '@draco/shared-schemas';

import LineScoreTable, { getInningCount } from './LineScoreTable';

const MAX_INNINGS = 18;

export interface GameLineScoreSectionHandle {
  hasDirtyContent: () => boolean;
  saveContent: () => Promise<boolean>;
  discardContent: () => void;
}

interface GameLineScoreSectionProps {
  lineScore: LineScoreType | null;
  loading: boolean;
  error: string | null;
  editMode: boolean;
  canEdit: boolean;
  currentTeamSeasonId: string;
  canManageAllTeams: boolean;
  onSave: (payload: UpsertLineScoreType) => Promise<void>;
}

interface EditableSide {
  runsByInning: (number | null)[];
  errors: number | null;
  hitsOverride: number | null;
}

const toEditableSide = (side: LineScoreSideType): EditableSide => ({
  runsByInning: [...side.runsByInning],
  errors: side.errors,
  hitsOverride: side.hitsOverride,
});

const normalizeRuns = (runs: (number | null)[]): (number | null)[] => {
  let end = runs.length;
  while (end > 0 && (runs[end - 1] === null || runs[end - 1] === undefined)) {
    end -= 1;
  }
  return runs.slice(0, end);
};

const sideEquals = (current: EditableSide, baseline: LineScoreSideType): boolean =>
  JSON.stringify({
    runs: normalizeRuns(current.runsByInning),
    errors: current.errors,
    hitsOverride: current.hitsOverride,
  }) ===
  JSON.stringify({
    runs: normalizeRuns(baseline.runsByInning),
    errors: baseline.errors,
    hitsOverride: baseline.hitsOverride,
  });

const inningRunsSum = (runs: (number | null)[]): number =>
  runs.reduce((total: number, value) => total + (value ?? 0), 0);

const parseStatValue = (raw: string, max = 99): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(max, Math.max(0, parsed));
};

const toUpsertSide = (side: EditableSide): UpsertLineScoreType['home'] => ({
  runsByInning: normalizeRuns(side.runsByInning),
  errors: side.errors,
  hitsOverride: side.hitsOverride,
});

const GameLineScoreSection = forwardRef<GameLineScoreSectionHandle, GameLineScoreSectionProps>(
  (
    {
      lineScore,
      loading,
      error,
      editMode,
      canEdit,
      currentTeamSeasonId,
      canManageAllTeams,
      onSave,
    },
    ref,
  ) => {
    const theme = useTheme();

    const baselineHome = lineScore?.home ?? null;
    const baselineAway = lineScore?.away ?? null;

    const [home, setHome] = useState<EditableSide>(() =>
      baselineHome
        ? toEditableSide(baselineHome)
        : { runsByInning: [], errors: null, hitsOverride: null },
    );
    const [away, setAway] = useState<EditableSide>(() =>
      baselineAway
        ? toEditableSide(baselineAway)
        : { runsByInning: [], errors: null, hitsOverride: null },
    );
    const [inningCount, setInningCount] = useState<number>(() =>
      lineScore ? getInningCount(lineScore) : 7,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const homeDirty = baselineHome ? !sideEquals(home, baselineHome) : false;
    const awayDirty = baselineAway ? !sideEquals(away, baselineAway) : false;

    const isHomeYours = baselineHome?.teamSeasonId === currentTeamSeasonId;
    const isAwayYours = baselineAway?.teamSeasonId === currentTeamSeasonId;
    const homeEditable =
      canEdit && (isHomeYours || canManageAllTeams || !(baselineHome?.authoritative ?? false));
    const awayEditable =
      canEdit && (isAwayYours || canManageAllTeams || !(baselineAway?.authoritative ?? false));

    useImperativeHandle(ref, () => {
      const buildPayload = (): UpsertLineScoreType => {
        const payload: UpsertLineScoreType = {};
        if (homeEditable && homeDirty) {
          payload.home = toUpsertSide(home);
        }
        if (awayEditable && awayDirty) {
          payload.away = toUpsertSide(away);
        }
        return payload;
      };

      return {
        hasDirtyContent: () => homeDirty || awayDirty,
        saveContent: async (): Promise<boolean> => {
          setSaveError(null);
          const payload = buildPayload();
          if (!payload.home && !payload.away) {
            return true;
          }
          setIsSaving(true);
          try {
            await onSave(payload);
            return true;
          } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save line score.');
            return false;
          } finally {
            setIsSaving(false);
          }
        },
        discardContent: () => {
          setHome(
            baselineHome
              ? toEditableSide(baselineHome)
              : { runsByInning: [], errors: null, hitsOverride: null },
          );
          setAway(
            baselineAway
              ? toEditableSide(baselineAway)
              : { runsByInning: [], errors: null, hitsOverride: null },
          );
          setInningCount(lineScore ? getInningCount(lineScore) : 7);
          setSaveError(null);
        },
      };
    }, [
      home,
      away,
      homeDirty,
      awayDirty,
      homeEditable,
      awayEditable,
      onSave,
      baselineHome,
      baselineAway,
      lineScore,
    ]);

    if (loading) {
      return (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
        >
          <CircularProgress size={32} />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!lineScore || !baselineHome || !baselineAway) {
      return <Alert severity="info">Line score is unavailable for this game.</Alert>;
    }

    if (!editMode) {
      return (
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Line Score</Typography>
            <Typography variant="body2" color="text.secondary">
              {canEdit
                ? 'Enable edit mode to modify the line score.'
                : 'Runs by inning for this game.'}
            </Typography>
          </Stack>
          <LineScoreTable lineScore={lineScore} />
        </Stack>
      );
    }

    const innings = Array.from({ length: inningCount }, (_, index) => index + 1);

    const setInningValue = (side: 'home' | 'away', inningIndex: number, rawValue: string) => {
      const value = parseStatValue(rawValue);
      const setter = side === 'home' ? setHome : setAway;
      setter((previous) => {
        const nextRuns = [...previous.runsByInning];
        while (nextRuns.length <= inningIndex) {
          nextRuns.push(null);
        }
        nextRuns[inningIndex] = value;
        return { ...previous, runsByInning: nextRuns };
      });
    };

    const setErrorsValue = (side: 'home' | 'away', rawValue: string) => {
      const value = parseStatValue(rawValue);
      const setter = side === 'home' ? setHome : setAway;
      setter((previous) => ({ ...previous, errors: value }));
    };

    const setHitsOverrideValue = (side: 'home' | 'away', rawValue: string) => {
      const value = parseStatValue(rawValue, 999);
      const setter = side === 'home' ? setHome : setAway;
      setter((previous) => ({ ...previous, hitsOverride: value }));
    };

    const renderEditableRow = (
      sideKey: 'home' | 'away',
      sideState: EditableSide,
      baseline: LineScoreSideType,
      editable: boolean,
    ) => {
      const derivedHitsAvailable = baseline.hitsOverride === null && baseline.hits !== null;
      const sumMismatch = inningRunsSum(sideState.runsByInning) !== baseline.runs;

      return (
        <TableRow>
          <TableCell
            component="th"
            scope="row"
            sx={{ fontWeight: 600, whiteSpace: 'nowrap', borderRight: 1, borderColor: 'divider' }}
          >
            {baseline.teamName || (sideKey === 'home' ? 'Home' : 'Away')}
            {!editable && (
              <Typography variant="caption" display="block" color="text.secondary">
                Entered by this team
              </Typography>
            )}
          </TableCell>
          {innings.map((inning, inningIndex) => (
            <TableCell key={inning} align="center" sx={{ px: 0.5 }}>
              <TextField
                value={sideState.runsByInning[inningIndex] ?? ''}
                onChange={(event) => setInningValue(sideKey, inningIndex, event.target.value)}
                disabled={!editable || isSaving}
                size="small"
                inputProps={{
                  inputMode: 'numeric',
                  style: { textAlign: 'center', padding: '4px', width: 28 },
                  'aria-label': `${baseline.teamName} inning ${inning} runs`,
                }}
                variant="standard"
              />
            </TableCell>
          ))}
          <TableCell
            align="center"
            sx={{ fontWeight: 700, borderLeft: 1, borderColor: 'divider' }}
            title={sumMismatch ? 'Inning runs do not add up to the final score' : undefined}
          >
            {baseline.runs}
            {sumMismatch && <span style={{ color: theme.palette.warning.main }}> *</span>}
          </TableCell>
          <TableCell align="center" sx={{ px: 0.5 }}>
            {derivedHitsAvailable ? (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {baseline.hits}
              </Typography>
            ) : (
              <TextField
                value={sideState.hitsOverride ?? ''}
                onChange={(event) => setHitsOverrideValue(sideKey, event.target.value)}
                disabled={!editable || isSaving}
                size="small"
                inputProps={{
                  inputMode: 'numeric',
                  style: { textAlign: 'center', padding: '4px', width: 28 },
                  'aria-label': `${baseline.teamName} hits`,
                }}
                variant="standard"
              />
            )}
          </TableCell>
          <TableCell align="center" sx={{ px: 0.5 }}>
            <TextField
              value={sideState.errors ?? ''}
              onChange={(event) => setErrorsValue(sideKey, event.target.value)}
              disabled={!editable || isSaving}
              size="small"
              inputProps={{
                inputMode: 'numeric',
                style: { textAlign: 'center', padding: '4px', width: 28 },
                'aria-label': `${baseline.teamName} errors`,
              }}
              variant="standard"
            />
          </TableCell>
        </TableRow>
      );
    };

    const showSumWarning =
      inningRunsSum(home.runsByInning) !== baselineHome.runs ||
      inningRunsSum(away.runsByInning) !== baselineAway.runs;

    return (
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Line Score</Typography>
          <Typography variant="body2" color="text.secondary">
            Enter runs per inning. Total runs come from the final score; hits are derived from
            batting stats when available.
          </Typography>
        </Stack>

        <TableContainer
          sx={{
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: theme.palette.background.paper,
            overflowX: 'auto',
          }}
        >
          <Table size="small" aria-label="Line score entry">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }} />
                {innings.map((inning) => (
                  <TableCell key={inning} align="center" sx={{ px: 0.5, fontWeight: 600 }}>
                    {inning}
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, borderLeft: 1, borderColor: 'divider' }}
                >
                  R
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  H
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  E
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderEditableRow('away', away, baselineAway, awayEditable)}
              {renderEditableRow('home', home, baselineHome, homeEditable)}
            </TableBody>
          </Table>
        </TableContainer>

        <Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setInningCount((count) => Math.min(MAX_INNINGS, count + 1))}
            disabled={isSaving || (!homeEditable && !awayEditable) || inningCount >= MAX_INNINGS}
          >
            Add inning
          </Button>
        </Box>

        {showSumWarning && (
          <Alert severity="warning">
            The runs entered by inning don’t add up to the final score. The line score will still
            save — this is just a reminder to double-check the innings.
          </Alert>
        )}

        {saveError && <Alert severity="error">{saveError}</Alert>}
      </Stack>
    );
  },
);

GameLineScoreSection.displayName = 'GameLineScoreSection';

export default GameLineScoreSection;
