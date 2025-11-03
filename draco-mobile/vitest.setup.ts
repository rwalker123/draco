import { vi } from 'vitest';
import mockSecureStore from './test-utils/mockSecureStore';
import mockAsyncStorage from './test-utils/mockAsyncStorage';

const networkListeners: Array<(state: { isConnected: boolean }) => void> = [];

vi.stubGlobal('__DEV__', false);

vi.mock('expo-secure-store', () => ({
  ...mockSecureStore,
  default: mockSecureStore
}));

vi.mock('expo-modules-core', () => {
  class MockEventEmitter {
    addListener() {
      return { remove: () => {} };
    }

    removeAllListeners() {}

    emit() {}
  }

  return {
    EventEmitter: MockEventEmitter,
    NativeModulesProxy: {},
    default: {},
    requireNativeModule: vi.fn(() => ({})),
    requireOptionalNativeModule: vi.fn(() => null),
    createModuleNamespace: vi.fn(() => ({})),
    Platform: { OS: 'ios' },
  };
});

vi.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    installationId: 'test-installation',
    manifest: {},
    expoVersion: '1.0.0',
    expoConfig: {
      extra: {
        apiBaseUrl: 'https://api.test',
        features: {
          lineupSyncEnabled: true,
        },
      },
    },
  },
  AppOwnership: { STANDALONE: 'standalone' },
  ExecutionEnvironment: { STANDALONE: 'standalone' },
  UserInterfaceIdiom: { PHONE: 'phone' },
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
