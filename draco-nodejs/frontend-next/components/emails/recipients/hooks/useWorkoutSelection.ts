'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  WorkoutSummaryType,
  WorkoutRegistrationType,
  WorkoutStatusType,
} from '@draco/shared-schemas';
import {
  getWorkout,
  listWorkouts,
  listWorkoutRegistrations,
} from '../../../../services/workoutService';
import { WorkoutRecipientSelection } from '../../../../types/emails/recipients';

export type WorkoutWithRegistrants = WorkoutSummaryType & {
  registrants: WorkoutRegistrationType[];
};

export interface UseWorkoutSelectionProps {
  accountId: string;
  token: string | null;
  initialWorkoutRecipients?: WorkoutRecipientSelection[];
  initialWorkoutManagersOnly?: boolean;
}

export interface UseWorkoutSelectionResult {
  activeWorkouts: WorkoutWithRegistrants[];
  recentPastWorkouts: WorkoutWithRegistrants[];
  loadedOlderWorkouts: WorkoutWithRegistrants[];
  olderWorkoutsOptions: WorkoutSummaryType[];
  selectedWorkoutRegistrantIds: Map<string, Set<string>>;
  workoutManagersOnly: boolean;
  selectedOlderWorkoutId: string;

  loadingState: {
    active: boolean;
    pastRecent: boolean;
    older: boolean;
  };
  errorState: {
    active: string | null;
    pastRecent: string | null;
    older: string | null;
  };

  allWorkoutsMap: Map<string, WorkoutWithRegistrants>;
  allWorkouts: WorkoutWithRegistrants[];
  visibleWorkouts: WorkoutWithRegistrants[];
  workoutSelectionCount: number;
  totalWorkoutRegistrants: number;

  loadActiveWorkouts: () => Promise<void>;
  loadRecentPastWorkouts: () => Promise<void>;
  loadOlderWorkoutsOptions: () => Promise<void>;
  loadOlderWorkoutWithRegistrants: (workoutId: string) => Promise<void>;
  handleToggleAllWorkouts: (checked: boolean) => void;
  handleToggleWorkout: (workoutId: string, checked: boolean) => void;
  handleToggleRegistrant: (workoutId: string, registrantId: string, checked: boolean) => void;
  handleWorkoutManagersOnlyToggle: (checked: boolean) => void;
  handleOlderWorkoutSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedOlderWorkoutId: (id: string) => void;
  setSelectedWorkoutRegistrantIds: React.Dispatch<React.SetStateAction<Map<string, Set<string>>>>;
  setWorkoutManagersOnly: React.Dispatch<React.SetStateAction<boolean>>;
  clearWorkoutSelections: () => void;
  getWorkoutSelections: () => WorkoutRecipientSelection[];
}

export function useWorkoutSelection({
  accountId,
  token,
  initialWorkoutRecipients,
  initialWorkoutManagersOnly,
}: UseWorkoutSelectionProps): UseWorkoutSelectionResult {
  const [activeWorkouts, setActiveWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [recentPastWorkouts, setRecentPastWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [loadedOlderWorkouts, setLoadedOlderWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [olderWorkoutsOptions, setOlderWorkoutsOptions] = useState<WorkoutSummaryType[]>([]);

  const [selectedWorkoutRegistrantIds, setSelectedWorkoutRegistrantIds] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [workoutManagersOnly, setWorkoutManagersOnly] = useState<boolean>(
    initialWorkoutManagersOnly ?? false,
  );
  const [selectedOlderWorkoutId, setSelectedOlderWorkoutId] = useState('');

  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const [pastWorkoutsLoading, setPastWorkoutsLoading] = useState(false);
  const [pastWorkoutsError, setPastWorkoutsError] = useState<string | null>(null);
  const [olderWorkoutsLoading, setOlderWorkoutsLoading] = useState(false);
  const [olderWorkoutsError, setOlderWorkoutsError] = useState<string | null>(null);

  const fetchWorkoutsWithRegistrants = useCallback(
    async (params: {
      status: WorkoutStatusType;
      after?: string;
      before?: string;
      limit?: number;
    }): Promise<WorkoutWithRegistrants[]> => {
      const workouts = await listWorkouts(accountId, true, token ?? undefined, params.status, {
        after: params.after,
        before: params.before,
        limit: params.limit,
      });

      return Promise.all(
        workouts.map(async (workout) => {
          const registrants = await listWorkoutRegistrations(
            accountId,
            workout.id,
            token ?? undefined,
          );

          return { ...workout, registrants } satisfies WorkoutWithRegistrants;
        }),
      );
    },
    [accountId, token],
  );

  const loadActiveWorkouts = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setWorkoutsLoading(true);
    setWorkoutsError(null);

    try {
      const workoutsWithRegistrants = await fetchWorkoutsWithRegistrants({ status: 'upcoming' });
      setActiveWorkouts(workoutsWithRegistrants);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workouts';
      setWorkoutsError(message);
    } finally {
      setWorkoutsLoading(false);
    }
  }, [accountId, fetchWorkoutsWithRegistrants]);

  const loadRecentPastWorkouts = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setPastWorkoutsLoading(true);
    setPastWorkoutsError(null);

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const workoutsWithRegistrants = await fetchWorkoutsWithRegistrants({
        status: 'past',
        after: twoWeeksAgo.toISOString(),
        limit: 25,
      });
      setRecentPastWorkouts(workoutsWithRegistrants);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recent past workouts';
      setPastWorkoutsError(message);
    } finally {
      setPastWorkoutsLoading(false);
    }
  }, [accountId, fetchWorkoutsWithRegistrants]);

  const loadOlderWorkoutsOptions = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setOlderWorkoutsLoading(true);
    setOlderWorkoutsError(null);

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const workouts = await listWorkouts(accountId, false, token ?? undefined, 'past', {
        before: twoWeeksAgo.toISOString(),
        limit: 100,
      });
      const sorted = [...workouts].sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      );
      setOlderWorkoutsOptions(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load past workouts list';
      setOlderWorkoutsError(message);
    } finally {
      setOlderWorkoutsLoading(false);
    }
  }, [accountId, token]);

  const loadOlderWorkoutWithRegistrants = useCallback(
    async (workoutId: string) => {
      if (!accountId) {
        return;
      }

      setOlderWorkoutsLoading(true);
      setOlderWorkoutsError(null);

      try {
        const [workout, registrants] = await Promise.all([
          getWorkout(accountId, workoutId, token ?? undefined),
          listWorkoutRegistrations(accountId, workoutId, token ?? undefined),
        ]);
        const workoutWithRegistrants: WorkoutWithRegistrants = {
          ...workout,
          registrants,
        };

        setLoadedOlderWorkouts((prev) => {
          const exists = prev.some((item) => item.id === workoutId);
          if (exists) {
            return prev;
          }
          return [...prev, workoutWithRegistrants];
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load past workout';
        setOlderWorkoutsError(message);
      } finally {
        setOlderWorkoutsLoading(false);
      }
    },
    [accountId, token],
  );

  const allWorkoutsMap = useMemo(() => {
    const map = new Map<string, WorkoutWithRegistrants>();
    [...recentPastWorkouts, ...activeWorkouts, ...loadedOlderWorkouts].forEach((workout) => {
      if (!map.has(workout.id)) {
        map.set(workout.id, workout);
      }
    });
    return map;
  }, [activeWorkouts, recentPastWorkouts, loadedOlderWorkouts]);

  const allWorkouts = useMemo(
    () =>
      Array.from(allWorkoutsMap.values()).sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      ),
    [allWorkoutsMap],
  );

  const visibleWorkouts = useMemo(() => {
    if (!workoutManagersOnly) {
      return allWorkouts;
    }
    return allWorkouts.map((workout) => ({
      ...workout,
      registrants: workout.registrants.filter((registrant) => registrant.isManager),
    }));
  }, [allWorkouts, workoutManagersOnly]);

  const workoutSelectionCount = useMemo(() => {
    let total = 0;
    selectedWorkoutRegistrantIds.forEach((ids) => {
      total += ids.size;
    });
    return total;
  }, [selectedWorkoutRegistrantIds]);

  const totalWorkoutRegistrants = useMemo(
    () => visibleWorkouts.reduce((sum, workout) => sum + workout.registrants.length, 0),
    [visibleWorkouts],
  );

  const handleToggleAllWorkouts = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedWorkoutRegistrantIds(new Map());
        return;
      }

      const next = new Map<string, Set<string>>();
      visibleWorkouts.forEach((workout) => {
        if (workout.registrants.length > 0) {
          next.set(workout.id, new Set(workout.registrants.map((registrant) => registrant.id)));
        }
      });
      setSelectedWorkoutRegistrantIds(next);
    },
    [visibleWorkouts],
  );

  const handleToggleWorkout = useCallback(
    (workoutId: string, checked: boolean) => {
      setSelectedWorkoutRegistrantIds((prev) => {
        const next = new Map(prev);
        const workout = visibleWorkouts.find((item) => item.id === workoutId);
        if (!workout) {
          return prev;
        }

        if (checked) {
          next.set(workoutId, new Set(workout.registrants.map((registrant) => registrant.id)));
        } else {
          next.delete(workoutId);
        }

        return next;
      });
    },
    [visibleWorkouts],
  );

  const handleToggleRegistrant = useCallback(
    (workoutId: string, registrantId: string, checked: boolean) => {
      setSelectedWorkoutRegistrantIds((prev) => {
        const next = new Map(prev);
        const ids = new Set(next.get(workoutId) ?? []);

        if (checked) {
          ids.add(registrantId);
        } else {
          ids.delete(registrantId);
        }

        if (ids.size > 0) {
          next.set(workoutId, ids);
        } else {
          next.delete(workoutId);
        }

        return next;
      });
    },
    [],
  );

  const handleWorkoutManagersOnlyToggle = useCallback(
    (checked: boolean) => {
      setWorkoutManagersOnly(checked);
      if (checked) {
        setSelectedWorkoutRegistrantIds((prev) => {
          const next = new Map<string, Set<string>>();
          visibleWorkouts.forEach((workout) => {
            if (workout.registrants.length === 0) {
              return;
            }
            const existingIds = prev.get(workout.id) ?? new Set<string>();
            const allowedIds = new Set(
              workout.registrants
                .filter((registrant) => registrant.isManager)
                .map((registrant) => registrant.id),
            );
            const filteredIds = new Set(Array.from(existingIds).filter((id) => allowedIds.has(id)));
            if (filteredIds.size > 0) {
              next.set(workout.id, filteredIds);
            }
          });
          return next;
        });
      }
    },
    [visibleWorkouts],
  );

  const handleOlderWorkoutSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const workoutId = event.target.value;
      setSelectedOlderWorkoutId(workoutId);
      if (workoutId) {
        void loadOlderWorkoutWithRegistrants(workoutId);
      }
    },
    [loadOlderWorkoutWithRegistrants],
  );

  const clearWorkoutSelections = useCallback(() => {
    setSelectedWorkoutRegistrantIds(new Map());
  }, []);

  const getWorkoutSelections = useCallback((): WorkoutRecipientSelection[] => {
    const selections: WorkoutRecipientSelection[] = [];

    selectedWorkoutRegistrantIds.forEach((ids, workoutId) => {
      const workout =
        visibleWorkouts.find((item) => item.id === workoutId) ||
        allWorkouts.find((item) => item.id === workoutId);
      const baseWorkout = allWorkouts.find((item) => item.id === workoutId);
      if (!workout || !baseWorkout) {
        return;
      }

      const totalInScope = workoutManagersOnly
        ? baseWorkout.registrants.filter((registrant) => registrant.isManager).length
        : baseWorkout.registrants.length;
      const shouldOmitRegistrationIds = !workoutManagersOnly && ids.size === totalInScope;

      selections.push({
        workoutId,
        workoutDesc: workout.workoutDesc,
        workoutDate: workout.workoutDate,
        totalSelected: ids.size,
        managersOnly: workoutManagersOnly,
        registrationIds: shouldOmitRegistrationIds ? undefined : new Set(ids),
      });
    });

    return selections;
  }, [selectedWorkoutRegistrantIds, visibleWorkouts, allWorkouts, workoutManagersOnly]);

  useEffect(() => {
    if (!workoutManagersOnly) {
      return;
    }
    setSelectedWorkoutRegistrantIds((prev) => {
      const next = new Map<string, Set<string>>();
      visibleWorkouts.forEach((workout) => {
        if (workout.registrants.length === 0) {
          return;
        }
        const existingIds = prev.get(workout.id) ?? new Set<string>();
        const allowedIds = new Set(workout.registrants.map((registrant) => registrant.id));
        const filteredIds = new Set(Array.from(existingIds).filter((id) => allowedIds.has(id)));
        if (filteredIds.size > 0) {
          next.set(workout.id, filteredIds);
        }
      });
      return next;
    });
  }, [workoutManagersOnly, visibleWorkouts]);

  useEffect(() => {
    if (!initialWorkoutRecipients || initialWorkoutRecipients.length === 0) {
      return;
    }

    setSelectedWorkoutRegistrantIds((prev) => {
      if (prev.size > 0 && !allWorkouts.length) {
        return prev;
      }

      const next = new Map<string, Set<string>>();

      initialWorkoutRecipients.forEach((selection) => {
        const workout = allWorkouts.find((item) => item.id === selection.workoutId);
        if (!workout || workout.registrants.length === 0) {
          return;
        }

        const ids =
          selection.registrationIds && selection.registrationIds.size > 0
            ? new Set(Array.from(selection.registrationIds))
            : new Set(workout.registrants.map((registrant) => registrant.id));

        next.set(workout.id, ids);
      });

      return next;
    });
  }, [initialWorkoutRecipients, allWorkouts]);

  return {
    activeWorkouts,
    recentPastWorkouts,
    loadedOlderWorkouts,
    olderWorkoutsOptions,
    selectedWorkoutRegistrantIds,
    workoutManagersOnly,
    selectedOlderWorkoutId,

    loadingState: {
      active: workoutsLoading,
      pastRecent: pastWorkoutsLoading,
      older: olderWorkoutsLoading,
    },
    errorState: {
      active: workoutsError,
      pastRecent: pastWorkoutsError,
      older: olderWorkoutsError,
    },

    allWorkoutsMap,
    allWorkouts,
    visibleWorkouts,
    workoutSelectionCount,
    totalWorkoutRegistrants,

    loadActiveWorkouts,
    loadRecentPastWorkouts,
    loadOlderWorkoutsOptions,
    loadOlderWorkoutWithRegistrants,
    handleToggleAllWorkouts,
    handleToggleWorkout,
    handleToggleRegistrant,
    handleWorkoutManagersOnlyToggle,
    handleOlderWorkoutSelect,
    setSelectedOlderWorkoutId,
    setSelectedWorkoutRegistrantIds,
    setWorkoutManagersOnly,
    clearWorkoutSelections,
    getWorkoutSelections,
  };
}
