# Draco Scorekeeping Mobile App

The mobile workspace hosts the React Native (Expo) shell for the baseball scorekeeping initiative. It currently provides authentication, navigation scaffolding, and secure token persistence that satisfies the Milestone 1.1 deliverables.

## Getting Started

```bash
cd draco-mobile
npm install
cp .env.example .env
```

Update `.env` with the backend API base URL (e.g., `http://localhost:5000`). Then run the Expo development server from the repository root:

```bash
npm run mobile:start
```

Expo will display a QR code in the terminal you can scan with the Expo Go app, or you can launch an emulator via the on-screen prompts.

## Available Scripts

- `npm run start` – Launch Expo dev server with Metro bundler.
- `npm run lint` – Lint the TypeScript source files.
- `npm run type-check` – Validate the TypeScript project configuration.
- `npm run test` – Execute Vitest unit tests.

## Tooling Notes

- The package declares `"type": "module"`, so config files default to ESM. Metro still loads configs via `require`, so `metro.config.cjs` stays on CommonJS while other tooling (e.g., Babel) uses ESM exports.

## Authentication Overview

- Login form posts to `/api/auth/login` on the existing backend.
- Successful authentication persists the JWT, user metadata, and a 30-day retention timestamp in `expo-secure-store`.
- The `AuthProvider` refreshes the token every 30 minutes via `/api/auth/refresh` while the session is active and automatically clears expired records.

## Schedule & Offline Caching

- Upcoming assignments, team metadata, and scorekeeper permissions hydrate from the backend and are normalized in a Zustand store.
- The cache is persisted to AsyncStorage with a 30-day eviction policy so the dashboard remains usable without connectivity.
- Network requests flow through a lightweight fetch wrapper that logs request/response metadata to aid debugging during local development.

## Lineup Management

- The Lineups tab now supports creating, editing, and deleting lineup templates with optimistic updates.
- Templates, assignments, and mutation queues are persisted locally. Backend sync will be enabled once the lineup API ships, so the UI labels changes as 'Saved locally' and keeps them on device.
- When online with lineup sync enabled, the template form auto-loads the team roster so scorekeepers can drop players into slots without retyping names; offline mode falls back to manual entry.
- Offline assignments are reconciled against upcoming games, and permission scopes (account, league, team) filter the teams that appear in the creation flow.

## Live Scorecard & State Machine

- The Games screen now launches a responsive scorecard grid once you select an assignment. The UI highlights current base occupancy, inning/outs, and aggregate stats alongside undo/redo controls.
- At-bat controls ship with Retrosheet-style presets (e.g., `1B`, `HR`, `Kc`) and configurable runner decisions so advances translate into canonical notation.
- Runner and substitution forms allow quick stolen-base events, pickoffs, or pinch-runner updates with accessible tap targets sized for in-game use.
- All plays flow through a deterministic state machine (`src/state/scorecardStore.ts`) that enforces legal runner movement, tracks inning transitions, and recomputes downstream state when prior events are edited or deleted.

## Retrosheet Parser & Event Log

- The parser in `src/utils/retrosheetParser.ts` converts scorecard inputs into Retrosheet-compatible strings such as `S;B-1;3-H`, `SB12`, or `SUBR:Jamie/Taylor-PR`. Tests document the expected output patterns.
- Each recorded play persists into the offline scorecard log (`src/storage/scorecardStorage.ts`) using schema version 1. Entries capture metadata (timestamp, user, device) plus the raw `ScoreEventInput` so future migrations can rehydrate notation and derived stats deterministically.
- The store exposes derived summaries (pitch count, AB, hits, RBI) that update with every edit, giving scorekeepers instant validation without waiting for backend processing.
- Logs automatically purge after 30 days to align with the wider offline retention policy; deleting or clearing a game removes its record from storage and resets the state machine.

## Shared Contracts & API Client

- All TypeScript types for authentication and future features should be imported from `@draco/shared-schemas` so the mobile app stays aligned with the backend Zod source of truth.
- Network requests must go through the generated SDK exported by `@draco/shared-api-client`, which wraps the OpenAPI definitions used by the web experience.
- When backend contracts change, run `npm run sync:api` from the repository root to regenerate the shared client before updating mobile code.

## Navigation Structure

- **Auth Stack**: Splash/loading screen and login screen.
- **Main Tabs**: Dashboard, Games, Lineups, and Settings placeholders for future milestones.

These scaffolds align with the implementation plan so additional scoring features can plug into the existing navigation hierarchy.

## Cross-Platform UI Toolkit Evaluation

While the Milestone 1.1 scope ships with React Native primitives, future scoring flows should reuse a component library that targets both native and web surfaces. Candidates we are exploring include:

- **React Native Paper** – Material-inspired widgets with solid React Native Web support.
- **React Native Elements** – A broad catalog of themed components and platform awareness.
- **Gluestack UI** – Utility-first styling with primitives shared between native and web.

Adopting one of these libraries will help us maintain a consistent design system as we expand the Expo workspace and the existing Next.js frontend.

### Should we switch right now?

Not yet. The current milestone only renders lightweight authentication flows that do not benefit from bringing in a design system dependency. Introducing a toolkit today would add dozens of transitive packages, increase bundle size, and require the web team to align tokens and theming before we have final design direction. Instead, we will capture requirements during the upcoming scoring UI work, evaluate the libraries against those needs (component coverage, theming API, accessibility parity, and web/native performance), and then standardize on a single toolkit so both the Expo and Next.js apps can adopt it simultaneously.

## Branding Assets

Binary image assets are intentionally omitted from the repository because our PR tooling cannot transmit them. Expo will fall back to the default icon, splash, and favicon while developing locally. When bespoke artwork is ready, drop the files into `draco-mobile/assets/` in your working copy and reference them in `app.config.ts`; just be sure to exclude the binaries from commits (for example by keeping them in `.git/info/exclude`) so CI and the PR assistant remain happy.

## Troubleshooting Dependency Installs

The workspace now targets React Native 0.76.3, which ships an updated peer dependency range that accepts React 19.
If `npm install` still complains about `react@19.x`, remove the root `node_modules` directory and the root `package-lock.json`, then rerun `npm install` from the repository root so the resolver can pick up the updated constraints.
Avoid `--force` or `--legacy-peer-deps`; if errors persist after a clean install, double-check that you are on the latest `main` branch with the React Native upgrade applied.
