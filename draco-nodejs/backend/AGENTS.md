# Backend Agent Guide

- Start with the repo-wide expectations in [Repository Guidelines](../../AGENTS.md).
- Architecture, layering rules, and patterns live in [Backend Architecture - Draco Sports Manager](./BACKEND_ARCHITECTURE.md).

## Daily Workflow
- Develop locally with `npm run backend:dev` from the repo root.
- Run the backend suite with `npm run backend:test`.

## Key Directories
- `src/routes` — Express route definitions, validation, and access control.
- `src/services` — Business logic orchestrating repositories and formatters.
- `src/repositories` — Prisma data access and transactions.
- `prisma` — Schema, migrations, and seed scripts.

Use the architecture guide for deeper dives into patterns, examples, and dos & don'ts for each layer.

⚠️ **Type definition rule:** never introduce new Zod schemas or shared type definitions anywhere in the backend (routes, services, helpers, etc.) without explicit approval from the maintainer. All type shape changes must go through the shared schema workflow once approved.

⚠️ **Service creation rule:** never 'new ServiceName()', always access from the ServiceFactory. If a service isn't exposed to ServiceFactory, expose it, then access via ServiceFactory.getServiceName(). No constructor arguments should be given to a service. It should use ServiceFactory and RepositoryFactory to get the dependent services and respositories.