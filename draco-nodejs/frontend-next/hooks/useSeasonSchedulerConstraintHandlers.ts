'use client';

import { useRef, useState, useEffect } from 'react';
import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';

type SignalFn<T> = (signal?: AbortSignal) => Promise<T>;

interface ConstraintOps {
  seasonId: string | null;
  canEdit: boolean;
  listSeasonExclusions: SignalFn<SchedulerSeasonExclusion[]>;
  createSeasonExclusion: (
    input: SchedulerSeasonExclusionUpsert,
  ) => Promise<SchedulerSeasonExclusion>;
  updateSeasonExclusion: (
    id: string,
    input: SchedulerSeasonExclusionUpsert,
  ) => Promise<SchedulerSeasonExclusion>;
  deleteSeasonExclusion: (id: string) => Promise<void>;
  listTeamExclusions: SignalFn<SchedulerTeamExclusion[]>;
  createTeamExclusion: (input: SchedulerTeamExclusionUpsert) => Promise<SchedulerTeamExclusion>;
  updateTeamExclusion: (
    id: string,
    input: SchedulerTeamExclusionUpsert,
  ) => Promise<SchedulerTeamExclusion>;
  deleteTeamExclusion: (id: string) => Promise<void>;
  listUmpireExclusions: SignalFn<SchedulerUmpireExclusion[]>;
  createUmpireExclusion: (
    input: SchedulerUmpireExclusionUpsert,
  ) => Promise<SchedulerUmpireExclusion>;
  updateUmpireExclusion: (
    id: string,
    input: SchedulerUmpireExclusionUpsert,
  ) => Promise<SchedulerUmpireExclusion>;
  deleteUmpireExclusion: (id: string) => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

export const useSeasonSchedulerConstraintHandlers = ({
  seasonId,
  canEdit,
  listSeasonExclusions,
  createSeasonExclusion,
  updateSeasonExclusion,
  deleteSeasonExclusion,
  listTeamExclusions,
  createTeamExclusion,
  updateTeamExclusion,
  deleteTeamExclusion,
  listUmpireExclusions,
  createUmpireExclusion,
  updateUmpireExclusion,
  deleteUmpireExclusion,
  setSuccess,
  setError,
}: ConstraintOps) => {
  const listSeasonExclusionsRef = useRef(listSeasonExclusions);
  const listTeamExclusionsRef = useRef(listTeamExclusions);
  const listUmpireExclusionsRef = useRef(listUmpireExclusions);

  useEffect(() => {
    listSeasonExclusionsRef.current = listSeasonExclusions;
    listTeamExclusionsRef.current = listTeamExclusions;
    listUmpireExclusionsRef.current = listUmpireExclusions;
  }, [listSeasonExclusions, listTeamExclusions, listUmpireExclusions]);

  const [seasonExclusions, setSeasonExclusions] = useState<SchedulerSeasonExclusion[]>([]);
  const [teamExclusions, setTeamExclusions] = useState<SchedulerTeamExclusion[]>([]);
  const [umpireExclusions, setUmpireExclusions] = useState<SchedulerUmpireExclusion[]>([]);

  useEffect(() => {
    if (!canEdit || !seasonId) return;

    const controller = new AbortController();

    const doLoad = async () => {
      const [nextSeasonExcl, nextTeamExcl, nextUmpireExcl] = await Promise.all([
        listSeasonExclusionsRef.current(controller.signal),
        listTeamExclusionsRef.current(controller.signal),
        listUmpireExclusionsRef.current(controller.signal),
      ]);

      if (controller.signal.aborted) return;
      setSeasonExclusions(nextSeasonExcl);
      setTeamExclusions(nextTeamExcl);
      setUmpireExclusions(nextUmpireExcl);
    };

    doLoad().catch((err: unknown) => {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : 'Failed to load constraint data');
    });

    return () => {
      controller.abort();
    };
  }, [canEdit, seasonId, setError]);

  const reloadSeasonExclusions = async () => {
    if (!seasonId) return;
    setSeasonExclusions(await listSeasonExclusionsRef.current());
  };

  const reloadTeamExclusions = async () => {
    if (!seasonId) return;
    setTeamExclusions(await listTeamExclusionsRef.current());
  };

  const reloadUmpireExclusions = async () => {
    if (!seasonId) return;
    setUmpireExclusions(await listUmpireExclusionsRef.current());
  };

  const handleCreateSeasonExclusion = async (input: SchedulerSeasonExclusionUpsert) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await createSeasonExclusion(input);
      setSuccess('Season exclusion created');
      await reloadSeasonExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save season exclusion');
      throw err;
    }
  };

  const handleEditSeasonExclusion = async (
    exclusionId: string,
    input: SchedulerSeasonExclusionUpsert,
  ) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await updateSeasonExclusion(exclusionId, input);
      setSuccess('Season exclusion updated');
      await reloadSeasonExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save season exclusion');
      throw err;
    }
  };

  const handleDeleteSeasonExclusion = async (exclusion: SchedulerSeasonExclusion) => {
    try {
      await deleteSeasonExclusion(exclusion.id);
      await reloadSeasonExclusions();
      setSuccess('Season exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete season exclusion');
    }
  };

  const handleCreateTeamExclusion = async (input: SchedulerTeamExclusionUpsert) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await createTeamExclusion(input);
      setSuccess('Team exclusion created');
      await reloadTeamExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team exclusion');
      throw err;
    }
  };

  const handleEditTeamExclusion = async (
    exclusionId: string,
    input: SchedulerTeamExclusionUpsert,
  ) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await updateTeamExclusion(exclusionId, input);
      setSuccess('Team exclusion updated');
      await reloadTeamExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team exclusion');
      throw err;
    }
  };

  const handleDeleteTeamExclusion = async (exclusion: SchedulerTeamExclusion) => {
    try {
      await deleteTeamExclusion(exclusion.id);
      await reloadTeamExclusions();
      setSuccess('Team exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team exclusion');
    }
  };

  const handleCreateUmpireExclusion = async (input: SchedulerUmpireExclusionUpsert) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await createUmpireExclusion(input);
      setSuccess('Umpire exclusion created');
      await reloadUmpireExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save umpire exclusion');
      throw err;
    }
  };

  const handleEditUmpireExclusion = async (
    exclusionId: string,
    input: SchedulerUmpireExclusionUpsert,
  ) => {
    try {
      if (!seasonId) throw new Error('Missing current season');
      await updateUmpireExclusion(exclusionId, input);
      setSuccess('Umpire exclusion updated');
      await reloadUmpireExclusions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save umpire exclusion');
      throw err;
    }
  };

  const handleDeleteUmpireExclusion = async (exclusion: SchedulerUmpireExclusion) => {
    try {
      await deleteUmpireExclusion(exclusion.id);
      await reloadUmpireExclusions();
      setSuccess('Umpire exclusion deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete umpire exclusion');
    }
  };

  return {
    seasonExclusions,
    teamExclusions,
    umpireExclusions,
    handleCreateSeasonExclusion,
    handleEditSeasonExclusion,
    handleDeleteSeasonExclusion,
    handleCreateTeamExclusion,
    handleEditTeamExclusion,
    handleDeleteTeamExclusion,
    handleCreateUmpireExclusion,
    handleEditUmpireExclusion,
    handleDeleteUmpireExclusion,
  };
};
