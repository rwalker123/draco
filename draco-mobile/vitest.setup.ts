import { vi } from 'vitest';
import mockSecureStore from './test-utils/mockSecureStore';
import mockAsyncStorage from './test-utils/mockAsyncStorage';

const networkListeners: Array<(state: { isConnected: boolean }) => void> = [];

vi.mock('expo-secure-store', () => ({
  ...mockSecureStore,
  default: mockSecureStore
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
  ...mockAsyncStorage
}));

vi.mock('expo-network', () => ({
  getNetworkStateAsync: vi.fn(async () => ({ isConnected: true })),
  addNetworkStateListener: (listener: (state: { isConnected: boolean }) => void) => {
    networkListeners.push(listener);
    return {
      remove: () => {
        const index = networkListeners.indexOf(listener);
        if (index >= 0) {
          networkListeners.splice(index, 1);
        }
      }
    };
  },
  __emit(state: { isConnected: boolean }) {
    networkListeners.forEach((listener) => listener(state));
  }
}));
