import Constants from 'expo-constants';
import { z } from 'zod';

const ExtraSchema = z.object({
  apiBaseUrl: z.string().min(1)
});

const parsed = ExtraSchema.safeParse(Constants.expoConfig?.extra);

if (!parsed.success) {
  const errorMessage = parsed.error.errors.map((error) => error.message).join(', ');
  throw new Error(`Invalid mobile environment configuration: ${errorMessage}`);
}

export const API_BASE_URL = parsed.data.apiBaseUrl.replace(/\/$/, '');
