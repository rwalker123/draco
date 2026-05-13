#!/bin/bash

set -euo pipefail

# Dependencies: curl, openssl, jq
# Usage: ./scripts/local-smoke-test.sh [--backend-url URL] [--mcp-url URL]
#
# Defaults:
#   backend: http://localhost:3001
#   mcp:     http://localhost:3010
#
# The script performs the OAuth PKCE flow locally. One manual step is required:
# after the consent URL is printed, open it in a browser, approve consent, then
# paste the `code=` parameter from the redirect URL back into the terminal.

BACKEND_URL="http://localhost:3001"
MCP_URL="http://localhost:3010"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Smoke-tests the MCP server against a local backend.

Options:
  --backend-url URL   Backend base URL (default: ${BACKEND_URL})
  --mcp-url URL       MCP server base URL (default: ${MCP_URL})
  -h, --help          Show this message
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-url) BACKEND_URL="$2"; shift 2 ;;
    --mcp-url)     MCP_URL="$2";     shift 2 ;;
    -h|--help)     usage ;;
    *) echo "Unknown option: $1" >&2; usage ;;
  esac
done

CALLBACK_PORT=18675
REDIRECT_URI="http://127.0.0.1:${CALLBACK_PORT}/cb"

log() { echo "[smoke] $*"; }
pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }

# ── 1. Health checks ──────────────────────────────────────────────────────────

log "Checking backend health at ${BACKEND_URL}/health ..."
BACKEND_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" || echo "000")
[[ "$BACKEND_STATUS" == "200" ]] || fail "Backend not reachable (HTTP ${BACKEND_STATUS}). Is 'pnpm backend:dev' running?"
pass "Backend healthy"

log "Checking MCP server health at ${MCP_URL}/health ..."
MCP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${MCP_URL}/health" || echo "000")
[[ "$MCP_STATUS" == "200" ]] || fail "MCP server not reachable (HTTP ${MCP_STATUS}). Is 'pnpm mcp:dev' running?"
pass "MCP server healthy"

# ── 2. Dynamic Client Registration ───────────────────────────────────────────

log "Registering test OAuth client ..."
CLIENT=$(curl -sf -X POST "${BACKEND_URL}/oauth/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"client_name\": \"smoke-test-$(date +%s)\",
    \"redirect_uris\": [\"${REDIRECT_URI}\"],
    \"grant_types\": [\"authorization_code\"],
    \"response_types\": [\"code\"],
    \"token_endpoint_auth_method\": \"none\",
    \"scope\": \"mcp:read\"
  }")
CLIENT_ID=$(echo "$CLIENT" | jq -r '.client_id')
[[ -n "$CLIENT_ID" && "$CLIENT_ID" != "null" ]] || fail "DCR failed: $(echo "$CLIENT" | jq .)"
pass "Registered client: ${CLIENT_ID}"

# ── 3. PKCE ──────────────────────────────────────────────────────────────────

CODE_VERIFIER=$(openssl rand -base64 48 | tr -d '=+/' | head -c 64)
CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr -d '=' | tr '+/' '-_')
STATE=$(openssl rand -hex 16)

AUTH_URL="${BACKEND_URL}/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${REDIRECT_URI}'))")&scope=mcp%3Aread&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"

# ── 4. Capture callback ───────────────────────────────────────────────────────

log ""
log "============================================================"
log "MANUAL STEP: Open the following URL in your browser."
log "Log in and approve the consent screen."
log ""
log "${AUTH_URL}"
log ""

AUTH_CODE=""

if command -v python3 &>/dev/null; then
  log "Waiting for redirect callback on ${REDIRECT_URI} ..."
  log "(Press Ctrl+C to skip and paste the code manually instead)"

  AUTH_CODE=$(python3 - <<'PYEOF'
import http.server, urllib.parse, sys

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_GET(self):
        qs = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(qs)
        code = params.get('code', [None])[0]
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        if code:
            self.wfile.write(b'Consent approved. You may close this tab.')
            print(code, end='')
        else:
            self.wfile.write(b'Missing code param.')
            print('', end='')
        self.server._code = code
    def do_HEAD(self):
        self.send_response(200); self.end_headers()

srv = http.server.HTTPServer(('127.0.0.1', 18675), Handler)
srv.handle_request()
PYEOF
  ) || true
fi

if [[ -z "$AUTH_CODE" ]]; then
  log ""
  read -r -p "Paste the code= value from the redirect URL and press Enter: " AUTH_CODE
fi

[[ -n "$AUTH_CODE" ]] || fail "No authorization code received."
pass "Got authorization code"

# ── 5. Token exchange ─────────────────────────────────────────────────────────

log "Exchanging code for tokens ..."
TOKENS=$(curl -sf -X POST "${BACKEND_URL}/oauth/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=${AUTH_CODE}" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "redirect_uri=${REDIRECT_URI}" \
  --data-urlencode "code_verifier=${CODE_VERIFIER}")
ACCESS_TOKEN=$(echo "$TOKENS" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$TOKENS" | jq -r '.refresh_token // empty')
[[ -n "$ACCESS_TOKEN" && "$ACCESS_TOKEN" != "null" ]] || fail "Token exchange failed: $(echo "$TOKENS" | jq .)"
pass "Got access token"

# ── 6. MCP tools/list ────────────────────────────────────────────────────────

log "Calling tools/list ..."
TOOLS_RESP=$(curl -sf -X POST "${MCP_URL}/mcp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')
TOOL_COUNT=$(echo "$TOOLS_RESP" | jq '.result.tools | length')
[[ "$TOOL_COUNT" -gt 0 ]] || fail "tools/list returned no tools: $(echo "$TOOLS_RESP" | jq .)"
pass "tools/list returned ${TOOL_COUNT} tools:"
echo "$TOOLS_RESP" | jq '[.result.tools[].name]'

# ── 7. list_my_accounts ───────────────────────────────────────────────────────

log "Calling list_my_accounts ..."
ACCOUNTS_RESP=$(curl -sf -X POST "${MCP_URL}/mcp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_my_accounts","arguments":{}}}')
echo "$ACCOUNTS_RESP" | jq .
ACCOUNTS_ERROR=$(echo "$ACCOUNTS_RESP" | jq -r '.error // empty')
[[ -z "$ACCOUNTS_ERROR" ]] || fail "list_my_accounts returned error: ${ACCOUNTS_ERROR}"
pass "list_my_accounts succeeded"

# ── 8. Refresh token ─────────────────────────────────────────────────────────

if [[ -n "$REFRESH_TOKEN" ]]; then
  log "Testing refresh token rotation ..."
  REFRESHED=$(curl -sf -X POST "${BACKEND_URL}/oauth/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "grant_type=refresh_token" \
    --data-urlencode "refresh_token=${REFRESH_TOKEN}" \
    --data-urlencode "client_id=${CLIENT_ID}")
  NEW_ACCESS=$(echo "$REFRESHED" | jq -r '.access_token')
  [[ -n "$NEW_ACCESS" && "$NEW_ACCESS" != "null" ]] || fail "Refresh failed: $(echo "$REFRESHED" | jq .)"
  pass "Refresh token rotation succeeded"

  log "Confirming old refresh token is rejected ..."
  REPLAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BACKEND_URL}/oauth/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "grant_type=refresh_token" \
    --data-urlencode "refresh_token=${REFRESH_TOKEN}" \
    --data-urlencode "client_id=${CLIENT_ID}")
  [[ "$REPLAY_STATUS" == "400" || "$REPLAY_STATUS" == "401" ]] || fail "Replayed refresh token was not rejected (HTTP ${REPLAY_STATUS})"
  pass "Replayed refresh token correctly rejected (HTTP ${REPLAY_STATUS})"

  ACCESS_TOKEN="$NEW_ACCESS"
fi

# ── 9. Revoke and confirm 401 ─────────────────────────────────────────────────

log "Revoking access token ..."
curl -sf -X POST "${BACKEND_URL}/oauth/revoke" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "token=${ACCESS_TOKEN}" \
  --data-urlencode "client_id=${CLIENT_ID}" > /dev/null
pass "Token revoked"

log "Verifying revoked token is rejected by MCP server ..."
POST_REVOKE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${MCP_URL}/mcp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}')
[[ "$POST_REVOKE_STATUS" == "401" ]] || fail "Revoked token was not rejected (HTTP ${POST_REVOKE_STATUS})"
pass "Revoked token correctly returns 401"

# ── Done ──────────────────────────────────────────────────────────────────────

log ""
log "All checks passed."
