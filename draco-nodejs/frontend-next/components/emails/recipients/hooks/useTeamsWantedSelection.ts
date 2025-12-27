'use client';

import { useState, useCallback, useMemo } from 'react';
import { TeamsWantedPublicClassifiedType } from '@draco/shared-schemas';
import { playerClassifiedService } from '../../../../services/playerClassifiedService';
import { TeamsWantedRecipientSelection } from '../../../../types/emails/recipients';

export interface UseTeamsWantedSelectionProps {
  accountId: string;
  token: string | null;
  initialTeamsWantedRecipients?: TeamsWantedRecipientSelection[];
}

export interface UseTeamsWantedSelectionResult {
  teamsWanted: TeamsWantedPublicClassifiedType[];
  selectedTeamsWantedIds: Set<string>;
  teamsWantedLoading: boolean;
  teamsWantedError: string | null;
  teamsWantedSelectionCount: number;
  hasTeamsWanted: boolean;

  loadTeamsWanted: () => Promise<void>;
  handleToggleAllTeamsWanted: (checked: boolean) => void;
  handleToggleTeamsWanted: (classifiedId: string, checked: boolean) => void;
  setSelectedTeamsWantedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearTeamsWantedSelections: () => void;
  getTeamsWantedSelections: () => TeamsWantedRecipientSelection[];
}

export function useTeamsWantedSelection({
  accountId,
  token,
  initialTeamsWantedRecipients,
}: UseTeamsWantedSelectionProps): UseTeamsWantedSelectionResult {
  const [teamsWanted, setTeamsWanted] = useState<TeamsWantedPublicClassifiedType[]>([]);
  const [selectedTeamsWantedIds, setSelectedTeamsWantedIds] = useState<Set<string>>(() => {
    if (initialTeamsWantedRecipients && initialTeamsWantedRecipients.length > 0) {
      return new Set(initialTeamsWantedRecipients.map((item) => item.classifiedId));
    }
    return new Set();
  });
  const [teamsWantedLoading, setTeamsWantedLoading] = useState(false);
  const [teamsWantedError, setTeamsWantedError] = useState<string | null>(null);

  const teamsWantedSelectionCount = useMemo(
    () => selectedTeamsWantedIds.size,
    [selectedTeamsWantedIds],
  );

  const hasTeamsWanted = useMemo(() => teamsWanted.length > 0, [teamsWanted]);

  const loadTeamsWanted = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    setTeamsWantedLoading(true);
    setTeamsWantedError(null);

    try {
      const result = await playerClassifiedService.getTeamsWanted(accountId, undefined, token);
      setTeamsWanted(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Teams Wanted';
      setTeamsWantedError(message);
    } finally {
      setTeamsWantedLoading(false);
    }
  }, [accountId, token]);

  const handleToggleAllTeamsWanted = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedTeamsWantedIds(new Set());
        return;
      }
      setSelectedTeamsWantedIds(new Set(teamsWanted.map((item) => item.id)));
    },
    [teamsWanted],
  );

  const handleToggleTeamsWanted = useCallback((classifiedId: string, checked: boolean) => {
    setSelectedTeamsWantedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(classifiedId);
      } else {
        next.delete(classifiedId);
      }
      return next;
    });
  }, []);

  const clearTeamsWantedSelections = useCallback(() => {
    setSelectedTeamsWantedIds(new Set());
  }, []);

  const getTeamsWantedSelections = useCallback((): TeamsWantedRecipientSelection[] => {
    const selections: TeamsWantedRecipientSelection[] = [];
    selectedTeamsWantedIds.forEach((id) => {
      const classified = teamsWanted.find((item) => item.id === id);
      selections.push({
        classifiedId: id,
        name: classified?.name,
      });
    });
    return selections;
  }, [selectedTeamsWantedIds, teamsWanted]);

  return {
    teamsWanted,
    selectedTeamsWantedIds,
    teamsWantedLoading,
    teamsWantedError,
    teamsWantedSelectionCount,
    hasTeamsWanted,

    loadTeamsWanted,
    handleToggleAllTeamsWanted,
    handleToggleTeamsWanted,
    setSelectedTeamsWantedIds,
    clearTeamsWantedSelections,
    getTeamsWantedSelections,
  };
}
