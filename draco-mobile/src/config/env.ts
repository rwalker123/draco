import Constants from 'expo-constants';
import { z } from 'zod';

const FeaturesSchema = z.object({
  lineupSyncEnabled: z.boolean().optional()
});

const ExtraSchema = z.object({
  apiBaseUrl: z.string().min(1),
  features: FeaturesSchema.optional()
});

const parsed = ExtraSchema.safeParse(Constants.expoConfig?.extra ?? {});

if (!parsed.success) {
  const errorMessage = parsed.error.issues.map((issue) => issue.message).join(', ');
  throw new Error(`Invalid mobile environment configuration: ${errorMessage}`);
}

const extra = parsed.data;

export const API_BASE_URL = extra.apiBaseUrl.replace(/\/$/, '');

export const FEATURE_FLAGS = {
  lineupSyncEnabled: extra.features?.lineupSyncEnabled ?? false
} as const;

export const LINEUP_SYNC_ENABLED = FEATURE_FLAGS.lineupSyncEnabled;
