# Frontend Agent Guide

- Ground yourself with the shared [Repository Guidelines](../../AGENTS.md).
- UI architecture practices live in [Frontend Architecture - Draco Sports Manager](./FRONTEND_ARCHITECTURE.md).

## Daily Workflow
- Launch the Next.js app with `npm run dev -w @draco/frontend-next` from the repo root.
- Run the Vitest suite with `npm run frontend:test` or `npm run test:coverage -w @draco/frontend-next`.
- Regenerate shared clients with `npm run sync:api` after backend contract updates.

## Key Directories
- `app` — Next.js App Router entries and nested layouts.
- `components` — Reusable UI pieces following the dialog and service hook patterns.
- `hooks` and `context` — State orchestration and cross-cutting concerns.
- `types` and `utils` — Shared types and helpers sourced from `@draco/shared-schemas`.

Refer back to the architecture guide for component patterns, data flow, and integration examples.

## OpenAPI Client Usage
- Always create the generated OpenAPI client with `useApiClient()`.
- Every call to a generated operation **must** include `client: apiClient` in the options object (see `useRosterDataManager` for examples).
- Omitting the client causes the helper to throw because it lacks the HTTP transport configuration.
