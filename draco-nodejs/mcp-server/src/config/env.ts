import { z } from 'zod';

const EnvSchema = z.object({
  MCP_PORT: z.coerce.number().default(3010),
  BACKEND_BASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  OAUTH_ISSUER: z.string().min(1),
  MCP_AUDIENCE: z.string().default('mcp'),
  OAUTH_RESOURCE_METADATA_URL: z
    .string()
    .default('https://localhost:3001/.well-known/oauth-protected-resource'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('development'),
  MCP_RATE_LIMIT_PER_MIN: z.coerce.number().default(60),
  MCP_RATE_LIMIT_PER_HOUR: z.coerce.number().default(600),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Missing or invalid environment variables: ${missing}`);
}

export const env = parsed.data;
