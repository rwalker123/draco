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
  CreateGameBattingStatType,
  GameBattingStatLineType,
  GameBattingStatsType,
  TeamStatsPlayerSummaryType,
  UpdateGameBattingStatType,
} from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';
import type {
  EditableGridHandle,
  UnsavedChangesDecision,
  UnsavedChangesPrompt,
  UnsavedChangesReason,
} from './types';
import {
  editableBattingFields as editableFields,
  type EditableBattingField,
  type BattingSummaryField,
  type BattingViewField,
  BATTING_FIELD_LABELS,
  BATTING_FIELD_TOOLTIPS,
} from './battingColumns';

interface BattingStatsEditableGridProps {
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onCreateStat: (payload: CreateGameBattingStatType) => Promise<void>;
  onUpdateStat: (statId: string, payload: UpdateGameBattingStatType) => Promise<void>;
  onDeleteStat: (stat: GameBattingStatLineType) => void;
  onProcessError: (error: Error) => void;
  showViewSeason?: boolean;
  onViewSeason?: () => void;
  onRequestUnsavedDecision?: (prompt: UnsavedChangesPrompt) => Promise<UnsavedChangesDecision>;
  onDirtyStateChange?: (hasDirtyRow: boolean) => void;
}

type BattingRow = GameBattingStatLineType & { id: string };

const buildRow = (line: GameBattingStatLineType): BattingRow => ({
  ...line,
  id: line.statId,
});

const buildNonNegativeIntegerPreProcessor = () =>
  function preProcessEditCellProps(params: GridPreProcessEditCellProps) {
    const { value } = params.props;
    if (value === '' || value === null || value === undefined) {
      return { ...params.props, value: 0, error: false };
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return { ...params.props, error: true };
    }

    return { ...params.props, value: Math.trunc(numeric), error: false };
  };

const EMPTY_ROSTER_SEASON_ID = '' satisfies string;
const NEW_ROW_ID = 'batting-new-row';
const TOTALS_ROW_ID = 'batting-totals-row';

const emptyBattingNewRow: CreateGameBattingStatType = {
  rosterSeasonId: EMPTY_ROSTER_SEASON_ID,
  ab: 0,
  h: 0,
  r: 0,
  d: 0,
  t: 0,
  hr: 0,
  rbi: 0,
  so: 0,
  bb: 0,
  hbp: 0,
  sb: 0,
  cs: 0,
  sf: 0,
  sh: 0,
  re: 0,
  intr: 0,
  lob: 0,
};

type BattingNewRow = {
  id: typeof NEW_ROW_ID;
  isNew: true;
  playerName: string;
  playerNumber: number | null;
  rosterSeasonId: string;
} & Record<EditableBattingField, number>;

type BattingTotalsRow = {
  id: typeof TOTALS_ROW_ID;
  isTotals: true;
  playerName: string;
  playerNumber: null;
} & Record<EditableBattingField | BattingSummaryField, number>;

type BattingGridRow = BattingRow | BattingNewRow | BattingTotalsRow;

const renderHeaderWithTooltip = (field: BattingViewField) => {
  const HeaderComponent: React.FC = () => (
    <Tooltip title={BATTING_FIELD_TOOLTIPS[field]}>
      <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
        {BATTING_FIELD_LABELS[field]}
      </Typography>
    </Tooltip>
  );
  HeaderComponent.displayName = `BattingHeader_${field}`;
  return HeaderComponent;
};

const BattingStatsEditableGrid = forwardRef<
  EditableGridHandle | null,
  BattingStatsEditableGridProps
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
      showViewSeason = false,
      onViewSeason,
      onRequestUnsavedDecision,
      onDirtyStateChange,
    },
    ref,
  ) => {
    const rows = useMemo(() => stats?.stats.map(buildRow) ?? [], [stats]);
    const apiRef = useGridApiRef();
    const originalRowsRef = useRef<Map<string, BattingRow>>(new Map());

    const [rowsState, setRowsState] = useState<BattingRow[]>(rows);
    const [dirtyRowId, setDirtyRowId] = useState<string | null>(null);
    const [dirtyFields, setDirtyFields] = useState<EditableBattingField[]>([]);

    useEffect(() => {
      const map = new Map<string, BattingRow>();
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

    const computeDirtyFields = useCallback((row: BattingRow): EditableBattingField[] => {
      const original = originalRowsRef.current.get(row.id);
      if (!original) {
        return [];
      }

      const changed: EditableBattingField[] = [];
      editableFields.forEach((field) => {
        const currentValue = Number(row[field] ?? 0);
        const originalValue = Number(original[field] ?? 0);
        if (currentValue !== originalValue) {
          changed.push(field);
        }
      });
      return changed;
    }, []);

    const applyRowUpdate = useCallback((updatedRow: BattingRow) => {
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

    const [newRow, setNewRow] = useState<CreateGameBattingStatType>(emptyBattingNewRow);

    const handleAddRow = useCallback(async (): Promise<boolean> => {
      try {
        if (!newRow.rosterSeasonId) {
          throw new Error('Select a player to add.');
        }

        await onCreateStat(newRow);
        setNewRow(emptyBattingNewRow);
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
    }, [apiRef, clearDirtyState, newRow, onCreateStat, onProcessError]);

    const selectedNewRowPlayer = useMemo(
      () =>
        availablePlayers.find((player) => player.rosterSeasonId === newRow.rosterSeasonId) ?? null,
      [availablePlayers, newRow.rosterSeasonId],
    );

    const newRowDisplay = useMemo<BattingNewRow>(() => {
      const base: BattingNewRow = {
        id: NEW_ROW_ID,
        isNew: true,
        playerName: selectedNewRowPlayer?.playerName ?? '',
        playerNumber: selectedNewRowPlayer?.playerNumber ?? null,
        rosterSeasonId: newRow.rosterSeasonId,
        ab: 0,
        h: 0,
        r: 0,
        d: 0,
        t: 0,
        hr: 0,
        rbi: 0,
        so: 0,
        bb: 0,
        hbp: 0,
        sb: 0,
        cs: 0,
        sf: 0,
        sh: 0,
        re: 0,
        intr: 0,
        lob: 0,
      };

      editableFields.forEach((field) => {
        base[field] = newRow[field];
      });

      return base;
    }, [newRow, selectedNewRowPlayer]);

    const totalsRow = useMemo<BattingTotalsRow | null>(() => {
      if (!totals) {
        return null;
      }

      const stats = {} as Record<EditableBattingField, number>;
      editableFields.forEach((field) => {
        stats[field] = Number(totals[field as keyof typeof totals] ?? 0);
      });

      return {
        id: TOTALS_ROW_ID,
        isTotals: true,
        playerName: 'Totals',
        playerNumber: null,
        ...stats,
        tb: Number(totals.tb ?? 0),
        pa: Number(totals.pa ?? 0),
        avg: Number(totals.avg ?? 0),
        obp: Number(totals.obp ?? 0),
        slg: Number(totals.slg ?? 0),
        ops: Number(totals.ops ?? 0),
      };
    }, [totals]);

    const gridRows = useMemo<BattingGridRow[]>(() => {
      const combined: BattingGridRow[] = [newRowDisplay, ...rowsState];
      if (totalsRow) {
        combined.push(totalsRow);
      }
      return combined;
    }, [newRowDisplay, rowsState, totalsRow]);

    useEffect(() => {
      const changedFields = editableFields.filter(
        (field) => newRow[field] !== emptyBattingNewRow[field],
      ) as EditableBattingField[];
      const hasData = newRow.rosterSeasonId !== '' || changedFields.length > 0;

      if (hasData) {
        if (!dirtyRowId || dirtyRowId === NEW_ROW_ID) {
          setDirtyRowId(NEW_ROW_ID);
          const dirtyFieldList =
            changedFields.length > 0
              ? changedFields
              : (Array.from(editableFields) as EditableBattingField[]);
          setDirtyFields(dirtyFieldList);
        }
      } else if (dirtyRowId === NEW_ROW_ID) {
        clearDirtyState();
      }
    }, [clearDirtyState, dirtyRowId, newRow]);

    const markDirty = useCallback(
      (row: BattingGridRow) => {
        if ('isTotals' in row && row.isTotals) {
          return;
        }

        if ('isNew' in row && row.isNew) {
          const hasStats = editableFields.some((field) => Number(row[field] ?? 0) !== 0);
          const hasPlayer = Boolean(row.rosterSeasonId);
          if (hasStats || hasPlayer) {
            setDirtyRowId(NEW_ROW_ID);
            setDirtyFields(Array.from(editableFields) as EditableBattingField[]);
          } else if (dirtyRowId === NEW_ROW_ID) {
            clearDirtyState();
          }
          return;
        }

        const changed = computeDirtyFields(row as BattingRow);
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
        setNewRow(emptyBattingNewRow);
        clearDirtyState();
        const api = apiRef.current;
        editableFields.forEach((field) => {
          if (api?.getCellMode?.(NEW_ROW_ID, field) === 'edit') {
            api.stopCellEditMode?.({ id: NEW_ROW_ID, field });
          }
        });
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

      const diff = editableFields.reduce<UpdateGameBattingStatType>((acc, field) => {
        acc[field] = Number(current[field] ?? 0);
        return acc;
      }, {} as UpdateGameBattingStatType);

      if (editableFields.every((field) => current[field] === original[field])) {
        clearDirtyState();
        return true;
      }

      try {
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
          tab: 'batting',
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
        tab: 'batting',
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

    const columns = useMemo<GridColDef<BattingGridRow>[]>(
      () => [
        {
          field: 'rowControls',
          headerName: '',
          sortable: false,
          filterable: false,
          width: 90,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params: GridRenderCellParams<BattingGridRow>) => {
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
                        aria-label="Save new batting stat line"
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
                        aria-label="Discard new batting stat line"
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
                      aria-label="Add batting stat line"
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

            const battingRow = params.row as BattingRow;
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
                        aria-label={`Save batting changes for ${battingRow.playerName}`}
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
                        aria-label={`Discard batting changes for ${battingRow.playerName}`}
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
                      onDeleteStat(battingRow);
                    }}
                    aria-label={`Delete ${battingRow.playerName} batting line`}
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
          headerName: BATTING_FIELD_LABELS.playerNumber,
          renderHeader: renderHeaderWithTooltip('playerNumber'),
          width: 70,
          align: 'center',
          headerAlign: 'center',
          sortable: false,
          filterable: false,
          renderCell: (params: GridRenderCellParams<BattingGridRow>) => {
            if (params.id === TOTALS_ROW_ID) {
              return null;
            }

            const value =
              params.id === NEW_ROW_ID
                ? (selectedNewRowPlayer?.playerNumber ?? null)
                : (params.row as BattingRow).playerNumber;

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
          headerName: BATTING_FIELD_LABELS.playerName,
          renderHeader: renderHeaderWithTooltip('playerName'),
          flex: 1.2,
          minWidth: 180,
          sortable: false,
          renderCell: (params) => {
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

            const battingRow = params.row as BattingRow;
            return (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {battingRow.playerName}
              </Typography>
            );
          },
        },
        ...editableFields.map<GridColDef<BattingGridRow>>((field) => ({
          field,
          headerName: BATTING_FIELD_LABELS[field],
          renderHeader: renderHeaderWithTooltip(field),
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          editable: true,
          sortable: false,
          preProcessEditCellProps: buildNonNegativeIntegerPreProcessor(),
        })),
        {
          field: 'tb',
          headerName: BATTING_FIELD_LABELS.tb,
          renderHeader: renderHeaderWithTooltip('tb'),
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 0),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 0),
        },
        {
          field: 'pa',
          headerName: BATTING_FIELD_LABELS.pa,
          renderHeader: renderHeaderWithTooltip('pa'),
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 0),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 0),
        },
        {
          field: 'avg',
          headerName: BATTING_FIELD_LABELS.avg,
          renderHeader: renderHeaderWithTooltip('avg'),
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 3),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 3),
        },
        {
          field: 'obp',
          headerName: BATTING_FIELD_LABELS.obp,
          renderHeader: renderHeaderWithTooltip('obp'),
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 3),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 3),
        },
        {
          field: 'slg',
          headerName: BATTING_FIELD_LABELS.slg,
          renderHeader: renderHeaderWithTooltip('slg'),
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
          valueFormatter: (params) =>
            formatStatDecimal(params?.value as number | string | null | undefined, 3),
          renderCell: (params) =>
            params.id === NEW_ROW_ID
              ? '-'
              : formatStatDecimal(params.value as number | string | null | undefined, 3),
        },
        {
          field: 'ops',
          headerName: BATTING_FIELD_LABELS.ops,
          renderHeader: renderHeaderWithTooltip('ops'),
          align: 'center',
          headerAlign: 'center',
          width: 90,
          sortable: false,
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

    const processRowUpdate = async (candidateRow: BattingGridRow) => {
      if ('isTotals' in candidateRow && candidateRow.isTotals) {
        return candidateRow;
      }

      if ('isNew' in candidateRow && candidateRow.isNew) {
        try {
          const sanitized = { ...candidateRow } as BattingNewRow;
          editableFields.forEach((field) => {
            const value = Number(candidateRow[field] ?? 0);
            if (!Number.isFinite(value) || value < 0) {
              throw new Error('Statistic values must be non-negative numbers.');
            }
            sanitized[field] = Math.trunc(value);
          });
          sanitized.isNew = true;

          setNewRow((prev) => {
            const updates: Partial<CreateGameBattingStatType> = {};
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

      const newRowValue = candidateRow as BattingRow;
      try {
        const sanitized = { ...newRowValue };
        editableFields.forEach((field) => {
          const value = Number(sanitized[field]);
          if (!Number.isFinite(value) || value < 0) {
            throw new Error('Statistic values must be non-negative numbers.');
          }
          sanitized[field] = Math.trunc(value);
        });

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
      const field = params.field as EditableBattingField;
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
      params: GridCellParams<BattingGridRow>,
      event: React.KeyboardEvent,
    ) => {
      if (
        params.id === TOTALS_ROW_ID ||
        !editableFields.includes(params.field as EditableBattingField)
      ) {
        return;
      }

      if (event.key === '-' || event.key === 'Subtract' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
      }

      if (event.key === '.' || event.key === ',') {
        event.preventDefault();
      }
    };

    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Batting Statistics
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

        <DataGrid<BattingGridRow>
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
            editableFields.includes(params.field as EditableBattingField)
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
              !editableFields.includes(params.field as EditableBattingField)
            ) {
              return '';
            }
            if (
              dirtyRowId === params.id &&
              dirtyFields.includes(params.field as EditableBattingField)
            ) {
              return 'dirty-cell';
            }
            return '';
          }}
          sx={{
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
              py: 0.25, // vertical padding (theme spacing units)
              px: 0.5, // horizontal padding
            },
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
            '& .MuiDataGrid-cell': {
              outline: 'none !important',
            },
          }}
        />
      </Box>
    );
  },
);

BattingStatsEditableGrid.displayName = 'BattingStatsEditableGrid';

export default BattingStatsEditableGrid;
