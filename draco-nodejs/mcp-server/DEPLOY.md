# MCP Server Deployment

## One-time setup

### Backend env (set in existing Draco backend Railway service)

```
OAUTH_ISSUER=https://api.draco.com
OAUTH_PEPPER=<generate: openssl rand -hex 32>
MCP_RESOURCE_URL=https://mcp.draco.com/mcp
FRONTEND_BASE_URL=https://app.draco.com
OAUTH_RESOURCE_METADATA_URL=https://api.draco.com/.well-known/oauth-protected-resource
```

### Frontend env

```
NEXT_PUBLIC_MCP_URL=https://mcp.draco.com/mcp
```

### MCP server (new Railway service)

**Service name:** `draco-mcp`

**Build:** Dockerfile — set build context to the **repository root** and Dockerfile path to `draco-nodejs/mcp-server/Dockerfile`. The multi-stage build copies the entire monorepo so workspace deps resolve correctly.

**Domain:** `mcp.draco.com` (Railway-managed TLS cert)

**Env vars:**

```
MCP_PORT=8080
BACKEND_BASE_URL=https://api.draco.com
JWT_SECRET=<MUST match backend JWT_SECRET exactly>
OAUTH_ISSUER=https://api.draco.com
MCP_AUDIENCE=mcp
OAUTH_RESOURCE_METADATA_URL=https://api.draco.com/.well-known/oauth-protected-resource
LOG_LEVEL=info
MCP_RATE_LIMIT_PER_MIN=60
MCP_RATE_LIMIT_PER_HOUR=600
NODE_ENV=production
```

Note: Railway injects `PORT` automatically. The MCP server reads `MCP_PORT`; set `MCP_PORT=8080` (or match whatever Railway allocates) and ensure the Dockerfile `EXPOSE` value is updated accordingly if Railway requires a specific port binding. The healthcheck uses `MCP_PORT` at runtime.

### DCR redirect URI policy

The `OauthService.validateRedirectUri()` already enforces the following rules in production:
- Only `https://` redirect URIs are accepted (except loopback).
- Loopback addresses (`http://127.0.0.1`, `http://localhost`) are always permitted to support Claude Desktop and local developer tools regardless of environment.
- Arbitrary non-loopback `http://` URIs are rejected.

No additional configuration is required at v1. If a strict production allowlist becomes necessary, add `OAUTH_REDIRECT_URI_ALLOWLIST` env var handling to `oauthService.ts`.

## Database migration

The OAuth Prisma migration (`20260509000000_add_oauth_tables`) is included in the backend repo. It runs automatically on Railway deploy via the backend service's pre-start command (`pnpm exec prisma migrate deploy`).

Verify after deploying the backend:

1. Check Railway backend service logs for: `Applying migration '20260509000000_add_oauth_tables'`
2. Confirm the following 5 tables exist (via Prisma Studio or psql):
   - `oauth_client`
   - `oauth_authorization_code`
   - `oauth_access_token`
   - `oauth_refresh_token`
   - `oauth_consent_request`

## DNS

Add a CNAME for `mcp.draco.com` pointing at the Railway-allocated hostname. Railway shows the CNAME target in the service's **Settings → Domains** panel after the service is created. Railway provisions the TLS certificate automatically once DNS propagates.

## Smoke test after deploy

Dependencies: `curl`, `openssl`, `jq`

### 1. Register a test OAuth client (Dynamic Client Registration)

```bash
CLIENT=$(curl -sf -X POST https://api.draco.com/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "smoke-test",
    "redirect_uris": ["http://127.0.0.1:18675/cb"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none",
    "scope": "mcp:read"
  }')
echo "$CLIENT" | jq .
CLIENT_ID=$(echo "$CLIENT" | jq -r '.client_id')
```

### 2. Generate PKCE values

```bash
CODE_VERIFIER=$(openssl rand -base64 48 | tr -d '=+/' | head -c 64)
CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr -d '=' | tr '+/' '-_')
STATE=$(openssl rand -hex 16)
```

### 3. Open the authorization URL in a browser

```bash
AUTH_URL="https://api.draco.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=http%3A%2F%2F127.0.0.1%3A18675%2Fcb&scope=mcp%3Aread&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"
echo "Open this URL in your browser and log in / approve consent:"
echo "$AUTH_URL"
```

After approving consent, the browser redirects to `http://127.0.0.1:18675/cb?code=<CODE>&state=<STATE>`. Copy the `code` value.

```bash
read -r -p "Paste the code= value from the redirect URL: " AUTH_CODE
```

### 4. Exchange the code for tokens

```bash
TOKENS=$(curl -sf -X POST https://api.draco.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code" \
  -d "code=${AUTH_CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "redirect_uri=http%3A%2F%2F127.0.0.1%3A18675%2Fcb" \
  -d "code_verifier=${CODE_VERIFIER}")
echo "$TOKENS" | jq .
ACCESS_TOKEN=$(echo "$TOKENS" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$TOKENS" | jq -r '.refresh_token')
```

### 5. Call the MCP server — list available tools

```bash
curl -sf -X POST https://mcp.draco.com/mcp \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq .
```

### 6. Call the `list_my_accounts` tool

```bash
curl -sf -X POST https://mcp.draco.com/mcp \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_my_accounts","arguments":{}}}' | jq .
```

### 7. Revoke the access token and confirm 401

```bash
curl -sf -X POST https://api.draco.com/oauth/revoke \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "token=${ACCESS_TOKEN}" \
  -d "client_id=${CLIENT_ID}"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://mcp.draco.com/mcp \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}')
echo "Expected 401, got: ${HTTP_STATUS}"
```

### 8. Connect via Claude Desktop (recommended end-to-end test)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "draco": {
      "type": "streamable-http",
      "url": "https://mcp.draco.com/mcp",
      "oauth": {
        "clientId": "auto",
        "authorizationServer": "https://api.draco.com"
      }
    }
  }
}
```

Restart Claude Desktop, open a conversation, and ask: "What baseball accounts do I belong to?"
