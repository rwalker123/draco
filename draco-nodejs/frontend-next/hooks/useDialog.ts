import { useState } from 'react';

export interface Dialog<T> {
  isOpen: boolean;
  data: T | undefined;
  open: (data?: T) => void;
  close: () => void;
}

export function useDialog<T>(): Dialog<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = (dialogData?: T) => {
    setData(dialogData);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setData(undefined);
  };

  return {
    isOpen,
    data,
    open,
    close,
  };
}
