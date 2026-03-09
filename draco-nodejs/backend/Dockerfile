# Stage 1 – Install all dependencies (dev included for build tools)
FROM node:24-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY draco-nodejs/backend/package.json draco-nodejs/backend/
COPY draco-nodejs/shared/shared-schemas/package.json draco-nodejs/shared/shared-schemas/
COPY draco-nodejs/shared/shared-api-client/package.json draco-nodejs/shared/shared-api-client/
COPY draco-nodejs/stoplight-assets/package.json draco-nodejs/stoplight-assets/
ENV HUSKY=0
RUN npm ci -w @draco/backend -w @draco/shared-schemas -w @draco/shared-api-client -w @draco/stoplight-assets --include-workspace-root

# Stage 2 – Build backend + shared packages
FROM deps AS builder
WORKDIR /app
COPY draco-nodejs/backend/ draco-nodejs/backend/
COPY draco-nodejs/shared/ draco-nodejs/shared/
COPY draco-nodejs/stoplight-assets/ draco-nodejs/stoplight-assets/
RUN npm run backend:prisma-generate
RUN npm run build -w @draco/shared-schemas
RUN npm run sync:api
RUN npm run build -w @draco/backend

# Stage 3 – Production-only deps (separate stage for clean node_modules)
FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY draco-nodejs/backend/package.json draco-nodejs/backend/
COPY draco-nodejs/shared/shared-schemas/package.json draco-nodejs/shared/shared-schemas/
COPY draco-nodejs/shared/shared-api-client/package.json draco-nodejs/shared/shared-api-client/
COPY draco-nodejs/stoplight-assets/package.json draco-nodejs/stoplight-assets/
RUN npm ci -w @draco/backend -w @draco/shared-schemas -w @draco/shared-api-client -w @draco/stoplight-assets --include-workspace-root --omit=dev --ignore-scripts

# Stage 4 – Runtime
FROM node:24-bookworm-slim AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends gnupg curl ca-certificates \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-17 openssl \
    && apt-get purge -y gnupg curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/draco-nodejs/shared ./draco-nodejs/shared
COPY --from=prod-deps /app/draco-nodejs/stoplight-assets ./draco-nodejs/stoplight-assets
COPY --from=prod-deps /app/package.json ./
COPY --from=builder /app/draco-nodejs/backend/dist ./draco-nodejs/backend/dist
COPY --from=builder /app/draco-nodejs/backend/src/generated ./draco-nodejs/backend/src/generated
COPY --from=builder /app/draco-nodejs/backend/prisma ./draco-nodejs/backend/prisma
COPY --from=builder /app/draco-nodejs/backend/prisma.config.ts ./draco-nodejs/backend/prisma.config.ts
COPY --from=builder /app/draco-nodejs/backend/package.json ./draco-nodejs/backend/package.json
COPY --from=builder /app/draco-nodejs/shared/shared-schemas/dist ./draco-nodejs/shared/shared-schemas/dist
COPY --from=builder /app/draco-nodejs/stoplight-assets ./draco-nodejs/stoplight-assets
COPY --from=builder /app/draco-nodejs/backend/openapi.yaml ./openapi.yaml
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "draco-nodejs/backend/dist/src/server.js"]
