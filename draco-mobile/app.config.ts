import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Draco Scorekeeping',
  slug: 'draco-scorekeeping',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'draco-scorekeeping',
  userInterfaceStyle: 'automatic',
  splash: {
    backgroundColor: '#111827'
  },
  updates: {
    url: 'https://u.expo.dev/placeholder',
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#111827'
    }
  },
  plugins: ['expo-secure-store'],
  extra: {
    apiBaseUrl: process.env.MOBILE_API_URL ?? 'http://localhost:3000',
    features: {
      lineupSyncEnabled: process.env.MOBILE_LINEUP_SYNC_ENABLED === 'true'
    }
  }
};

export default config;
