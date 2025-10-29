declare module '@mui/x-data-grid' {
  import * as React from 'react';

  type GridRowBase = Record<string, unknown>;

  export interface GridRenderCellParams<RowType extends GridRowBase = GridRowBase> {
    row: RowType;
    value?: RowType[keyof RowType] | null;
    id?: string | number;
    field?: string;
  }

  export interface GridCellParams<RowType extends GridRowBase = GridRowBase>
    extends GridRenderCellParams<RowType> {
    id: string | number;
    field: string;
  }

  export interface GridPreProcessEditCellProps {
    id: string | number;
    field: string;
    props: {
      value: unknown;
      error?: boolean;
    };
  }

  export interface GridApiRef {
    startCellEditMode: (params: { id: string | number; field: string }) => void;
    getCellMode?: (id: string | number, field: string) => 'view' | 'edit';
    stopCellEditMode?: (params: { id: string | number; field: string }) => void;
    setCellFocus?: (id: string | number, field: string) => void;
    resetRowHeights?: () => void;
  }

  export interface GridColDef<RowType extends GridRowBase = GridRowBase> {
    field: string;
    headerName?: string;
    flex?: number;
    minWidth?: number;
    width?: number;
    type?: string;
    align?: 'left' | 'center' | 'right';
    headerAlign?: 'left' | 'center' | 'right';
    sortable?: boolean;
    editable?: boolean;
    filterable?: boolean;
    valueFormatter?: (params: {
      value: RowType[keyof RowType] | null | undefined;
    }) => React.ReactNode;
    renderCell?: (params: GridRenderCellParams<RowType>) => React.ReactNode;
    getCellClassName?: (params: GridCellParams<RowType>) => string;
    preProcessEditCellProps?: (
      params: GridPreProcessEditCellProps,
    ) => GridPreProcessEditCellProps['props'];
  }

  export interface DataGridProps<RowType extends GridRowBase = GridRowBase> {
    rows: RowType[];
    columns: GridColDef<RowType>[];
    getRowId?: (row: RowType) => string | number;
    processRowUpdate?: (newRow: RowType, oldRow: RowType) => RowType | Promise<RowType>;
    onProcessRowUpdateError?: (error: unknown) => void;
    autoHeight?: boolean;
    disableColumnMenu?: boolean;
    disableRowSelectionOnClick?: boolean;
    onCellClick?: (params: { id: string | number; field: string; row: RowType }) => void;
    onCellKeyDown?: (params: GridCellParams<RowType>, event: React.KeyboardEvent) => void;
    onCellEditStop?: (
      params: GridCellParams<RowType>,
      event: React.SyntheticEvent & { defaultMuiPrevented?: boolean },
    ) => void;
    isCellEditable?: (params: GridCellParams<RowType>) => boolean;
    getCellClassName?: (params: GridCellParams<RowType>) => string;
    getRowClassName?: (params: { row: RowType }) => string;
    density?: 'compact' | 'standard' | 'comfortable';
    hideFooter?: boolean;
    columnBuffer?: number;
    editMode?: 'row' | 'cell';
    apiRef?: React.MutableRefObject<GridApiRef>;
    sx?: Record<string, unknown>;
    getRowHeight?: (params: { row: RowType }) => number | null;
  }

  export function DataGrid<RowType extends GridRowBase = GridRowBase>(
    props: DataGridProps<RowType>,
  ): React.ReactElement | null;
  export function useGridApiRef(): React.MutableRefObject<GridApiRef>;
}
