'use client';

import { useState } from 'react';

type Mode = 'create' | 'edit';

interface UseConstraintDialogResult<TEntity extends { id: string }, TUpsert> {
  open: boolean;
  dialogKey: string;
  mode: Mode;
  editing: TEntity | undefined;
  openCreate: () => void;
  openEdit: (entity: TEntity) => void;
  close: () => void;
  handleSave: (input: TUpsert) => Promise<void>;
}

export const useConstraintDialog = <TEntity extends { id: string }, TUpsert>(
  onCreate: (input: TUpsert) => Promise<void>,
  onEdit: (id: string, input: TUpsert) => Promise<void>,
): UseConstraintDialogResult<TEntity, TUpsert> => {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState('new');
  const [mode, setMode] = useState<Mode>('create');
  const [editing, setEditing] = useState<TEntity | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setMode('create');
    setDialogKey(`new_${Date.now()}`);
    setOpen(true);
  };

  const openEdit = (entity: TEntity) => {
    setEditing(entity);
    setMode('edit');
    setDialogKey(`edit_${entity.id}_${Date.now()}`);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const handleSave = async (input: TUpsert) => {
    if (mode === 'create') {
      await onCreate(input);
      return;
    }
    if (!editing) {
      throw new Error('Cannot save: edit mode is active but no entity is selected.');
    }
    await onEdit(editing.id, input);
  };

  return { open, dialogKey, mode, editing, openCreate, openEdit, close, handleSave };
};
