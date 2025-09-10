# Axios Migration Guide

This document provides a comprehensive guide for migrating the remaining fetch() calls to axios in the frontend-next codebase.

## Current Status

✅ **COMPLETED**:
- Centralized axios configuration (`utils/axiosConfig.ts`)
- Auth context integration with automatic token injection
- Role context migration 
- Core service patterns established
- Documentation updated in CLAUDE.md
- Backward compatibility layer for `apiRequest()`

⏳ **IN PROGRESS**:
- 48+ files still contain fetch() calls that need migration
- Individual service file migrations

## Migration Patterns

### 1. Simple GET Request Migration

**Before (fetch):**
```typescript
const response = await fetch('/api/accounts/123');
const data = await response.json();
```

**After (axios):**
```typescript
import axiosInstance from '../utils/axiosConfig';

const response = await axiosInstance.get('/accounts/123');
const data = response.data;
```

### 2. POST Request with Auth

**Before (fetch):**
```typescript
const response = await fetch('/api/accounts/123/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});
```

**After (axios):**
```typescript
import axiosInstance from '../utils/axiosConfig';

// Auth header added automatically by interceptor
const response = await axiosInstance.post('/accounts/123/data', payload);
```

### 3. Error Handling Migration

**Before (fetch):**
```typescript
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

**After (axios):**
```typescript
try {
  const response = await axiosInstance.get('/endpoint');
  // Handle success
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
  throw error;
}
```

### 4. IServiceResponse Pattern Migration

**Before (apiRequest):**
```typescript
import { apiRequest } from '../utils/apiClient';

const result = await apiRequest<UserData>('/api/users/123');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

**After (axios with compatibility wrapper):**
```typescript
import { api } from '../utils/axiosConfig';

const result = await api.get<UserData>('/users/123');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Files Requiring Migration

The following files contain fetch() calls that need migration:

### Service Files
- `services/emailRecipientService.ts`
- `services/playerClassifiedService.ts` (large file - complex migration)
- `services/accessCodeService.ts`
- `services/contextDataService.ts`
- `services/workoutService.ts`

### Component Files
- `components/workouts/WorkoutForm.tsx`
- `components/workouts/WorkoutDisplay.tsx`
- `components/player-classifieds/TeamsWantedCardPublic.tsx`
- `components/schedule/hooks/useScheduleData.ts`
- `components/schedule/hooks/useGameManagement.ts`
- `components/ContactAutocomplete.tsx`
- `components/ScoreboardBase.tsx`
- `components/TeamInfoCard.tsx`
- `components/GameRecapsWidget.tsx`
- `components/OrganizationsWidget.tsx`
- `components/EditAccountLogoDialog.tsx`
- `components/Standings.tsx`
- `components/BaseballMenu.tsx`

### Page Files
- `app/account/[accountId]/BaseballAccountHome.tsx`
- `app/account/[accountId]/verify-classified/[id]/VerifyClassified.tsx`
- `app/signup/Signup.tsx`
- `app/account/[accountId]/seasons/[seasonId]/standings/Standings.tsx`
- `app/account/[accountId]/home/AccountHome.tsx`
- `app/login/LoginClientWrapper.tsx`
- `app/account/[accountId]/seasons/[seasonId]/teams/[teamSeasonId]/TeamPage.tsx`
- `app/account/[accountId]/settings/AccountSettings.tsx`
- `app/account/[accountId]/statistics/TeamStatistics.tsx`
- `app/account/[accountId]/seasons/[seasonId]/teams/Teams.tsx`
- `app/account/[accountId]/statistics/PitchingStatistics.tsx`
- `app/account/[accountId]/statistics/StatisticsFilters.tsx`
- `app/account/[accountId]/statistics/BattingStatistics.tsx`
- `app/account/[accountId]/statistics/StatisticsLeaders.tsx`
- `app/reset-password/ResetPasswordClientWrapper.tsx`
- `app/accounts/Accounts.tsx`
- `app/signup/SignupClientWrapper.tsx`
- `app/account-management/AccountManagement.tsx`

### Utility/Hook Files  
- `hooks/useCurrentSeason.ts` ✅ (migrated)
- `utils/gameTransformers.ts`
- `lib/metadataFetchers.ts`
- `lib/utils.ts`

### Infrastructure Files
- `middleware.ts`
- `components/Layout.tsx`

## Migration Priority

### High Priority (Core Services)
1. Service files that are frequently used
2. Auth-related components  
3. Data fetching hooks

### Medium Priority (Components)
1. Page components with data fetching
2. Widget components
3. Form components

### Low Priority (Utils/Infrastructure)
1. Utility functions
2. Middleware 
3. Test files

## Migration Checklist

For each file migration:

- [ ] Import `axiosInstance` from `../utils/axiosConfig`
- [ ] Replace `fetch()` calls with appropriate axios methods
- [ ] Remove manual Authorization headers (handled by interceptor)
- [ ] Update URL paths (remove `/api` prefix)
- [ ] Update error handling to use axios patterns
- [ ] Test the migrated functionality
- [ ] Remove any unused imports

## Testing Strategy

1. **Lint Check**: `npm run frontend-next:lint`
2. **Type Check**: `npm run type-check:all`
3. **Build Test**: `npm run build`
4. **Runtime Testing**: Start dev server and test migrated functionality

## Benefits After Migration

- **Consistent API**: Single HTTP client throughout the codebase
- **Automatic Auth**: JWT tokens handled automatically
- **Better Error Handling**: Standardized error responses
- **TypeScript Support**: Full typing for requests/responses
- **Interceptor Benefits**: Global request/response processing
- **Maintainability**: Centralized configuration and patterns

## Next Steps

1. Prioritize service file migrations (most impact)
2. Migrate component files systematically  
3. Update utility functions
4. Remove deprecated `apiRequest()` functions entirely
5. Delete unused fetch-related utility functions

The migration maintains backward compatibility during the transition period, allowing for incremental updates without breaking existing functionality.