# Stage 1 – Install all dependencies (dev included for build tools)
FROM node:24-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY draco-nodejs/mcp-server/package.json draco-nodejs/mcp-server/
COPY draco-nodejs/backend/package.json draco-nodejs/backend/
COPY draco-nodejs/shared/shared-schemas/package.json draco-nodejs/shared/shared-schemas/
COPY draco-nodejs/shared/shared-api-client/package.json draco-nodejs/shared/shared-api-client/
COPY draco-nodejs/stoplight-assets/package.json draco-nodejs/stoplight-assets/
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --filter @draco/mcp-server... --filter @draco/backend

# Stage 2 – Build shared packages + mcp-server
FROM deps AS builder
WORKDIR /app
COPY draco-nodejs/mcp-server/ draco-nodejs/mcp-server/
COPY draco-nodejs/shared/ draco-nodejs/shared/
COPY draco-nodejs/stoplight-assets/ draco-nodejs/stoplight-assets/
# Backend assets needed to regenerate the shared API client from the committed OpenAPI spec
COPY draco-nodejs/backend/openapi.json draco-nodejs/backend/openapi.json
COPY draco-nodejs/backend/openapi-ts.config.js draco-nodejs/backend/openapi-ts.config.js
RUN pnpm --filter @draco/shared-schemas build
RUN pnpm --filter @draco/backend generate:client
RUN pnpm --filter @draco/mcp-server build

# Stage 3 – Production-only deps (clean node_modules)
FROM node:24-bookworm-slim AS prod-deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY draco-nodejs/mcp-server/package.json draco-nodejs/mcp-server/
COPY draco-nodejs/shared/shared-schemas/package.json draco-nodejs/shared/shared-schemas/
COPY draco-nodejs/shared/shared-api-client/package.json draco-nodejs/shared/shared-api-client/
COPY draco-nodejs/stoplight-assets/package.json draco-nodejs/stoplight-assets/
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @draco/mcp-server...

# Stage 4 – Runtime
FROM node:24-bookworm-slim AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/draco-nodejs/mcp-server/node_modules ./draco-nodejs/mcp-server/node_modules
COPY --from=prod-deps /app/draco-nodejs/shared ./draco-nodejs/shared
COPY --from=prod-deps /app/package.json ./
COPY --from=builder /app/draco-nodejs/mcp-server/dist ./draco-nodejs/mcp-server/dist
COPY --from=builder /app/draco-nodejs/mcp-server/package.json ./draco-nodejs/mcp-server/package.json
COPY --from=builder /app/draco-nodejs/shared/shared-schemas/dist ./draco-nodejs/shared/shared-schemas/dist
# shared-api-client package exports point at TypeScript source; tsx loads them at runtime
COPY --from=builder /app/draco-nodejs/shared/shared-api-client/index.ts ./draco-nodejs/shared/shared-api-client/index.ts
COPY --from=builder /app/draco-nodejs/shared/shared-api-client/generated ./draco-nodejs/shared/shared-api-client/generated
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 3010
WORKDIR /app/draco-nodejs/mcp-server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.MCP_PORT||3010)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx/esm", "dist/src/server.js"]
