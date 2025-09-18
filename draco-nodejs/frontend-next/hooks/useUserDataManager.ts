import { useCallback } from 'react';
import { ContactType } from '@draco/shared-schemas';
import { UserDataManager } from '../types/userDataManager';
import { PaginationAction } from './useUserManagement';

export const useUserDataManager = (dispatch: React.Dispatch<PaginationAction>): UserDataManager => {
  const setLoading = useCallback(
    (isPaginating = false, page?: number) => {
      if (isPaginating && page !== undefined) {
        dispatch({ type: 'START_PAGINATION', page });
      } else {
        dispatch({ type: 'START_LOADING' });
      }
    },
    [dispatch],
  );

  const setData = useCallback(
    (users: ContactType[], hasNext: boolean, hasPrev: boolean, page?: number) => {
      dispatch({
        type: 'SET_DATA',
        users,
        hasNext,
        hasPrev,
        page,
      });
    },
    [dispatch],
  );

  const setError = useCallback((_error: string) => {
    // Error state is managed by the parent hook
    // This function is provided for consistency but doesn't dispatch
  }, []);

  const clearData = useCallback(() => {
    dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
  }, [dispatch]);

  const handleApiError = useCallback((error: unknown, operation: string) => {
    // Error state is managed by the parent hook
    // This function is provided for consistency but doesn't dispatch
    console.error(`API Error in ${operation}:`, error);
  }, []);

  return {
    setLoading,
    setData,
    setError,
    clearData,
    handleApiError,
  };
};
