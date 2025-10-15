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

## Authentication Overview

- Login form posts to `/api/auth/login` on the existing backend.
- Successful authentication persists the JWT, user metadata, and a 30-day retention timestamp in `expo-secure-store`.
- The `AuthProvider` refreshes the token every 30 minutes via `/api/auth/refresh` while the session is active and automatically clears expired records.

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

## Branding Assets

Binary image assets are intentionally omitted from the repository because our PR tooling cannot transmit them. Expo will fall back to the default icon, splash, and favicon while developing locally. When bespoke artwork is ready, drop the files into `draco-mobile/assets/` in your working copy and reference them in `app.config.ts`; just be sure to exclude the binaries from commits (for example by keeping them in `.git/info/exclude`) so CI and the PR assistant remain happy.

## Troubleshooting Dependency Installs

React Native 0.76 currently depends on React 18.2, so `npm install` will fail if the workspace pulls React 19.
When you hit `ERESOLVE unable to resolve dependency tree` with `react@19.x` and `react-native@0.76.x`, pin React to 18.2.0 (for example, `npx expo install react@18.2.0 react-dom@18.2.0`) before retrying the install.
Avoid `--force` or `--legacy-peer-deps` so we do not mask future compatibility issues.
