# Repository Guidelines

## Area-Specific Agent Guides
For domain-specific workflows, start with these focused references:

- Backend: [Backend Agent Guide](draco-nodejs/backend/AGENTS.md)
- Frontend (Next.js): [Frontend Agent Guide](draco-nodejs/frontend-next/AGENTS.md)
- Shared Schemas & API Client: [Shared Agent Guide](draco-nodejs/shared/AGENTS.md)

## Restricted Modifications
- Never create or edit files beneath `draco-nodejs/shared/shared-schemas` without first pausing to obtain explicit approval; stop work and request confirmation before making any change in that directory.
- Avoid the anti-pattern of casting values to `unknown` before re-casting them to another type (e.g., `value as unknown as SomeType`). If a type assertion is absolutely required, cast directly to the final type and consider refining the upstream typings instead.
- Don't make up data model hacks and workarounds because this is restricted, never do that. For example, never force cast like .. as unknown as some other type.

## Project Structure & Module Organization
The root `package.json` supervises npm workspaces for `draco-nodejs/backend`, `draco-nodejs/frontend-next`, and `draco-nodejs/shared/*`. Backend TypeScript code lives in `backend/src` with controllers, routes, services, and middleware split into dedicated folders; database schema and migrations stay in `backend/prisma`. The Next.js app sits in `frontend-next/app` and `components`, with shared state and utilities in `context`, `hooks`, and `utils`. Generated schemas and API clients are stored under `draco-nodejs/shared` and must be regenerated when the OpenAPI spec changes.

## Build, Test, and Development Commands
Always execute scripts from the repository root. Use `npm run dev` for the full stack, or `npm run backend:dev` and `npm run dev -w @draco/frontend-next` when working independently. Production builds rely on `npm run build -w @draco/backend` and `npm run build -w @draco/frontend-next`; `npm run build` performs shared schema sync and both compilations. Test with `npm run backend:test`, `npm run frontend:test`, or `npm run test` for the entire workspace, and run `npm run sync:api` whenever backend contracts change.

## Coding Style & Naming Conventions
TypeScript, ES modules, two-space indentation, and trailing commas are standard. ESLint and Prettier run through Husky, so lint before pushing with `npm run lint --workspaces` and rely on the staged formatter. Prefer `camelCase` for variables and functions, `PascalCase` for React components, services, and types, and `SCREAMING_SNAKE_CASE` for constants. Match filenames to their primary export.

### Optimistic Updates
- **NEVER** introduce optimistic state changes, UI transitions, or server updates. Wait for confirmed data before mutating state or rendering new values.
- This prohibition applies across the entire codebase, including leader tables, filters, and any client interactions that could display stale data. The cost of removing optimistic paths outweighs the perceived responsiveness.

## Testing Guidelines
Vitest powers backend and frontend suites, with Testing Library utilities under `frontend-next/test-utils`. Keep unit tests close to source in `__tests__` directories using `*.test.ts` or `*.test.tsx`, and reserve `*.integration.test.ts` for backend flows in `backend/src/__tests__`. Run `npm run backend:test` and `npm run test:coverage -w @draco/frontend-next` before opening a PR, updating fixtures when API responses shift.

## Commit & Pull Request Guidelines
Commits use concise, imperative summaries (e.g., `refine player classifieds pagination`) and bundle related code with its lint/test fixes. Pull requests should outline intent, highlight affected areas, and list manual or automated test results. Link the tracking issue and attach screenshots or payload samples for UI and API changes.

## Security & Configuration Tips
Never commit secrets: copy `backend/.env.example` for local setup and store credentials outside git. Regenerate shared clients with `npm run sync:api` so backend and frontend stay aligned. `detect-secrets` guards the repo; when it blocks a commit, review the finding and run `npm run secrets:update-baseline` before recommitting. Install `mkcert` so the frontend scripts can trust local HTTPS certificates via `NODE_EXTRA_CA_CERTS`.
