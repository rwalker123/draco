import { useSyncExternalStore } from 'react';

type StateUpdater<T> = (partial: Partial<T> | T | ((state: T) => Partial<T> | T), replace?: boolean) => void;
type StateGetter<T> = () => T;

export type StoreApi<T> = {
  getState: StateGetter<T>;
  setState: StateUpdater<T>;
  subscribe: (listener: () => void) => () => void;
};

type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
} & StoreApi<T>;

export type StateCreator<T> = (set: StateUpdater<T>, get: StateGetter<T>) => T;

export function createStore<TState>(initializer: StateCreator<TState>): UseStore<TState> {
  let state: TState;
  const listeners = new Set<() => void>();

  const getState: StateGetter<TState> = () => state;

  const setState: StateUpdater<TState> = (partial, replace = false) => {
    const nextState = typeof partial === 'function' ? (partial as (state: TState) => Partial<TState> | TState)(state) : partial;

    if (nextState === state) {
      return;
    }

    const newState = replace ? (nextState as TState) : { ...state, ...(nextState as Partial<TState>) };
    state = newState;
    listeners.forEach((listener) => listener());
  };

  state = initializer(setState, getState);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = (<U>(selector?: (state: TState) => U): U => {
    const getSnapshot = () => (selector ? selector(state) : (state as unknown as U));
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }) as UseStore<TState>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
