# @draco/shared-types

Shared TypeScript type definitions for Draco Sports Manager backend API contracts and client configuration.

## Overview

This package provides type definitions that are truly shared between backend and frontend components of the Draco Sports Manager application. It includes backend API response formats, error types, and client configuration interfaces. For client-specific response types (like `ClientResponse`), see the `@draco/api-client` package.

## Installation

```bash
npm install @draco/shared-types
```

## Key Features

- **Type Safety**: Full TypeScript support with strict type checking
- **Response Standardization**: Unified response formats across all API endpoints
- **Error Categorization**: Structured error handling with categorized error types
- **Client Configuration**: Comprehensive configuration options for API clients
- **Request Types**: Type-safe request structures and parameter handling

## Core Types

### API Response Types

```typescript
import { ApiResponse } from '@draco/shared-types';

// Backend API response format (shared between backend and clients)
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Note: ClientResponse is now part of @draco/api-client package
// This provides client-specific response format with error handling
```

### Error Types

```typescript
import { ApiError, ErrorCategory, ErrorCodes } from '@draco/shared-types';

// Structured error information
interface ApiError {
  success: false;
  errorCode: ErrorCode;
  errorMessage: string;
  statusCode: number;
  category: ErrorCategory;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// Error categories
enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  // ... more categories
}
```

### Client Configuration

```typescript
import { ApiClientConfig, RequestOptions } from '@draco/shared-types';

// API client configuration
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  authTokenProvider?: () => string | null;
  errorHandler?: (error: ApiError) => void;
  // ... more options
}
```

## Usage Examples

### Response Handling

```typescript
import { isRetryableError } from '@draco/shared-types';
import { ClientResponse } from '@draco/api-client';

async function handleApiResponse<T>(response: ClientResponse<T>) {
  if (response.success) {
    console.log('Data:', response.data);
  } else {
    console.error('Error:', response.error);
    
    if (response.errorCode && isRetryableError(/* error */)) {
      // Retry logic
    }
  }
}
```

### Type-Safe Endpoints

```typescript
import { TypedEndpoint } from '@draco/shared-types';

interface GetUsersEndpoint extends TypedEndpoint {
  method: 'GET';
  path: '/api/users';
  response: User[];
  requiresAuth: true;
}
```

## API Modules

### `/api`
- Backend response type definitions (`ApiResponse`, etc.)
- Error types and utilities (`ApiError`, `ErrorCategory`, etc.)
- Pagination and file upload responses

### `/client`
- Client configuration types (`ApiClientConfig`, `RequestOptions`)
- Request types and utilities (`HttpMethod`, `RequestData`, etc.)
- Interceptor and retry policy definitions

## Type Safety

All types are designed with strict TypeScript compatibility:

- No `any` types used
- Comprehensive generic type support
- Runtime type checking utilities where applicable
- Full IntelliSense support

## Compatibility

- **TypeScript**: 5.8.0 or higher
- **Node.js**: ES2022 support required
- **Module System**: ESModules with CommonJS compatibility

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Testing

```bash
npm test                # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with Vitest UI
npm run test:coverage   # Run tests with coverage report
```

## Contributing

When adding new types:

1. Follow existing naming conventions
2. Include comprehensive JSDoc comments
3. Export types from appropriate index files
4. Update this README with usage examples
5. Ensure backward compatibility

## License

MIT