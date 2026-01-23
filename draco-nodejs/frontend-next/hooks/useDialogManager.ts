'use client';

import { useState, useCallback, useMemo } from 'react';

interface DialogState<T = unknown> {
  isOpen: boolean;
  data: T | null;
}

interface DialogActions<T = unknown> {
  open: (data?: T) => void;
  close: () => void;
  isOpen: boolean;
  data: T | null;
}

export function useDialogManager<T extends Record<string, unknown> = Record<string, unknown>>() {
  const [dialogStates, setDialogStates] = useState<Record<string, DialogState>>({});

  const createDialog = useCallback(
    <K extends keyof T>(dialogName: K): DialogActions<T[K]> => {
      const state = dialogStates[dialogName as string] ?? { isOpen: false, data: null };

      return {
        open: (data?: T[K]) =>
          setDialogStates((prev) => ({
            ...prev,
            [dialogName]: { isOpen: true, data: data ?? null },
          })),
        close: () =>
          setDialogStates((prev) => ({
            ...prev,
            [dialogName]: { isOpen: false, data: null },
          })),
        isOpen: state.isOpen,
        data: state.data as T[K] | null,
      };
    },
    [dialogStates],
  );

  return useMemo(() => ({ createDialog }), [createDialog]);
}
