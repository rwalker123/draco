import { z } from 'zod';

const intEnv = (defaultValue: number, min: number, max?: number) =>
  z.preprocess(
    (v) => (v === undefined || (typeof v === 'string' && v.trim() === '') ? defaultValue : v),
    max !== undefined
      ? z.coerce.number().int().min(min).max(max)
      : z.coerce.number().int().min(min),
  );

const EnvSchema = z.object({
  MCP_PORT: intEnv(3010, 1, 65535),
  BACKEND_BASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  OAUTH_ISSUER: z.string().min(1),
  MCP_AUDIENCE: z.string().default('mcp'),
  OAUTH_RESOURCE_METADATA_URL: z
    .string()
    .default('https://localhost:3001/.well-known/oauth-protected-resource'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('development'),
  MCP_RATE_LIMIT_PER_MIN: intEnv(60, 1),
  MCP_RATE_LIMIT_PER_HOUR: intEnv(600, 1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Missing or invalid environment variables: ${missing}`);
}

export const env = parsed.data;
