'use client';

import { useState, useEffect } from 'react';
import { UmpireType } from '@draco/shared-schemas';
import { listAccountUmpires } from '@draco/shared-api-client';
import { UmpireRecipientSelection } from '../../../../types/emails/recipients';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { useApiClient } from '../../../../hooks/useApiClient';

export interface UseUmpireSelectionProps {
  accountId: string;
  enabled?: boolean;
  initialUmpireRecipients?: UmpireRecipientSelection[];
}

export interface UseUmpireSelectionResult {
  umpires: UmpireType[];
  selectedUmpireIds: Set<string>;
  umpiresLoading: boolean;
  umpiresError: string | null;
  umpireSelectionCount: number;
  hasUmpires: boolean;

  handleToggleAllUmpires: (checked: boolean) => void;
  handleToggleUmpire: (umpireId: string, checked: boolean) => void;
  setSelectedUmpireIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearUmpireSelections: () => void;
  getUmpireSelections: () => UmpireRecipientSelection[];
}

export function useUmpireSelection({
  accountId,
  enabled = false,
  initialUmpireRecipients,
}: UseUmpireSelectionProps): UseUmpireSelectionResult {
  const apiClient = useApiClient();
  const [umpires, setUmpires] = useState<UmpireType[]>([]);
  const [selectedUmpireIds, setSelectedUmpireIds] = useState<Set<string>>(() => {
    if (initialUmpireRecipients && initialUmpireRecipients.length > 0) {
      return new Set(initialUmpireRecipients.map((item) => item.umpireId));
    }
    return new Set();
  });
  const [umpiresLoading, setUmpiresLoading] = useState(false);
  const [umpiresError, setUmpiresError] = useState<string | null>(null);

  const umpireSelectionCount = selectedUmpireIds.size;
  const hasUmpires = umpires.length > 0;

  useEffect(() => {
    if (!enabled || !accountId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setUmpiresLoading(true);
      setUmpiresError(null);

      try {
        const result = await listAccountUmpires({
          client: apiClient,
          path: { accountId },
          query: { page: 1, limit: 100, skip: 0, sortBy: 'contacts.lastname', sortOrder: 'asc' },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load umpires') as { umpires: UmpireType[] };
        setUmpires(data.umpires || []);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setUmpiresError(err instanceof Error ? err.message : 'Failed to load umpires');
      } finally {
        if (!controller.signal.aborted) {
          setUmpiresLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [enabled, accountId, apiClient]);

  const handleToggleAllUmpires = (checked: boolean) => {
    if (!checked) {
      setSelectedUmpireIds(new Set());
      return;
    }
    const umpiresWithEmail = umpires.filter((umpire) => umpire.email?.trim());
    setSelectedUmpireIds(new Set(umpiresWithEmail.map((item) => item.id)));
  };

  const handleToggleUmpire = (umpireId: string, checked: boolean) => {
    setSelectedUmpireIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(umpireId);
      } else {
        next.delete(umpireId);
      }
      return next;
    });
  };

  const clearUmpireSelections = () => {
    setSelectedUmpireIds(new Set());
  };

  const getUmpireSelections = (): UmpireRecipientSelection[] => {
    const selections: UmpireRecipientSelection[] = [];
    selectedUmpireIds.forEach((id) => {
      const umpire = umpires.find((item) => item.id === id);
      selections.push({
        umpireId: id,
        name: umpire ? `${umpire.firstName} ${umpire.lastName}`.trim() : undefined,
        email: umpire?.email ?? undefined,
      });
    });
    return selections;
  };

  return {
    umpires,
    selectedUmpireIds,
    umpiresLoading,
    umpiresError,
    umpireSelectionCount,
    hasUmpires,

    handleToggleAllUmpires,
    handleToggleUmpire,
    setSelectedUmpireIds,
    clearUmpireSelections,
    getUmpireSelections,
  };
}
