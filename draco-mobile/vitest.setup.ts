import { vi } from 'vitest';
import mockSecureStore from './test-utils/mockSecureStore';

vi.mock('expo-secure-store', () => ({
  ...mockSecureStore,
  default: mockSecureStore
}));
