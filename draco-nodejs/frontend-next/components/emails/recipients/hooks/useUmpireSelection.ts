'use client';

import { useState, useCallback, useMemo } from 'react';
import { UmpireType } from '@draco/shared-schemas';
import { UmpireRecipientSelection } from '../../../../types/emails/recipients';

type UmpireServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface UseUmpireSelectionProps {
  accountId: string;
  token: string | null;
  listUmpires: (params: {
    limit?: number;
  }) => Promise<UmpireServiceResult<{ umpires: UmpireType[]; pagination?: unknown }>>;
  initialUmpireRecipients?: UmpireRecipientSelection[];
}

export interface UseUmpireSelectionResult {
  umpires: UmpireType[];
  selectedUmpireIds: Set<string>;
  umpiresLoading: boolean;
  umpiresError: string | null;
  umpireSelectionCount: number;
  hasUmpires: boolean;

  loadUmpires: () => Promise<void>;
  handleToggleAllUmpires: (checked: boolean) => void;
  handleToggleUmpire: (umpireId: string, checked: boolean) => void;
  setSelectedUmpireIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearUmpireSelections: () => void;
  getUmpireSelections: () => UmpireRecipientSelection[];
}

export function useUmpireSelection({
  accountId,
  token,
  listUmpires,
  initialUmpireRecipients,
}: UseUmpireSelectionProps): UseUmpireSelectionResult {
  const [umpires, setUmpires] = useState<UmpireType[]>([]);
  const [selectedUmpireIds, setSelectedUmpireIds] = useState<Set<string>>(() => {
    if (initialUmpireRecipients && initialUmpireRecipients.length > 0) {
      return new Set(initialUmpireRecipients.map((item) => item.umpireId));
    }
    return new Set();
  });
  const [umpiresLoading, setUmpiresLoading] = useState(false);
  const [umpiresError, setUmpiresError] = useState<string | null>(null);

  const umpireSelectionCount = useMemo(() => selectedUmpireIds.size, [selectedUmpireIds]);

  const hasUmpires = useMemo(() => umpires.length > 0, [umpires]);

  const loadUmpires = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    setUmpiresLoading(true);
    setUmpiresError(null);

    try {
      const result = await listUmpires({ limit: 100 });

      if (result.success) {
        setUmpires(result.data.umpires || []);
      } else {
        setUmpiresError(result.error ?? 'Failed to load umpires');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load umpires';
      setUmpiresError(message);
    } finally {
      setUmpiresLoading(false);
    }
  }, [accountId, token, listUmpires]);

  const handleToggleAllUmpires = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedUmpireIds(new Set());
        return;
      }
      const umpiresWithEmail = umpires.filter((umpire) => umpire.email?.trim());
      setSelectedUmpireIds(new Set(umpiresWithEmail.map((item) => item.id)));
    },
    [umpires],
  );

  const handleToggleUmpire = useCallback((umpireId: string, checked: boolean) => {
    setSelectedUmpireIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(umpireId);
      } else {
        next.delete(umpireId);
      }
      return next;
    });
  }, []);

  const clearUmpireSelections = useCallback(() => {
    setSelectedUmpireIds(new Set());
  }, []);

  const getUmpireSelections = useCallback((): UmpireRecipientSelection[] => {
    const selections: UmpireRecipientSelection[] = [];
    selectedUmpireIds.forEach((id) => {
      const umpire = umpires.find((item) => item.id === id);
      selections.push({
        umpireId: id,
        name: umpire?.displayName,
        email: umpire?.email ?? undefined,
      });
    });
    return selections;
  }, [selectedUmpireIds, umpires]);

  return {
    umpires,
    selectedUmpireIds,
    umpiresLoading,
    umpiresError,
    umpireSelectionCount,
    hasUmpires,

    loadUmpires,
    handleToggleAllUmpires,
    handleToggleUmpire,
    setSelectedUmpireIds,
    clearUmpireSelections,
    getUmpireSelections,
  };
}
