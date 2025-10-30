'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Add, Check, Close, Delete } from '@mui/icons-material';
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridPreProcessEditCellProps,
  GridRenderCellParams,
  useGridApiRef,
} from '@mui/x-data-grid';
import type {
  CreateGamePitchingStatType,
  GamePitchingStatLineType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
  UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

import { formatInnings, formatStatDecimal } from './utils';
import type {
  EditableGridHandle,
  GameOutcome,
  UnsavedChangesDecision,
  UnsavedChangesPrompt,
  UnsavedChangesReason,
} from './types';
import {
  editablePitchingFields as editableFields,
  type EditablePitchingField,
  type PitchingSummaryField,
  PITCHING_FIELD_LABELS,
} from './pitchingColumns';

interface PitchingStatsEditableGridProps {
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onCreateStat: (payload: CreateGamePitchingStatType) => Promise<void>;
  onUpdateStat: (statId: string, payload: UpdateGamePitchingStatType) => Promise<void>;
  onDeleteStat: (stat: GamePitchingStatLineType) => void;
  onProcessError: (error: Error) => void;
  showViewSeason?: boolean;
  onViewSeason?: () => void;
  onRequestUnsavedDecision?: (prompt: UnsavedChangesPrompt) => Promise<UnsavedChangesDecision>;
  onDirtyStateChange?: (hasDirtyRow: boolean) => void;
  gameOutcome?: GameOutcome;
}

type PitchingRow = GamePitchingStatLineType & { id: string };

const buildRow = (line: GamePitchingStatLineType): PitchingRow => ({
  ...line,
  id: line.statId,
});

const buildNonNegativePreProcessor = (allowDecimal: boolean) =>
  function preProcessEditCellProps(params: GridPreProcessEditCellProps) {
    const { value } = params.props;
    if (value === '' || value === null || value === undefined) {
      return { ...params.props, value: allowDecimal ? 0 : 0, error: false };
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return { ...params.props, error: true };
    }

    const processedValue = allowDecimal ? numeric : Math.trunc(numeric);
    return { ...params.props, value: processedValue, error: false };
  };

const EMPTY_PITCHING_ROSTER_SEASON_ID = '' satisfies string;
const NEW_ROW_ID = 'pitching-new-row';
const TOTALS_ROW_ID = 'pitching-totals-row';

const emptyPitchingNewRow: CreateGamePitchingStatType = {
  rosterSeasonId: EMPTY_PITCHING_ROSTER_SEASON_ID,
  ipDecimal: 0,
  w: 0,
  l: 0,
  s: 0,
  h: 0,
  r: 0,
  er: 0,
  d: 0,
  t: 0,
  hr: 0,
  so: 0,
  bb: 0,
  bf: 0,
  wp: 0,
  hbp: 0,
  bk: 0,
  sc: 0,
};

type PitchingNewRow = {
  id: typeof NEW_ROW_ID;
  isNew: true;
  playerName: string;
  playerNumber: number | null;
  rosterSeasonId: string;
} & Record<EditablePitchingField, number>;

type PitchingTotalsRow = {
  id: typeof TOTALS_ROW_ID;
  isTotals: true;
  playerName: string;
  playerNumber: null;
} & Record<EditablePitchingField | PitchingSummaryField, number>;

type PitchingGridRow = PitchingRow | PitchingNewRow | PitchingTotalsRow;

const getNumericPitchingFieldValue = (
  row: PitchingGridRow | undefined,
  field: EditablePitchingField,
): number | null => {
  if (!row) {
    return null;
  }
  const rawValue = row[field];
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  return Number.isNaN(numeric) ? null : numeric;
};

type OutcomeRowInput = {
  id: string;
  playerName?: string | null;
  w?: number | null;
  l?: number | null;
  s?: number | null;
};

type OutcomeRow = {
  id: string;
  playerName: string;
  w: number;
  l: number;
  s: number;
};

const toOutcomeRow = (row: OutcomeRowInput): OutcomeRow => {
  const normalize = (value: number | null | undefined): number => {
    if (value === null || value === undefined) {
      return 0;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return numeric;
  };

  return {
    id: row.id,
    playerName: row.playerName?.trim() || 'Unnamed pitcher',
    w: normalize(row.w),
    l: normalize(row.l),
    s: normalize(row.s),
  };
};

const describePlayers = (entries: OutcomeRow[]): string =>
  entries.map((entry) => entry.playerName).join(', ');

const validatePitchingOutcomes = (
  rows: OutcomeRowInput[],
  gameOutcome: GameOutcome | undefined,
): void => {
  const normalizedRows = rows.map(toOutcomeRow);
  const assignments = {
    w: [] as OutcomeRow[],
    l: [] as OutcomeRow[],
    s: [] as OutcomeRow[],
  };

  normalizedRows.forEach((row) => {
    (['w', 'l', 's'] as const).forEach((field) => {
      const label = PITCHING_FIELD_LABELS[field];
      const value = row[field];
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be a non-negative whole number for ${row.playerName}.`);
      }
      if (!Number.isInteger(value)) {
        throw new Error(`${label} must be a whole number for ${row.playerName}.`);
      }
      if (value > 1) {
        throw new Error(`${label} can only be 0 or 1 for ${row.playerName}.`);
      }
      if (value === 1) {
        assignments[field].push(row);
      }
    });

    if (row.w === 1 && row.s === 1) {
      throw new Error(
        `${row.playerName} cannot be credited with both a ${PITCHING_FIELD_LABELS.w} and a ${PITCHING_FIELD_LABELS.s}.`,
      );
    }
  });

  if (assignments.w.length > 1) {
    throw new Error(
      `Only one pitcher can be assigned a ${PITCHING_FIELD_LABELS.w}. Currently assigned to ${describePlayers(
        assignments.w,
      )}.`,
    );
  }
  if (assignments.l.length > 1) {
    throw new Error(
      `Only one pitcher can be assigned a ${PITCHING_FIELD_LABELS.l}. Currently assigned to ${describePlayers(
        assignments.l,
      )}.`,
    );
  }
  if (assignments.s.length > 1) {
    throw new Error(
      `Only one pitcher can be assigned a ${PITCHING_FIELD_LABELS.s}. Currently assigned to ${describePlayers(
        assignments.s,
      )}.`,
    );
  }

  if (!gameOutcome) {
    return;
  }

  if (gameOutcome === 'win') {
    if (assignments.l.length > 0) {
      throw new Error('Cannot assign a loss to your team in a game they won.');
    }
    return;
  }

  if (gameOutcome === 'loss') {
    if (assignments.w.length > 0) {
      throw new Error('Cannot assign a win to your team in a game they lost.');
    }
    if (assignments.s.length > 0) {
      throw new Error('A save can only be recorded when the team wins.');
    }
    return;
  }

  // tie
  if (assignments.w.length > 0 || assignments.l.length > 0) {
    throw new Error('Wins and losses cannot be recorded for a tied game.');
  }
  if (assignments.s.length > 0) {
    throw new Error('A save can only be recorded when the team wins.');
  }
};

const mapRowsToOutcomeInputs = (rows: PitchingRow[]): OutcomeRowInput[] =>
  rows.map((row) => ({
    id: row.id,
    playerName: row.playerName,
    w: Number(row.w ?? 0),
    l: Number(row.l ?? 0),
    s: Number(row.s ?? 0),
  }));

const PitchingStatsEditableGrid = forwardRef<
  EditableGridHandle | null,
  PitchingStatsEditableGridProps
>(
  (
    {
      stats,
      totals,
      availablePlayers,
      onCreateStat,
      onUpdateStat,
      onDeleteStat,
      onProcessError,
      gameOutcome = null,
      showViewSeason = false,
      onViewSeason,
      onRequestUnsavedDecision,
      onDirtyStateChange,
    },
    ref,
  ) => {
    const rows = useMemo(() => stats?.stats.map(buildRow) ?? [], [stats]);
    const apiRef = useGridApiRef();
    const originalRowsRef = useRef<Map<string, PitchingRow>>(new Map());

    const [rowsState, setRowsState] = useState<PitchingRow[]>(rows);
    const [dirtyRowId, setDirtyRowId] = useState<string | null>(null);
    const [dirtyFields, setDirtyFields] = useState<EditablePitchingField[]>([]);

    useEffect(() => {
      const map = new Map<string, PitchingRow>();
      rows.forEach((row) => map.set(row.id, row));
      originalRowsRef.current = map;

      setRowsState((previous) => {
        if (!dirtyRowId) {
          return rows;
        }

        const dirty = previous.find((row) => row.id === dirtyRowId);
        return rows.map((row) => (row.id === dirtyRowId && dirty ? dirty : row));
      });

      if (dirtyRowId && !map.has(dirtyRowId)) {
        setDirtyRowId(null);
        setDirtyFields([]);
      }
    }, [rows, dirtyRowId]);

    useEffect(() => {
      onDirtyStateChange?.(Boolean(dirtyRowId));
    }, [dirtyRowId, onDirtyStateChange]);

    const computeDirtyFields = useCallback((row: PitchingRow): EditablePitchingField[] => {
      const original = originalRowsRef.current.get(row.id);
      if (!original) {
        return [];
      }

      const changed: EditablePitchingField[] = [];
      editableFields.forEach((field) => {
        const currentValue = Number(row[field] ?? 0);
        const originalValue = Number(original[field] ?? 0);
        if (currentValue !== originalValue) {
          changed.push(field);
        }
      });
      return changed;
    }, []);

    const applyRowUpdate = useCallback((updatedRow: PitchingRow) => {
      setRowsState((prev) => prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    }, []);

    const clearDirtyState = useCallback(() => {
      setDirtyRowId(null);
      setDirtyFields([]);
    }, []);

    const focusEditor = () => {
      window.requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(
          'div.MuiDataGrid-cell--editing input',
        );
        input?.select();
      });
    };

    const [newRow, setNewRow] = useState<CreateGamePitchingStatType>(emptyPitchingNewRow);

    const handleAddRow = useCallback(async (): Promise<boolean> => {
      try {
        if (!newRow.rosterSeasonId) {
          throw new Error('Select a player to add.');
        }

        const playerSummary =
          availablePlayers.find((player) => player.rosterSeasonId === newRow.rosterSeasonId) ??
          null;
        validatePitchingOutcomes(
          [
            ...mapRowsToOutcomeInputs(rowsState),
            {
              id: NEW_ROW_ID,
              playerName: playerSummary?.playerName ?? 'New player',
              w: newRow.w,
              l: newRow.l,
              s: newRow.s,
            },
          ],
          gameOutcome,
        );

        await onCreateStat({ ...newRow, ipDecimal: Number(newRow.ipDecimal) });
        setNewRow(emptyPitchingNewRow);
        clearDirtyState();
        const api = apiRef.current;
        editableFields.forEach((field) => {
          if (api?.getCellMode?.(NEW_ROW_ID, field) === 'edit') {
            api.stopCellEditMode?.({ id: NEW_ROW_ID, field });
          }
        });
        return true;
      } catch (error) {
        onProcessError(error instanceof Error ? error : new Error('Unable to add stat line.'));
        return false;
      }
    }, [
      apiRef,
      availablePlayers,
      clearDirtyState,
      gameOutcome,
      newRow,
      onCreateStat,
      onProcessError,
      rowsState,
    ]);

    const selectedNewRowPlayer = useMemo(
      () =>
        availablePlayers.find((player) => player.rosterSeasonId === newRow.rosterSeasonId) ?? null,
      [availablePlayers, newRow.rosterSeasonId],
    );

    const newRowDisplay = useMemo<PitchingNewRow>(() => {
      const base: PitchingNewRow = {
        id: NEW_ROW_ID,
        isNew: true,
        playerName: selectedNewRowPlayer?.playerName ?? '',
        playerNumber: selectedNewRowPlayer?.playerNumber ?? null,
        rosterSeasonId: newRow.rosterSeasonId,
        ipDecimal: 0,
        w: 0,
        l: 0,
        s: 0,
        h: 0,
        r: 0,
        er: 0,
        d: 0,
        t: 0,
        hr: 0,
        so: 0,
        bb: 0,
        bf: 0,
        wp: 0,
        hbp: 0,
        bk: 0,
        sc: 0,
      };

      editableFields.forEach((field) => {
        base[field] = newRow[field];
      });

      return base;
    }, [newRow, selectedNewRowPlayer]);

    const totalsRow = useMemo<PitchingTotalsRow | null>(() => {
      if (!totals) {
        return null;
      }

      const stats = {} as Record<EditablePitchingField, number>;
      editableFields.forEach((field) => {
        stats[field] = Number(totals[field as keyof typeof totals] ?? 0);
      });

      return {
        id: TOTALS_ROW_ID,
        isTotals: true,
        playerName: 'Totals',
        playerNumber: null,
        ...stats,
        ip: Number(totals.ip ?? 0),
        era: Number(totals.era ?? 0),
        whip: Number(totals.whip ?? 0),
        k9: Number(totals.k9 ?? 0),
        bb9: Number(totals.bb9 ?? 0),
        oba: Number(totals.oba ?? 0),
        slg: Number(totals.slg ?? 0),
      };
    }, [totals]);

    const gridRows = useMemo<PitchingGridRow[]>(() => {
      const combined: PitchingGridRow[] = [newRowDisplay, ...rowsState];
      if (totalsRow) {
        combined.push(totalsRow);
      }
      return combined;
    }, [newRowDisplay, rowsState, totalsRow]);

    useEffect(() => {
      const changedFields = editableFields.filter(
        (field) => newRow[field] !== emptyPitchingNewRow[field],
      ) as EditablePitchingField[];
      const hasData = newRow.rosterSeasonId !== '' || changedFields.length > 0;

      if (hasData) {
        if (!dirtyRowId || dirtyRowId === NEW_ROW_ID) {
          setDirtyRowId(NEW_ROW_ID);
          const dirtyFieldList =
            changedFields.length > 0
              ? changedFields
              : (Array.from(editableFields) as EditablePitchingField[]);
          setDirtyFields(dirtyFieldList);
        }
      } else if (dirtyRowId === NEW_ROW_ID) {
        clearDirtyState();
      }
    }, [clearDirtyState, dirtyRowId, newRow]);

    const markDirty = useCallback(
      (row: PitchingGridRow) => {
        if ('isTotals' in row && row.isTotals) {
          return;
        }

        if ('isNew' in row && row.isNew) {
          const hasStats = editableFields.some((field) => Number(row[field] ?? 0) !== 0);
          const hasPlayer = Boolean(row.rosterSeasonId);
          if (hasStats || hasPlayer) {
            setDirtyRowId(NEW_ROW_ID);
            setDirtyFields(Array.from(editableFields) as EditablePitchingField[]);
          } else if (dirtyRowId === NEW_ROW_ID) {
            clearDirtyState();
          }
          return;
        }

        const changed = computeDirtyFields(row as PitchingRow);
        if (changed.length > 0) {
          setDirtyRowId(row.id);
          setDirtyFields(changed);
        } else if (dirtyRowId === row.id) {
          clearDirtyState();
        }
      },
      [clearDirtyState, computeDirtyFields, dirtyRowId],
    );

    const handleDiscardDirtyRow = useCallback(() => {
      if (!dirtyRowId) {
        return;
      }
      if (dirtyRowId === NEW_ROW_ID) {
        setNewRow(emptyPitchingNewRow);
        clearDirtyState();
        const api = apiRef.current;
        editableFields.forEach((field) => {
          if (api?.getCellMode?.(NEW_ROW_ID, field) === 'edit') {
            api.stopCellEditMode?.({ id: NEW_ROW_ID, field });
          }
        });
        return;
      }
      if (dirtyRowId === TOTALS_ROW_ID) {
        clearDirtyState();
        return;
      }
      const original = originalRowsRef.current.get(dirtyRowId);
      if (!original) {
        clearDirtyState();
        return;
      }
      applyRowUpdate(original);
      clearDirtyState();
      const api = apiRef.current;
      if (api?.getCellMode?.(dirtyRowId, editableFields[0]) === 'edit') {
        api.stopCellEditMode?.({ id: dirtyRowId, field: editableFields[0] });
      }
    }, [apiRef, applyRowUpdate, clearDirtyState, dirtyRowId]);

    const handleSaveDirtyRow = useCallback(async () => {
      if (!dirtyRowId) {
        return true;
      }
      if (dirtyRowId === NEW_ROW_ID) {
        return handleAddRow();
      }
      if (dirtyRowId === TOTALS_ROW_ID) {
        clearDirtyState();
        return true;
      }
      const current = rowsState.find((row) => row.id === dirtyRowId);
      const original = originalRowsRef.current.get(dirtyRowId);
      if (!current || !original) {
        clearDirtyState();
        return true;
      }

      const diff = editableFields.reduce<UpdateGamePitchingStatType>((acc, field) => {
        const value = Number(current[field] ?? 0);
        acc[field] = field === 'ipDecimal' ? value : Math.trunc(value);
        return acc;
      }, {} as UpdateGamePitchingStatType);

      if (editableFields.every((field) => current[field] === original[field])) {
        clearDirtyState();
        return true;
      }

      try {
        validatePitchingOutcomes(mapRowsToOutcomeInputs(rowsState), gameOutcome);
        await onUpdateStat(current.statId, diff);
        originalRowsRef.current.set(current.id, current);
        const api = apiRef.current;
        if (api?.getCellMode?.(current.id, editableFields[0]) === 'edit') {
          api.stopCellEditMode?.({ id: current.id, field: editableFields[0] });
        }
        clearDirtyState();
        return true;
      } catch (error) {
        onProcessError(error instanceof Error ? error : new Error('Unable to update stat line.'));
        return false;
      }
    }, [
      apiRef,
      clearDirtyState,
      dirtyRowId,
      handleAddRow,
      onProcessError,
      onUpdateStat,
      gameOutcome,
      rowsState,
    ]);

    const resolveDirtyRow = async (
      reason: UnsavedChangesReason,
      nextRowId?: string,
    ): Promise<boolean> => {
      if (!dirtyRowId || dirtyRowId === nextRowId) {
        return true;
      }

      if (dirtyRowId === NEW_ROW_ID) {
        if (!onRequestUnsavedDecision) {
          handleDiscardDirtyRow();
          return true;
        }

        const decision = await onRequestUnsavedDecision({
          reason,
          playerName: selectedNewRowPlayer?.playerName ?? 'New player',
          tab: 'pitching',
        });

        if (decision === 'save') {
          return handleSaveDirtyRow();
        }

        if (decision === 'discard') {
          handleDiscardDirtyRow();
          return true;
        }

        return false;
      }

      if (dirtyRowId === TOTALS_ROW_ID) {
        clearDirtyState();
        return true;
      }

      const dirtyRow = rowsState.find((row) => row.id === dirtyRowId);
      if (!dirtyRow) {
        clearDirtyState();
        return true;
      }

      if (!onRequestUnsavedDecision) {
        handleDiscardDirtyRow();
        return true;
      }

      const decision = await onRequestUnsavedDecision({
        reason,
        playerName: dirtyRow.playerName,
        tab: 'pitching',
      });

      if (decision === 'save') {
        return handleSaveDirtyRow();
      }

      if (decision === 'discard') {
        handleDiscardDirtyRow();
        return true;
      }

      return false;
    };

    const columns = useMemo<GridColDef<PitchingGridRow>[]>(
      () => [
        {
          field: 'rowControls',
          headerName: '',
          sortable: false,
          filterable: false,
          width: 90,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params: GridRenderCellParams<PitchingGridRow>) => {
            if (params.id === NEW_ROW_ID) {
              const isDirty = dirtyRowId === NEW_ROW_ID;
              if (isDirty) {
                return (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Save changes">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleSaveDirtyRow();
                        }}
                        aria-label="Save new pitching stat line"
                      >
                        <Check fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Discard changes">
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDiscardDirtyRow();
                        }}
                        aria-label="Discard new pitching stat line"
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                );
              }

              const canAdd = Boolean(newRow.rosterSeasonId);
              return (
                <Tooltip title={canAdd ? 'Add stat line' : 'Select a player first'}>
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={!canAdd}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleAddRow();
                      }}
                      aria-label="Add pitching stat line"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              );
            }

            if (params.id === TOTALS_ROW_ID) {
              return null;
            }

            const pitchingRow = params.row as PitchingRow;
            const isDirty = dirtyRowId === params.row.id;
            return (
              <Stack direction="row" spacing={0.5} alignItems="center">
                {isDirty && (
                  <>
                    <Tooltip title="Save changes">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleSaveDirtyRow();
                        }}
                        aria-label={`Save pitching changes for ${pitchingRow.playerName}`}
                      >
                        <Check fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Discard changes">
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDiscardDirtyRow();
                        }}
                        aria-label={`Discard pitching changes for ${pitchingRow.playerName}`}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <Tooltip title="Delete stat line">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteStat(pitchingRow);
                    }}
                    aria-label={`Delete ${pitchingRow.playerName} pitching line`}
                    sx={{ ml: isDirty ? 0 : 0.5 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          },
        },
        {
          field: 'playerNumber',
          headerName: PITCHING_FIELD_LABELS.playerNumber,
          width: 70,
          align: 'center',
          headerAlign: 'center',
          sortable: false,
          filterable: false,
          renderCell: (params: GridRenderCellParams<PitchingGridRow>) => {
            if (params.id === TOTALS_ROW_ID) {
              return null;
            }

            const value =
              params.id === NEW_ROW_ID
                ? (selectedNewRowPlayer?.playerNumber ?? null)
                : (params.row as PitchingRow).playerNumber;

            if (value === null || value === undefined) {
              return null;
            }

            return (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            );
          },
        },
        {
          field: 'playerName',
          headerName: PITCHING_FIELD_LABELS.playerName,
          flex: 1.2,
          minWidth: 180,
          sortable: false,
          renderCell: (params: GridRenderCellParams<PitchingGridRow>) => {
            if (params.id === NEW_ROW_ID) {
              return (
                <Box
                  sx={{ width: '100%' }}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <Autocomplete
                    options={availablePlayers}
                    getOptionLabel={(option) => option.playerName}
                    value={selectedNewRowPlayer}
                    onChange={(_event, option) =>
                      setNewRow((prev) => ({
                        ...prev,
                        rosterSeasonId: option?.rosterSeasonId ?? '',
                      }))
                    }
                    renderInput={(inputParams) => (
                      <TextField {...inputParams} variant="standard" placeholder="Select player" />
                    )}
                    size="small"
                    fullWidth
                  />
                </Box>
              );
            }

            if (params.id === TOTALS_ROW_ID) {
              return (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Totals
                </Typography>
              );
            }

            const pitchingRow = params.row as PitchingRow;
            return (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {pitchingRow.playerName}
              </Typography>
            );
          },
        },
        ...editableFields.map<GridColDef<PitchingGridRow>>((field) => ({
          field,
          headerName: PITCHING_FIELD_LABELS[field],
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          editable: true,
          preProcessEditCellProps: buildNonNegativePreProcessor(field === 'ipDecimal'),
          valueFormatter:
            field === 'ipDecimal'
              ? (params) => {
                  const value = params?.value;
                  if (value === null || value === undefined) {
                    return formatInnings(Number.NaN);
                  }
                  const numeric = typeof value === 'number' ? value : Number(value);
                  return formatInnings(Number.isNaN(numeric) ? Number.NaN : numeric);
                }
              : (params) =>
                  formatStatDecimal(params?.value as number | string | null | undefined, 0),
          renderCell: (params) => {
            const numeric = getNumericPitchingFieldValue(
              params.row as PitchingGridRow | undefined,
              field,
            );
            if (numeric === null) {
              return '-';
            }

            if (field === 'ipDecimal') {
              return formatInnings(numeric);
            }

            return formatStatDecimal(numeric, 0);
          },
        })),
        {
          field: 'ip',
          headerName: 'IP',
          align: 'center',
          headerAlign: 'center',
          width: 100,
          valueFormatter: (params) => {
            const value = params?.value;
            if (value === null || value === undefined) {
              return formatInnings(Number.NaN);
            }
            const numeric = typeof value === 'number' ? value : Number(value);
            return formatInnings(Number.isNaN(numeric) ? Number.NaN : numeric);
          },
          renderCell: (params) => {
            if (params.id === NEW_ROW_ID) {
              return '-';
            }
            const value = params.value;
            if (value === null || value === undefined) {
              return formatInnings(Number.NaN);
            }
            const numeric = typeof value === 'number' ? value : Number(value);
            return formatInnings(Number.isNaN(numeric) ? Number.NaN : numeric);
          },
        },
        {
          field: 'era',
          headerName: 'ERA',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 2),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 2),
        },
        {
          field: 'whip',
          headerName: 'WHIP',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 2),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 2),
        },
        {
          field: 'k9',
          headerName: 'K/9',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 2),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 2),
        },
        {
          field: 'bb9',
          headerName: 'BB/9',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 2),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 2),
        },
        {
          field: 'oba',
          headerName: 'OBA',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 3),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 3),
        },
        {
          field: 'slg',
          headerName: 'SLG',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 3),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 3),
        },
      ],
      [
        availablePlayers,
        dirtyRowId,
        handleAddRow,
        handleDiscardDirtyRow,
        handleSaveDirtyRow,
        newRow,
        onDeleteStat,
        selectedNewRowPlayer,
      ],
    );

    const processRowUpdate = async (candidateRow: PitchingGridRow) => {
      if ('isTotals' in candidateRow && candidateRow.isTotals) {
        return candidateRow;
      }

      if ('isNew' in candidateRow && candidateRow.isNew) {
        try {
          const sanitized = { ...candidateRow } as PitchingNewRow;
          editableFields.forEach((field) => {
            const value = Number(candidateRow[field] ?? 0);
            if (!Number.isFinite(value) || value < 0) {
              throw new Error('Statistic values must be non-negative numbers.');
            }
            sanitized[field] = field === 'ipDecimal' ? value : Math.trunc(value);
          });
          sanitized.isNew = true;

          validatePitchingOutcomes(
            [
              ...mapRowsToOutcomeInputs(rowsState),
              {
                id: sanitized.id,
                playerName: sanitized.playerName,
                w: sanitized.w,
                l: sanitized.l,
                s: sanitized.s,
              },
            ],
            gameOutcome,
          );

          setNewRow((prev) => {
            const updates: Partial<CreateGamePitchingStatType> = {};
            editableFields.forEach((field) => {
              updates[field] = sanitized[field] as number;
            });
            return {
              ...prev,
              ...updates,
            };
          });
          markDirty(sanitized);
          return sanitized;
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unable to update stat line.');
          onProcessError(err);
          throw err;
        }
      }

      const newRowValue = candidateRow as PitchingRow;
      try {
        const sanitized = { ...newRowValue };
        editableFields.forEach((field) => {
          const value = Number(sanitized[field]);
          if (!Number.isFinite(value) || value < 0) {
            throw new Error('Statistic values must be non-negative numbers.');
          }
          sanitized[field] = field === 'ipDecimal' ? Number(value) : Math.trunc(value);
        });

        const candidateRows = rowsState.map((row) => (row.id === sanitized.id ? sanitized : row));
        validatePitchingOutcomes(mapRowsToOutcomeInputs(candidateRows), gameOutcome);

        applyRowUpdate(sanitized);
        markDirty(sanitized);
        return sanitized;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unable to update stat line.');
        onProcessError(err);
        throw err;
      }
    };

    const getDirtyRowInfo = () => {
      if (!dirtyRowId) {
        return null;
      }
      if (dirtyRowId === NEW_ROW_ID) {
        return {
          rowId: NEW_ROW_ID,
          playerName: selectedNewRowPlayer?.playerName ?? 'New player',
        };
      }
      if (dirtyRowId === TOTALS_ROW_ID) {
        return null;
      }
      const row = rowsState.find((candidate) => candidate.id === dirtyRowId);
      return row ? { rowId: row.id, playerName: row.playerName } : null;
    };

    useImperativeHandle(ref, () => ({
      hasDirtyRow: () => Boolean(dirtyRowId),
      getDirtyRowInfo,
      saveDirtyRow: async () => handleSaveDirtyRow(),
      discardDirtyRow: () => handleDiscardDirtyRow(),
    }));

    const handleCellClick = async (params: { id: string | number; field: string }) => {
      const rowId = String(params.id);
      const field = params.field as EditablePitchingField;
      if (rowId === TOTALS_ROW_ID || !editableFields.includes(field)) {
        return;
      }

      const ok = await resolveDirtyRow('switch-row', rowId);
      if (!ok) {
        return;
      }

      const api = apiRef.current;
      if (!api) {
        return;
      }
      const currentMode = api.getCellMode?.(rowId, field);
      if (currentMode !== 'edit') {
        api.startCellEditMode({ id: rowId, field });
      }
      focusEditor();
    };

    const handleCellKeyDown = (
      params: GridCellParams<PitchingGridRow>,
      event: React.KeyboardEvent,
    ) => {
      if (
        params.id === TOTALS_ROW_ID ||
        !editableFields.includes(params.field as EditablePitchingField)
      ) {
        return;
      }

      if (event.key === '-' || event.key === 'Subtract' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
      }

      if ((params.field as EditablePitchingField) !== 'ipDecimal') {
        if (event.key === '.' || event.key === ',') {
          event.preventDefault();
        }
      }
    };

    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Pitching Statistics
          </Typography>
          {showViewSeason && onViewSeason && (
            <Button
              variant="text"
              size="small"
              onClick={onViewSeason}
              sx={{ textTransform: 'none' }}
            >
              View season totals
            </Button>
          )}
        </Stack>

        <DataGrid<PitchingGridRow>
          autoHeight
          disableColumnMenu
          disableRowSelectionOnClick
          editMode="cell"
          rows={gridRows}
          columns={columns}
          getRowId={(row) => row.id}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) =>
            onProcessError(
              error instanceof Error ? error : new Error('Unable to update stat line.'),
            )
          }
          apiRef={apiRef}
          isCellEditable={(params) =>
            params.id !== TOTALS_ROW_ID &&
            editableFields.includes(params.field as EditablePitchingField)
          }
          getRowClassName={(params) => {
            const { id } = params as unknown as { id: string | number };
            return id === TOTALS_ROW_ID ? 'totals-row' : '';
          }}
          onCellClick={(params) => {
            void handleCellClick({ id: params.id, field: params.field });
          }}
          onCellKeyDown={handleCellKeyDown}
          density="compact"
          hideFooter
          columnBuffer={4}
          getCellClassName={(params) => {
            if (
              params.id === TOTALS_ROW_ID ||
              !editableFields.includes(params.field as EditablePitchingField)
            ) {
              return '';
            }
            if (
              dirtyRowId === params.id &&
              dirtyFields.includes(params.field as EditablePitchingField)
            ) {
              return 'dirty-cell';
            }
            return '';
          }}
          sx={{
            '& .MuiDataGrid-cell--editing': {
              bgcolor: 'action.selected',
            },
            '& .MuiDataGrid-cell.dirty-cell': {
              bgcolor: (theme: Theme) => theme.palette.warning.light,
            },
            '& .MuiDataGrid-row.totals-row': {
              bgcolor: (theme: Theme) => theme.palette.grey[200],
              '& .MuiDataGrid-cell': {
                fontWeight: 600,
              },
            },
            '& .MuiDataGrid-cell:focus-within': {
              outline: (theme: Theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -1,
            },
            '& .MuiDataGrid-cell': { outline: 'none !important' },
          }}
        />
      </Box>
    );
  },
);

PitchingStatsEditableGrid.displayName = 'PitchingStatsEditableGrid';

export default PitchingStatsEditableGrid;
