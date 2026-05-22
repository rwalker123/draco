# @draco/mcp-server

ezRecSports MCP server — exposes ezRecSports sports data to LLM clients (Claude, ChatGPT, Cursor, etc.) via the Model Context Protocol.

MCP SDK version pinned to **1.29.0** — revisit quarterly.

## Tools

| Tool | Description |
|---|---|
| `get_my_batting_stats` | Career batting stats (AB, H, R, HR, RBI, AVG, OBP, SLG, OPS) |
| `get_my_pitching_stats` | Career pitching stats (IP, W, L, S, ERA, WHIP, K/9) |
| `get_recent_games` | Most recently played games for the user's team(s) |
| `get_team_managers` | Managers/coaches for a specific team season |
| `get_team_roster` | Public roster (name + jersey number; no PII) |
| `get_team_schedule` | Full team schedule with optional date range filter |
| `get_upcoming_games` | Next upcoming games for the user's team(s) |
| `list_my_accounts` | All ezRecSports accounts the user belongs to |
| `list_my_teams` | Teams the user is on for a given account/season |

All date output is rendered in the account's local timezone (`accounts.timezoneid`).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MCP_PORT` | No | `3010` | Port to listen on |
| `BACKEND_BASE_URL` | Yes | — | ezRecSports backend URL (e.g. `https://localhost:3001` locally — backend uses mkcert HTTPS) |
| `JWT_SECRET` | Yes | — | Shared JWT secret with backend |
| `OAUTH_ISSUER` | Yes | — | OAuth issuer URL (must match backend's `OAUTH_ISSUER`) |
| `MCP_AUDIENCE` | No | `mcp` | Expected JWT `aud` claim |
| `OAUTH_RESOURCE_METADATA_URL` | No | `https://localhost:3001/.well-known/oauth-protected-resource` | Used in WWW-Authenticate headers |
| `NODE_EXTRA_CA_CERTS` | Locally | — | Path to mkcert rootCA.pem so Node trusts the backend's local HTTPS cert |
| `LOG_LEVEL` | No | `info` | Log level |
| `MCP_RATE_LIMIT_PER_MIN` | No | `60` | Max requests per minute per token (`jti`) |
| `MCP_RATE_LIMIT_PER_HOUR` | No | `600` | Max requests per hour per token (`jti`) |

## Rate Limiting

Two sliding-window limits are applied per `jti` (per OAuth access token):

- **60 calls / minute** (configurable via `MCP_RATE_LIMIT_PER_MIN`)
- **600 calls / hour** (configurable via `MCP_RATE_LIMIT_PER_HOUR`)

When a limit is exceeded, the server responds with `429 Too Many Requests` and `Retry-After` headers:

```json
{
  "error": "rate_limited",
  "error_description": "Too many requests. Try again later."
}
```

If the bearer token can't be decoded (malformed), the rate limit falls back to IP address.

## How to Test Locally

1. Start the ezRecSports backend:
   ```sh
   pnpm backend:dev
   ```

2. In a separate terminal, start the MCP server. The backend uses HTTPS locally
   (mkcert-issued cert), so set `NODE_EXTRA_CA_CERTS` to the mkcert root CA so
   the MCP server's HTTPS client trusts it:
   ```sh
   BACKEND_BASE_URL=https://localhost:3001 \
   JWT_SECRET=<your-jwt-secret> \
   OAUTH_ISSUER=https://localhost:3001 \
   NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
   pnpm mcp:dev
   ```
   You should see `{"event":"server_ready","port":3010,...}` in the logs.

3. Obtain a token via the OAuth flow:
   - Register a client via `POST https://localhost:3001/oauth/register`
   - Complete the authorization code + PKCE flow at `https://localhost:3001/oauth/authorize`
   - Exchange the code at `POST https://localhost:3001/oauth/token`

4. Point Claude Desktop at the MCP server by adding this to your Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "ezRecSports": {
         "url": "http://localhost:3010/mcp",
         "token": "<your-access-token>"
       }
     }
   }
   ```

5. Test with natural language: "What baseball accounts do I belong to?", "When's my next game?", "Show me my batting stats."

## Development

```sh
# From repo root:
pnpm mcp:dev
```

## Testing

```sh
pnpm mcp:test
```

## Build

```sh
pnpm mcp:build
```
