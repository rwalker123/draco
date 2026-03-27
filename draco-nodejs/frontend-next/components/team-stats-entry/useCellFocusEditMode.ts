import { useEffect } from 'react';
import type { GridApi } from '@mui/x-data-grid';

export function focusEditor() {
  window.requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>('div.MuiDataGrid-cell--editing input');
    input?.select();
  });
}

export function useCellFocusEditMode(
  apiRef: React.RefObject<GridApi | null>,
  editableFields: readonly string[],
  totalsRowId: string,
) {
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    return api.subscribeEvent('cellFocusIn', (params) => {
      const rowId = String(params.id);
      const field = params.field;
      if (rowId === totalsRowId || !editableFields.includes(field)) return;

      const currentMode = api.getCellMode?.(rowId, field);
      if (currentMode !== 'edit') {
        api.startCellEditMode({ id: rowId, field });
        focusEditor();
      }
    });
  }, [apiRef, editableFields, totalsRowId]);
}
