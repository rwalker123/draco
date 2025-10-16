import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: Network.NetworkStateSubscription | null = null;

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

    subscription = Network.addNetworkStateListener((state) => {
      setIsOnline(Boolean(state.isConnected));
    });

    void updateState();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return { isOnline };
}
