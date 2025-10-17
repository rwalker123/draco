import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove?: () => void } | null = null;
    let appStateSubscription: { remove?: () => void } | null = null;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const updateState = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (isMounted) {
          setIsOnline(Boolean(state.isConnected));
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      }
    };

    const addNetworkStateListener =
      (Network as unknown as { addNetworkStateListener?: (listener: (state: Network.NetworkState) => void) => { remove?: () => void } })
        .addNetworkStateListener;

    if (typeof addNetworkStateListener === 'function') {
      subscription = addNetworkStateListener((state) => {
        if (isMounted) {
          setIsOnline(Boolean(state?.isConnected));
        }
      });
    } else {
      const handleAppStateChange = (status: AppStateStatus) => {
        if (status === 'active') {
          void updateState();
        }
      };

      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      pollingInterval = setInterval(() => {
        void updateState();
      }, 30000);
    }

    void updateState();

    return () => {
      isMounted = false;
      subscription?.remove?.();
      appStateSubscription?.remove?.();
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return { isOnline };
}
