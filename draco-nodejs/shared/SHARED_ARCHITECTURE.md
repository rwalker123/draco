# Shared Architecture - Draco Sports Manager

## Overview
The shared workspace houses the cross-cutting contracts that keep the backend and frontend in lockstep. It delivers:

- Zod schemas that define canonical request/response shapes.
- An OpenAPI-driven TypeScript SDK consumed by the frontend and other clients.
- Build artifacts that can be published as npm workspaces (`@draco/shared-schemas`, `@draco/shared-api-client`).

Everything in this package flows from a single source of truth: the authoring-time Zod schemas.

## Directory Layout
```
shared/
├── shared-schemas          # Hand-authored Zod schemas + barrel exports
│   └── dist                # Generated ESM/CJS bundles (do not edit)
└── shared-api-client       # Generated API client aligned with OpenAPI spec
    └── generated           # Output from OpenAPI generator (do not edit)
```

## Schema Authoring Principles (`shared-schemas`)
- Define new models with Zod, exporting them using `*.ts` files that match their domain (e.g., `contact.ts`, `roster.ts`).
- Extend Zod with OpenAPI metadata (`extendZodWithOpenApi(z)`) when schemas back REST endpoints so they can be surfaced in the spec automatically.
- Favor transformations that normalize backend types to frontend-ready strings (e.g., `bigint` ➝ `string`) directly in the schema to keep consumers consistent.
- Keep barrel exports in `index.ts` synchronized so both backend and frontend can import the latest types.

Example: `shared-schemas/contact.ts` centralizes every contact-related structure, including transformations, OpenAPI descriptions, and derived helper schemas.

## Generation Workflow
1. Author or update schemas in `shared-schemas` and ensure they compile locally.
2. Run `npm run sync:api` from the repo root.
   - Regenerates the backend OpenAPI specification via `backend/src/openapi/zod-to-openapi.ts`.
   - Emits updated schema bundles in `shared-schemas/dist` for publication.
   - Rebuilds the TypeScript SDK inside `shared-api-client/generated` using the latest OpenAPI spec.
3. Run `npm run build` if you need to confirm workspace packaging or produce production bundles.
4. Commit both the source changes and generated artifacts so downstream packages stay aligned.

## API Client Guidelines (`shared-api-client`)
- Treat `generated/**` as read-only output. If an endpoint needs a different shape, modify the Zod schema or OpenAPI metadata, then rerun `npm run sync:api`.
- Consume the SDK through `@draco/shared-api-client` exports; the frontend hooks (e.g., `useUserManagement`) rely on these signatures remaining in sync with the backend contract.
- When adding cross-cutting utilities (custom fetch wrappers, interceptors), place them outside `generated/` so regeneration does not overwrite them.

## Quality Checks
- `npm run lint --workspaces` validates TypeScript types across consumers, catching schema drift early.
- Unit or integration tests in backend/frontend that cover new contracts should be updated alongside schema changes to prevent regressions.
- Avoid hand-editing anything under `dist/` or `generated/`; those directories are overwritten by the generation pipeline.

Keeping schemas authoritative and regeneration runs frequent ensures every package in the monorepo works with identical contracts.
