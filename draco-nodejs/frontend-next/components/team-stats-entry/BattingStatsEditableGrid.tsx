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
import { Check, Close, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiRef } from '@mui/x-data-grid';
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

const editableFields = [
  'ab',
  'h',
  'r',
  'd',
  't',
  'hr',
  'rbi',
  'so',
  'bb',
  'hbp',
  'sb',
  'cs',
  'sf',
  'sh',
  're',
  'intr',
  'lob',
] as const;

type EditableBattingField = (typeof editableFields)[number];

type BattingTotalKey =
  | 'ab'
  | 'h'
  | 'r'
  | 'd'
  | 't'
  | 'hr'
  | 'rbi'
  | 'so'
  | 'bb'
  | 'hbp'
  | 'sb'
  | 'cs'
  | 'sf'
  | 'sh'
  | 're'
  | 'intr'
  | 'lob'
  | 'tb'
  | 'pa'
  | 'avg'
  | 'obp'
  | 'slg'
  | 'ops';

const totalsFields: Array<{ key: BattingTotalKey; label: string; digits?: number }> = [
  { key: 'ab', label: 'AB' },
  { key: 'h', label: 'H' },
  { key: 'r', label: 'R' },
  { key: 'd', label: '2B' },
  { key: 't', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'rbi', label: 'RBI' },
  { key: 'so', label: 'SO' },
  { key: 'bb', label: 'BB' },
  { key: 'hbp', label: 'HBP' },
  { key: 'sb', label: 'SB' },
  { key: 'cs', label: 'CS' },
  { key: 'sf', label: 'SF' },
  { key: 'sh', label: 'SH' },
  { key: 're', label: 'RE' },
  { key: 'intr', label: 'INTR' },
  { key: 'lob', label: 'LOB' },
  { key: 'tb', label: 'TB', digits: 0 },
  { key: 'pa', label: 'PA', digits: 0 },
  { key: 'avg', label: 'AVG', digits: 3 },
  { key: 'obp', label: 'OBP', digits: 3 },
  { key: 'slg', label: 'SLG', digits: 3 },
  { key: 'ops', label: 'OPS', digits: 3 },
];

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

    const handleAddRow = async () => {
      try {
        if (!newRow.rosterSeasonId) {
          throw new Error('Select a player to add.');
        }

        await onCreateStat(newRow);
        setNewRow({
          rosterSeasonId: '',
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
        });
      } catch (error) {
        onProcessError(error instanceof Error ? error : new Error('Unable to add stat line.'));
      }
    };

    const [newRow, setNewRow] = useState<CreateGameBattingStatType>({
      rosterSeasonId: '',
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
    });

    const markDirty = useCallback(
      (row: BattingRow) => {
        const changed = computeDirtyFields(row);
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
    }, [apiRef, clearDirtyState, dirtyRowId, onProcessError, onUpdateStat, rowsState]);

    const resolveDirtyRow = async (
      reason: UnsavedChangesReason,
      nextRowId?: string,
    ): Promise<boolean> => {
      if (!dirtyRowId || dirtyRowId === nextRowId) {
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

    const columns = useMemo<GridColDef<BattingRow>[]>(
      () => [
        {
          field: 'rowControls',
          headerName: '',
          sortable: false,
          filterable: false,
          width: 90,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params: GridRenderCellParams<BattingRow>) => {
            const isDirty = dirtyRowId === params.row.id;
            return (
              <Stack direction="row" spacing={0.5} alignItems="center">
                {isDirty && (
                  <>
                    <Tooltip title="Save changes">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => void handleSaveDirtyRow()}
                        aria-label={`Save batting changes for ${params.row.playerName}`}
                      >
                        <Check fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Discard changes">
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={handleDiscardDirtyRow}
                        aria-label={`Discard batting changes for ${params.row.playerName}`}
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
                    onClick={() => onDeleteStat(params.row)}
                    aria-label={`Delete ${params.row.playerName} batting line`}
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
          field: 'playerName',
          headerName: 'Player',
          flex: 1.2,
          minWidth: 180,
          sortable: false,
          renderCell: (params) => (
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {params.row.playerName}
              </Typography>
              {params.row.playerNumber !== null && (
                <Typography variant="caption" color="text.secondary">
                  #{params.row.playerNumber}
                </Typography>
              )}
            </Stack>
          ),
        },
        ...editableFields.map<GridColDef<BattingRow>>((field) => ({
          field,
          headerName: field.toUpperCase(),
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          editable: true,
        })),
        {
          field: 'tb',
          headerName: 'TB',
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 0),
        },
        {
          field: 'pa',
          headerName: 'PA',
          type: 'number',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 0),
        },
        {
          field: 'avg',
          headerName: 'AVG',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 3),
        },
        {
          field: 'obp',
          headerName: 'OBP',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 3),
        },
        {
          field: 'slg',
          headerName: 'SLG',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 3),
        },
        {
          field: 'ops',
          headerName: 'OPS',
          align: 'center',
          headerAlign: 'center',
          width: 90,
          valueFormatter: ({ value }) => formatStatDecimal(value, 3),
        },
      ],
      [dirtyRowId, handleDiscardDirtyRow, handleSaveDirtyRow, onDeleteStat],
    );

    const processRowUpdate = async (newRow: BattingRow) => {
      try {
        const sanitized = { ...newRow };
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
      if (!editableFields.includes(field)) {
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

    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Batting Box Score
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

        <DataGrid
          autoHeight
          disableColumnMenu
          disableRowSelectionOnClick
          editMode="cell"
          rows={rowsState}
          columns={columns}
          getRowId={(row) => row.id}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) =>
            onProcessError(
              error instanceof Error ? error : new Error('Unable to update stat line.'),
            )
          }
          apiRef={apiRef}
          onCellClick={(params) => {
            void handleCellClick({ id: params.id, field: params.field });
          }}
          density="compact"
          hideFooter
          columnBuffer={4}
          getCellClassName={(params) => {
            if (!editableFields.includes(params.field as EditableBattingField)) {
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
            '& .MuiDataGrid-cell--editing': {
              bgcolor: 'action.selected',
            },
            '& .MuiDataGrid-cell.dirty-cell': {
              bgcolor: (theme: Theme) => theme.palette.warning.light,
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

        {totals && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `1.2fr repeat(${totalsFields.length}, minmax(70px, 1fr))`,
              alignItems: 'center',
              gap: 1,
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Totals
            </Typography>
            {totalsFields.map(({ key, label, digits }) => {
              const value = totals[key];
              const display =
                digits !== undefined
                  ? formatStatDecimal(value as number | null | undefined, digits)
                  : value;

              return (
                <Typography
                  key={`total-${label}`}
                  variant="body2"
                  textAlign="center"
                  sx={{ fontWeight: 600 }}
                >
                  {display}
                </Typography>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `1.2fr repeat(${editableFields.length}, minmax(70px, 1fr))`,
            gap: 1,
            alignItems: 'center',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
          }}
        >
          <Autocomplete
            options={availablePlayers}
            getOptionLabel={(option) => option.playerName}
            value={
              availablePlayers.find((player) => player.rosterSeasonId === newRow.rosterSeasonId) ??
              null
            }
            onChange={(_event, option) =>
              setNewRow((prev) => ({ ...prev, rosterSeasonId: option?.rosterSeasonId ?? '' }))
            }
            renderInput={(params) => (
              <TextField {...params} variant="standard" label="Player" placeholder="Select" />
            )}
          />
          {editableFields.map((field) => (
            <TextField
              key={`new-${field}`}
              type="number"
              variant="standard"
              inputProps={{ min: 0 }}
              value={newRow[field]}
              onChange={(event) =>
                setNewRow((prev) => ({ ...prev, [field]: Number(event.target.value) ?? 0 }))
              }
            />
          ))}
          <Button
            variant="contained"
            size="small"
            onClick={() => void handleAddRow()}
            disabled={!newRow.rosterSeasonId}
          >
            Add
          </Button>
        </Box>
      </Box>
    );
  },
);

BattingStatsEditableGrid.displayName = 'BattingStatsEditableGrid';

export default BattingStatsEditableGrid;
