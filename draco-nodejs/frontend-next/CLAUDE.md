# Frontend Guide

- Ground yourself with the shared [Repository Guidelines](../../CLAUDE.md).
- For detailed examples, diagrams, and complete implementations, see [Frontend Reference](./FRONTEND_REFERENCE.md).
- Follow the "Derived Data in Render" section below which cites React's [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

## Daily Workflow
- Launch the Next.js app with `npm run dev -w @draco/frontend-next` from the repo root.
- Run the Vitest suite with `npm run frontend:test` or `npm run test:coverage -w @draco/frontend-next`.
- Regenerate shared clients with `npm run sync:api` after backend contract updates.
- After changes, run `npm run frontend:lint` and check for errors.
- If you add a new route with metadata, use the helpers in `lib/metadataParams` for both `searchParams` and `params`.

## React Compiler (Automatic Memoization)
**Do not introduce `useMemo` or `useCallback`** — the React Compiler handles memoization automatically at build time. If you believe manual memoization is necessary, stop and ask for approval first.

### Avoiding Infinite Loops

When removing manual memoization, you may encounter "Maximum update depth exceeded" errors. Common causes and fixes:

**Problem: Function from hook in useEffect dependencies**
```typescript
// ❌ BAD: fetchData is a new reference every render → infinite loop
const { fetchData } = useSomeHook();
useEffect(() => {
  fetchData();
}, [fetchData]);
```

**Solution: Inline API calls directly into useEffect**
```typescript
// ✅ GOOD: Inline the API call, use stable deps only
useEffect(() => {
  const loadData = async () => {
    const result = await apiOperation({
      client: apiClient,
      path: { accountId },
    });
    setData(unwrapApiResult(result, 'Failed to load'));
  };
  loadData();
}, [accountId, apiClient]); // apiClient is module-level cached, accountId is a prop
```

**Problem: Callback props causing parent re-renders**
```typescript
// ❌ BAD: Parent re-renders when callback fires, child re-renders, fires again
<Widget onDataLoaded={(data) => setHasData(data.length > 0)} />
```

**Solution: Make components self-contained**
```typescript
// ✅ GOOD: Component handles its own visibility logic
<Widget autoHide /> // Widget returns null internally if no data
```

**When refs are appropriate:**
- Caching values across calls within a hook (e.g., season ID cache)
- Deduplicating concurrent API requests (e.g., in-flight promise ref)

**When refs are NOT appropriate:**
- As workarounds to exclude values from dependency arrays
- To "skip" effects that ESLint says need dependencies
- Tracking mounted state to avoid setState after unmount — use AbortController instead (see below)

### AbortController for Effect Cleanup

Every `useEffect` that makes API calls **must** use `AbortController` to cancel in-flight requests on unmount or dependency change. Boolean guard patterns (`let cancelled = false`, `let ignore = false`, `let isMounted = true`) only prevent state updates — they do **not** cancel the underlying HTTP request, which causes memory leaks during rapid navigation.

```typescript
useEffect(() => {
  if (!accountId) return;

  const controller = new AbortController();

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiOperation({
        client: apiClient,
        path: { accountId },
        signal: controller.signal,
        throwOnError: false,
      });

      if (controller.signal.aborted) return;
      const data = unwrapApiResult(result, 'Failed to load data');
      setData(data);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  void loadData();

  return () => {
    controller.abort();
  };
}, [accountId, apiClient]);
```

**Rules:**
- Create `AbortController` at the top of the effect
- Pass `controller.signal` to every API call in the effect
- Check `controller.signal.aborted` after every `await` before calling `setState`
- Guard `setLoading(false)` in `finally` with `!controller.signal.aborted`
- Return `() => { controller.abort(); }` as the cleanup function
- When a service or hook function wraps an API call, accept an optional `signal?: AbortSignal` parameter and thread it through

**Do not use** boolean guard patterns (`let cancelled`, `let ignore`, `let isMounted`) for new code. Existing instances should be migrated to AbortController when the file is touched.

**Reference implementations:** `hooks/usePendingPhotoSubmissions.ts`, `hooks/usePhotoGallery.ts`, `components/team/TeamManagersWidget.tsx`

## Key Directories
- `app` — Next.js App Router entries and nested layouts.
- `components` — Reusable UI pieces following the dialog and service hook patterns.
- `hooks` and `context` — State orchestration and cross-cutting concerns.
- `types` and `utils` — Shared types and helpers sourced from `@draco/shared-schemas`.
- `lib/metadataParams` — Canonical helpers for `generateMetadata` inputs.

## Critical Patterns

### OpenAPI Client Usage
- Always create the generated OpenAPI client with `useApiClient()`.
- Every call to a generated operation **must** include `client: apiClient` in the options object.
- Omitting the client causes the helper to throw because it lacks the HTTP transport configuration.

Example:
```typescript
const apiClient = useApiClient();
const result = await apiGetContactRoster({
  path: { accountId, contactId },
  client: apiClient, // ✅ Required
  throwOnError: false,
});
```

### Rich Text Editor Usage
- Treat `RichTextEditor` as an uncontrolled component.
- Mount it with an initial value and use its exposed ref helpers (`getCurrentContent`, `getTextContent`, `insertText`).
- Avoid syncing every keystroke into component state and back into `initialValue`; doing so remounts Lexical on each change and forces the caret to jump to the end.
- See `EmailComposePage` or `TemplateRichTextEditor` for the correct pattern.

### Permission Checking Pattern
Use the `useRole()` hook to check user permissions:

```typescript
const { hasPermission } = useRole();

// Check before rendering UI elements
if (hasPermission('account.contacts.manage')) {
  return <EditButton />;
}

// Check before API calls
const handleEdit = () => {
  if (!hasPermission('account.contacts.manage')) {
    setError('You do not have permission to edit contacts');
    return;
  }
  // Proceed with edit
};
```

### Loading & Error State Pattern
Consistently handle loading and error states:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

const handleOperation = async () => {
  setError(null);
  setSuccess(null);
  setLoading(true);

  try {
    const result = await performOperation();
    setSuccess('Operation completed successfully');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Operation failed');
  } finally {
    setLoading(false);
  }
};

// Display states in UI
{loading && <CircularProgress />}
{error && <Alert severity="error">{error}</Alert>}
{success && <Alert severity="success">{success}</Alert>}
```

### Light/Dark Theme Pattern

The application supports light and dark themes via `ThemeClientProvider`. Theme preference is stored in localStorage (`draco-theme` key) and syncs with system preferences.

**Accessing Theme Context:**
```typescript
import { useThemeContext } from '@/components/ThemeClientProvider';

const MyComponent = () => {
  const { currentThemeName, setCurrentThemeName, currentTheme } = useThemeContext();

  // Check current mode
  const isDark = currentThemeName === 'dark';

  // Toggle theme
  const handleToggle = () => {
    setCurrentThemeName(isDark ? 'light' : 'dark');
  };
};
```

**Theme-Aware Styling Rules:**
- **NEVER hardcode colors** — Always use `theme.palette` values
- Use `theme.palette.mode` to check 'light' or 'dark'
- Use custom `theme.palette.widget` for widget-specific colors (surface, border, headerText, supportingText)
- Use MUI's `sx` prop with theme callbacks for conditional styles

**Example - Theme-Aware Styling:**
```tsx
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderColor: theme.palette.widget.border,
        // Conditional styles based on mode
        boxShadow: theme.palette.mode === 'dark'
          ? '0 2px 12px rgba(0,0,0,0.5)'
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Content */}
    </Box>
  );
};
```

**Available Palette Colors:**
| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `background.default` (#ffffff) | (#1e1e1e) | Page background |
| `background.paper` (#ffffff) | (#1e1e1e) | Card/Paper background |
| `text.primary` (#0f172a) | (#e0e0e0) | Main text |
| `text.secondary` (#475569) | (#b0bec5) | Supporting text |
| `widget.surface` (#ffffff) | (#0f172a) | Widget backgrounds |
| `widget.border` (#e2e8f0) | (#1f2937) | Widget borders |

**Reference implementations:** `components/ThemeSwitcher.tsx`, `theme.ts`

---

# Frontend Architecture

## Core Architectural Principles

### 1. Type Safety First
- **NEVER use dynamic types for backend/frontend data exchange** — Always use proper TypeScript interfaces from shared schemas
- **Use shared schemas** — All backend/frontend data types must come from `@draco/shared-schemas`
- **Strong typing everywhere** — While critical for API data exchange, strive for strong types throughout the application
- **Maintain type consistency** — Backend and frontend must use identical type definitions

### 2. Self-Contained Components
- **Dialogs manage their own state** — Internal form state, validation, and API calls
- **Event-based communication** — Use callbacks (`onSuccess`, `onError`) for parent communication
- **Return structured data** — Always return properly typed results back to parent components

### 3. Real Data Updates
- **No page reloads** — Use state updates to reflect changes immediately
- **Wait for API results** — Always wait for real API responses before updating UI
- **Never use optimistic updates** — Prohibited across entire codebase
- **Consistent state management** — Use established patterns (useReducer, dispatch)

## Architecture Patterns

### Dialog Management Pattern

Dialogs follow a self-contained architecture where each dialog manages its own state, API calls, and validation while communicating with parent components through event callbacks.

**Dialog Component Structure:**
```typescript
interface DialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { message: string; data: TypedResult }) => void;
  onError?: (error: string) => void;
  contextData?: ContextType[];
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, onSuccess, onError }) => {
  const [formField, setFormField] = useState('');
  const { performOperation, loading } = useOperationHook(accountId);

  const handleSubmit = async () => {
    const result = await performOperation({ field: formField });
    if (result.success) {
      onSuccess?.({ message: result.message, data: result.data });
      onClose();
    } else {
      onError?.(result.error);
    }
  };

  return <Dialog open={open} onClose={onClose}>{/* Form */}</Dialog>;
};
```

**Parent Component Integration:**
```typescript
const ParentComponent = () => {
  const dialogs = useDialogManager();

  const handleSuccess = (result: { message: string; data: TypedResult }) => {
    setSuccess(result.message);
    updateStateIncrementally(result.data); // Use existing dispatch patterns
    dialogs.dialog.close();
  };

  return (
    <Dialog
      open={dialogs.dialog.isOpen}
      onClose={dialogs.dialog.close}
      onSuccess={handleSuccess}
      onError={setError}
    />
  );
};
```

### Form Validation Pattern

- **Rely on shared Zod schemas**: Import definitions from `@draco/shared-schemas`
- **Pair schemas with React Hook Form**: Initialize `useForm` with `zodResolver`
- **Extend schemas for UI-only fields** (e.g., uploads) instead of redefining validation rules inline
- **Reference implementations**: `components/users/EditContactDialog.tsx` and `components/sponsors/SponsorFormDialog.tsx`

```typescript
import { SharedSchema } from '@draco/shared-schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const FormSchema = SharedSchema.extend({
  photo: z.any().optional().nullable(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(FormSchema),
  defaultValues,
});

const onSubmit = handleSubmit(async (values) => {
  await serviceOperation(values);
  onSuccess?.();
});
```

### Service Hook Pattern

Service hooks encapsulate API operations and provide consistent error handling. Define operations as plain async functions — React Compiler optimizes automatically:

```typescript
export function useServiceHook(accountId: string) {
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();

  const performOperation = async (data: OperationData): Promise<OperationResult> => {
    try {
      setLoading(true);
      const result = await apiOperation({
        client: apiClient,
        path: { accountId },
        body: data,
        throwOnError: false,
      });
      const operationData = unwrapApiResult(result, 'Operation failed');
      return { success: true, message: 'Operation successful', data: operationData };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Operation failed' };
    } finally {
      setLoading(false);
    }
  };

  return { performOperation, loading };
}
```

### Account & Team Page Layout Pattern

Account-scoped and team-scoped management pages must wrap their content with a semantic `<main>` element immediately followed by `AccountPageHeader`:

```tsx
return (
  <main className="min-h-screen bg-background">
    <AccountPageHeader accountId={accountId}>
      {/* Header content */}
    </AccountPageHeader>
    <Container>{/* Page body */}</Container>
  </main>
);
```

### Floating Action Button (FAB) Pattern

Pages that allow adding new data must include a Material-UI Floating Action Button (FAB) positioned in the lower right corner:

```tsx
import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

return (
  <main className="min-h-screen bg-background">
    <AccountPageHeader accountId={accountId}>
      {/* Header content */}
    </AccountPageHeader>
    <Container>{/* Page body */}</Container>

    {/* FAB for adding new data */}
    <Fab
      color="primary"
      aria-label="add"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      onClick={handleAddClick}
    >
      <AddIcon />
    </Fab>
  </main>
);
```

**Usage:**
- Required for all data management pages (contacts, teams, schedules, etc.)
- Opens creation dialog when clicked
- Use permission checks to conditionally render based on user access

### Metadata Generation Pattern

Every account or team `page.tsx` file must export `generateMetadata`. Always delegate to `buildSeoMetadata` from `lib/seoMetadata`:

```tsx
import { getTeamInfo } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);

  return buildSeoMetadata({
    title: `${team} Sponsors | ${account}`,
    description: `Manage sponsor placements for ${team} in the ${league} league.`,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`,
    icon: iconUrl,
    index: false,
  });
}
```

### State Management Pattern

Use consistent state management patterns throughout. Define handlers as plain functions — React Compiler optimizes automatically:

```typescript
const handleDataUpdated = (updatedData: TypedData) => {
  // Only update state after receiving real API response
  const updatedItems = state.items.map(item =>
    item.id === updatedData.id ? { ...item, ...updatedData } : item
  );

  dispatch({
    type: 'SET_DATA',
    items: updatedItems,
    hasNext: state.hasNext,
    hasPrev: state.hasPrev,
    page: state.page,
  });
};
```

## Component Categories

### 1. Page Components (`/app`)
- Top-level route components
- Layout, data fetching, route protection
- Use page-level hooks for data management

### 2. Feature Components (`/components`)
- Reusable business logic components
- Feature-specific UI and logic
- Self-contained with clear prop interfaces

### 3. Dialog Components
- Modal interactions for data operations
- Form handling, validation, API calls
- Self-contained with event-based communication

### 4. Service Hooks (`/hooks`)
- Encapsulate API operations
- Data fetching, error handling, loading states
- Return typed results with consistent error handling

## Context Architecture

### Context Hierarchy
- **AuthContext** — User authentication state, tokens
- **RoleContext** — User permissions, role-based access control
- **AccountContext** — Current account data, account-scoped operations

Access via hooks:
```typescript
const { token, user } = useAuth();
const { hasPermission } = useRole();
const { currentAccount } = useAccount();
```

## Best Practices

### Component Design
- **Single Responsibility** — Each component has one clear purpose
- **Avoid Prop Drilling** — Use context for global state
- **Event Handling** — Define handlers as plain functions; React Compiler optimizes automatically

### Component Architecture
- **Server Components First** — Default for Next.js pages; add `'use client'` only when needed for hooks, events, or browser APIs
- **Error Boundaries** — Implement error handling at component level for graceful degradation
- **Material-UI Consistency** — Use MUI components throughout for visual consistency

### State Management
- **Local State** — Use useState for component-specific state
- **Complex State** — Use useReducer for complex state logic
- **Global State** — Use Context for application-wide state
- **Wait for API** — Never update state before receiving API confirmation

### Performance
- **Automatic Memoization** — React Compiler handles memoization; do not add manual `useMemo`/`useCallback`
- **Code Splitting** — Lazy load components and routes
- **Bundle Optimization** — Import only needed dependencies

### Error Handling
- **Graceful Degradation** — Handle errors without breaking the UI
- **User Feedback** — Provide clear error messages
- **Logging** — Log errors for debugging without exposing sensitive data

## Anti-Patterns to Avoid

### ❌ Don't Do This:

```typescript
// Dynamic typing for API data
const handleSubmit = (data: any) => { ... }

// Tight coupling
const Dialog = ({ users, setUsers, roles, setRoles }) => { ... }

// Page reloads
window.location.reload();

// Optimistic updates
setUsers([...users, newUser]); // Before API call

// Duplicate types
interface LocalUser { id: string; name: string; }
```

### ✅ Do This Instead:

```typescript
// Proper typing for API data
const handleSubmit = (data: ContactType) => { ... }

// Event-based communication
const Dialog = ({ onSuccess, onError }) => { ... }

// Real data updates
const result = await createUser(data);
if (result.success) {
  updateUsers(result.user); // After API success
}

// Shared types
import { ContactType } from '@draco/shared-schemas';
```

## Derived Data in Render (React Compliance)

React's own documentation—[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)—is explicit: **derive UI state during render** and use effects only to synchronize with external systems.

Our codebase enforces this by:

1. Treating API responses and props as the single source of truth.
2. Computing view-specific data (like sorting, filtering, or display keys) via plain functions during render (React Compiler handles memoization).
3. Reserving `useEffect` for true side effects (e.g., kicking off fetches, subscribing/unsubscribing).
4. Never reading mutable refs inside render; refs are only touched in event handlers or effects.

**Reference implementations:**
- `components/social/FeaturedVideosWidget.tsx`, `TeamFeaturedVideosWidget.tsx`, `SocialHubExperience.tsx`: fetch data once, store the raw results, and derive loading/error/display branches synchronously in render without redundant state.
- `components/statistics/LeadersWidget.tsx`: derives the active tab, displayed category, and leaders purely from the finished `useStatisticalLeaders` result and current props; no ref reads or `setState` inside effects.

Whenever you introduce data derivation, revisit the React article linked above and follow this pattern verbatim. Deviations (like resetting state at the top of an effect or caching "latest" data in refs) reintroduce the very lint errors React is guarding against.

---

For detailed examples, complete implementations, diagrams, and development workflows, see [FRONTEND_REFERENCE.md](./FRONTEND_REFERENCE.md).
