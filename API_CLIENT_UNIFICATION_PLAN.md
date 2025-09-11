# Unified API Client Interface Plan

## Current State Analysis

### API Calling Patterns Found
1. **fetch** - Direct usage in services (UserManagementService, etc.)
2. **axiosInstance** - Configured instance with interceptors from `utils/axiosConfig.ts`
3. **apiRequest/apiRequestVoid** - Utility functions using fetch from `utils/apiClient.ts`
4. **axios** - Direct library usage in various services

### Response Format Issues
- **Backend** uses `ApiResponse<T>` with `{ success: boolean, data: T, message?: string }`
- **Frontend** expects `IServiceResponse<T>` with `{ success: boolean, data?: T, error?: string, errorCode?: string, statusCode?: number }`
- Inconsistent error handling across different HTTP clients
- Each service handles authentication and error mapping differently

### Specific Problems Identified
- **UserManagementService**: Uses fetch directly with manual token injection
- **axiosInstance**: Has response interceptors but inconsistent error format
- **apiClient**: Good error handling but limited to fetch
- **Mixed approaches**: Different services use different patterns

## Proposed Solution

### 1. Shared Type Definitions Package (`@draco/shared-types`)

Create a shared package for type definitions used by both frontend and backend:

```typescript
// Core API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  errorCode: string;
  errorMessage: string;
  statusCode: number;
  details?: unknown;
}

// Client Response Types
export interface ClientResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  statusCode?: number;
}

// Request Configuration
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  authTokenProvider?: () => string | null;
  errorHandler?: (error: ApiError) => void;
}
```

**Structure:**
```
draco-shared-types/
├── src/
│   ├── api/           # API response interfaces
│   │   ├── responses.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── client/        # Client-specific types  
│   │   ├── config.ts
│   │   ├── requests.ts
│   │   └── index.ts
│   ├── validation/    # Zod schemas for runtime validation
│   │   ├── schemas.ts
│   │   └── index.ts
│   └── index.ts       # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Unified API Client Interface

Create a transport-agnostic API client interface:

```typescript
interface ApiClient {
  // HTTP Methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<ClientResponse<T>>;
  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ClientResponse<T>>;
  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ClientResponse<T>>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ClientResponse<T>>;
  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ClientResponse<T>>;
  
  // Configuration
  configure(config: Partial<ApiClientConfig>): void;
  setAuthToken(token: string | null): void;
  
  // Utility Methods
  uploadFile<T>(endpoint: string, file: File, data?: Record<string, unknown>): Promise<ClientResponse<T>>;
  downloadFile(endpoint: string): Promise<Blob>;
}
```

**Key Features:**
- **Transport Agnostic**: Supports fetch, axios, or any HTTP client
- **Automatic Token Injection**: JWT handling via configuration
- **Standardized Error Handling**: Converts all errors to consistent `ClientResponse<T>` format
- **Type Safety**: Full TypeScript support with shared interfaces
- **Response Transformation**: Backend `ApiResponse<T>` → Frontend `ClientResponse<T>`
- **File Upload/Download**: Built-in support for file operations
- **Retry Logic**: Configurable retry with exponential backoff

### 3. Implementation Structure

```
draco-nodejs/shared/
└── api-client/
    ├── src/
    │   ├── ApiClient.ts          # Main interface definition
    │   ├── BaseApiClient.ts      # Abstract base implementation
    │   ├── adapters/
    │   │   ├── FetchAdapter.ts   # Fetch implementation
    │   │   ├── AxiosAdapter.ts   # Axios implementation
    │   │   └── MockAdapter.ts    # Testing mock
    │   ├── interceptors/
    │   │   ├── AuthInterceptor.ts
    │   │   ├── RetryInterceptor.ts
    │   │   └── LoggingInterceptor.ts
    │   ├── errors/
    │   │   ├── ErrorHandler.ts   # Standardized error processing
    │   │   ├── ErrorTypes.ts     # Error categorization
    │   │   └── RetryPolicy.ts    # Retry logic
    │   ├── transformers/
    │   │   ├── ResponseTransformer.ts  # Backend → Frontend format
    │   │   └── RequestTransformer.ts   # Request preprocessing
    │   ├── validation/
    │   │   ├── ResponseValidator.ts    # Runtime type checking
    │   │   └── SchemaRegistry.ts      # Validation schema management
    │   └── index.ts              # Public API exports
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── mocks/
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

### 4. Enhanced Error System

Implement structured error handling with categories:

```typescript
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface StructuredError {
  category: ErrorCategory;
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  context?: Record<string, unknown>;
}
```

**Error Code Standards:**
- `AUTH_TOKEN_EXPIRED` - JWT token needs refresh
- `VALIDATION_FAILED` - Request data validation failed
- `NETWORK_ERROR` - Connection/network issues
- `SERVER_ERROR` - 5xx server errors
- `PERMISSION_DENIED` - 403 authorization failures

### 5. Usage Examples

**Service Implementation:**
```typescript
// Before (UserManagementService)
const response = await fetch(`/api/accounts/${accountId}/contacts`, {
  headers: { Authorization: `Bearer ${this.token}` }
});
if (!response.ok) {
  throw new Error('Failed to load users');
}

// After (with unified client)
const result = await apiClient.get<ContactsResponse>(`/api/accounts/${accountId}/contacts`);
if (!result.success) {
  throw new Error(result.error);
}
```

**Type-Safe Endpoints:**
```typescript
// Define endpoint types in shared package
export interface GetContactsEndpoint {
  path: `/api/accounts/${string}/contacts`;
  method: 'GET';
  response: ContactsResponse;
  errors: 'PERMISSION_DENIED' | 'ACCOUNT_NOT_FOUND';
}

// Usage with full type safety
const result = await apiClient.get<GetContactsEndpoint['response']>(
  `/api/accounts/${accountId}/contacts`
);
```

### 6. Migration Strategy

#### Phase 1: Foundation (Week 1-2)
- [x] Create `@draco/shared-types` package
- [x] Set up basic API client structure
- [ ] Implement fetch adapter
- [ ] Create standardized error types
- [ ] Add comprehensive tests

#### Phase 2: Proof of Concept (Week 3)
- [ ] Migrate `UserManagementService` to use new API client
- [ ] Update all UserManagementService consumers
- [ ] Validate error handling works correctly
- [ ] Performance testing vs current approaches

#### Phase 3: Service Migration (Week 4-6)
- [ ] Migrate `workoutService.ts`
- [ ] Migrate `playerClassifiedService.ts` 
- [ ] Migrate `managerService.ts`
- [ ] Migrate `emailService.ts`
- [ ] Migrate remaining services in `services/` directory

#### Phase 4: Cleanup (Week 7)
- [ ] Remove deprecated `axiosConfig.ts`
- [ ] Remove old `apiClient.ts` utilities
- [ ] Update documentation
- [ ] Remove unused dependencies

#### Phase 5: Enhancement (Week 8+)
- [ ] Add axios adapter for performance comparison
- [ ] Implement response caching
- [ ] Add request/response logging
- [ ] Create development debugging tools

### 7. Developer Experience Improvements

**IntelliSense & Type Safety:**
- Full autocomplete for all endpoints and response types
- Compile-time validation of request/response structures
- IDE integration with endpoint documentation

**Runtime Validation:**
- Automatic response validation against Zod schemas
- Development-mode warnings for type mismatches
- Optional strict mode for production

**Debug & Development:**
- Configurable request/response logging
- Network request tracing
- Mock adapter for testing
- Performance metrics collection

**Testing Support:**
- Built-in request/response mocking
- Fixture data management
- Integration test helpers
- Error scenario simulation

### 8. Configuration

**Frontend Configuration:**
```typescript
// In app initialization
const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  retries: 3,
  authTokenProvider: () => localStorage.getItem('jwtToken'),
  errorHandler: (error) => {
    if (error.errorCode === 'AUTH_TOKEN_EXPIRED') {
      // Handle token refresh
    }
  }
});
```

**Environment-Specific Settings:**
- Development: Enhanced logging, validation warnings
- Testing: Mock adapters, fixture data
- Production: Optimized performance, minimal logging

### 9. Backward Compatibility

During migration period:
- Keep existing API calling methods functional
- Gradual migration service by service
- Deprecation warnings for old methods
- Documentation for migration path

### 10. Future Enhancements

**Planned Features:**
- GraphQL adapter support
- Real-time WebSocket integration
- Request/response caching layer
- Offline support with request queuing
- Metrics and analytics integration

**Performance Optimizations:**
- Request deduplication
- Response compression
- Connection pooling
- Smart retry strategies

This plan provides a comprehensive, maintainable solution that eliminates current API inconsistencies while enabling future enhancements and ensuring type safety across the entire application.

## Build System Integration

The root package.json has been updated to include the shared packages in the monorepo build system:

- **Individual Scripts**: Added scripts for both packages (build, test, lint, type-check, format, install)
- **Aggregate Scripts**: Updated to include shared packages in correct dependency order
- **Build Sequence**: Ensured proper build order: shared-types → api-client → backend → frontend  
- **Development Workflow**: All packages integrate seamlessly with existing development commands

**Key Build Commands:**
```bash
npm run install:all    # Install all packages including shared
npm run build          # Build all packages in dependency order  
npm run type-check:all # Type check all packages
npm run lint:all       # Lint all packages including shared
```

## Implementation Notes

### Architecture Refinements Made

**Type Separation Refinement:**
- **Moved `ClientResponse<T>`** from `@draco/shared-types` to `@draco/api-client` (client-specific)
- **Moved client configuration types** (`ApiClientConfig`, `RequestOptions`, etc.) to api-client package  
- **`@draco/shared-types`** now contains only truly shared API contracts between backend and frontend
- **`@draco/api-client`** owns all client-specific behavior, configuration, and transport-related types

**Package Responsibilities:**
- `@draco/shared-types`: Backend `ApiResponse<T>`, `ApiError`, core error codes - truly shared contracts
- `@draco/api-client`: Client `ClientResponse<T>`, configuration, request types, interceptors - client-specific

**Vitest Integration:**
- Both packages use Vitest for testing (matching project standards)  
- Removed Jest dependencies to maintain consistency with backend/frontend
- Full test coverage capabilities with UI and coverage reporting

### Foundation Completed

✅ **Phase 1: Steps 1 & 2 Complete**
- Solid type system foundation with proper separation of concerns
- Transport-agnostic API client interface ready for concrete implementations
- Full monorepo integration with build system
- Ready for next phase: implementing fetch adapter and concrete transport implementations