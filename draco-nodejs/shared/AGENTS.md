# Shared Agent Guide

- Start with the root [Repository Guidelines](../../AGENTS.md) for workspace-wide standards.
- Architectural details and generation flow live in [Shared Architecture - Draco Sports Manager](./SHARED_ARCHITECTURE.md).

## Restricted Modifications
- Never create or edit files beneath `draco-nodejs/shared/shared-schemas` without first pausing to obtain explicit approval; stop work and request confirmation before making any change in that directory.
- Don't make up data model hacks and workarounds because this is restricted, never do that. For example, never force cast like .. as unknown as some other type.

## Daily Workflow
- Regenerate schemas and the API client via `npm run sync:api` whenever backend contracts or Zod definitions change.
- Run `npm run build` to confirm emitted artifacts in `shared-schemas/dist` and `shared-api-client/generated` are up to date.
- Execute `npm run lint --workspaces` before committing to catch formatting or type drift that affects shared packages.

## Key Directories
- `shared-schemas` — Source-of-truth Zod schemas exported to both backend and frontend packages.
- `shared-schemas/dist` — Compiled ESM/CJS bundles published to consumers; generated, do not edit manually.
- `shared-api-client/generated` — OpenAPI-driven TypeScript client used by the frontend; also generated, edit templates upstream.

Check the architecture guide for how schemas, OpenAPI, and generated clients stay in sync across the monorepo.
