import { useState, useCallback, useMemo } from 'react';

export interface Dialog<T> {
  isOpen: boolean;
  data: T | undefined;
  open: (data?: T) => void;
  close: () => void;
}

export function useDialog<T>(): Dialog<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((dialogData?: T) => {
    setData(dialogData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(undefined);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      data,
      open,
      close,
    }),
    [isOpen, data, open, close],
  );
}
