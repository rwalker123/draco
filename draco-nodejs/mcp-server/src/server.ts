import './config/loadEnv.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.MCP_PORT, () => {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'server_ready',
      port: env.MCP_PORT,
      backendBaseUrl: env.BACKEND_BASE_URL,
    }),
  );
});
