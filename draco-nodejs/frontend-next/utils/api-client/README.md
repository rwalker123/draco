# @draco/api-client

Unified API client interface for Draco Sports Manager providing transport-agnostic HTTP request capabilities with standardized error handling, authentication, and response transformation.

## Overview

This package provides the foundation for a unified API client system that:

- **Transport Agnostic**: Can be implemented with any HTTP library (fetch, axios, etc.)
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Standardized error processing with categorization and retry logic
- **Authentication**: Built-in JWT token management and automatic injection
- **Response Transformation**: Converts backend `ApiResponse<T>` to frontend `ClientResponse<T>` format
- **Client-Specific Types**: Includes `ClientResponse<T>` and related frontend response types
- **Interceptors**: Request, response, and error interceptor support
- **Retry Logic**: Configurable retry policies with exponential backoff
- **File Operations**: Built-in file upload and download support
- **Batch Requests**: Support for executing multiple requests concurrently

**Note**: This package now includes client-specific response types (like `ClientResponse<T>`) that were previously in `@draco/shared-types`. The `@draco/shared-types` package now contains only truly shared types between backend and frontend.

## Installation

```bash
npm install @draco/api-client @draco/shared-types
```

## Core Interfaces

### ApiClient Interface

The main interface that all API client implementations must conform to:

```typescript
import { ApiClient, ClientResponse } from '@draco/api-client';

interface ApiClient {
  // HTTP methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<ClientResponse<T>>;
  post<T>(endpoint: string, data?: RequestData, options?: RequestOptions): Promise<ClientResponse<T>>;
  put<T>(endpoint: string, data?: RequestData, options?: RequestOptions): Promise<ClientResponse<T>>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ClientResponse<T>>;
  patch<T>(endpoint: string, data?: RequestData, options?: RequestOptions): Promise<ClientResponse<T>>;
  
  // Specialized methods
  uploadFile<T>(endpoint: string, file: File | Blob, data?: Record<string, unknown>): Promise<ClientResponse<T>>;
  downloadFile(endpoint: string, options?: RequestOptions): Promise<Blob>;
  batch<T>(batchRequest: BatchRequest, options?: RequestOptions): Promise<ClientResponse<T>[]>;
  
  // Configuration
  configure(config: Partial<ApiClientConfig>): void;
  setAuthToken(token: string | null): void;
  
  // Utilities
  buildUrl(endpoint: string, params?: SearchParams): string;
  isReady(): boolean;
  getStats(): ClientStats;
}
```

### BaseApiClient Abstract Class

Base implementation providing common functionality:

```typescript
import { BaseApiClient, ApiClientConfig } from '@draco/api-client';

abstract class BaseApiClient implements ApiClient {
  // Common functionality implemented:
  // - Configuration management
  // - Authentication token handling
  // - Request/response/error interceptors
  // - Retry logic with exponential backoff
  // - Statistics tracking
  // - URL building utilities
  
  // Abstract methods that concrete classes must implement:
  protected abstract executeRequest<T>(method: HttpMethod, url: string, data?: RequestData): Promise<T>;
  protected abstract transformResponse<T>(response: ApiResponse<T> | T): ClientResponse<T>;
  protected abstract handleTransportError(error: unknown, url: string): ApiError;
}
```

## Usage Examples

### Creating a Concrete Implementation

```typescript
import { BaseApiClient, HttpMethod, RequestData, ClientResponse, ApiResponse, ApiError } from '@draco/api-client';

class FetchApiClient extends BaseApiClient {
  protected async executeRequest<T>(
    method: HttpMethod,
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      body: data ? JSON.stringify(data) : undefined,
      headers: options?.headers,
      signal: options?.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  protected transformResponse<T>(response: ApiResponse<T> | T): ClientResponse<T> {
    // Transform backend ApiResponse to frontend ClientResponse
    if (typeof response === 'object' && response !== null && 'success' in response) {
      const apiResponse = response as ApiResponse<T>;
      return {
        success: apiResponse.success,
        data: apiResponse.data,
        statusCode: 200
      };
    }
    
    // Direct response
    return {
      success: true,
      data: response,
      statusCode: 200
    };
  }

  protected handleTransportError(error: unknown, url: string): ApiError {
    // Convert transport-specific errors to ApiError
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
      category: ErrorCategory.NETWORK,
      retryable: true
    };
  }
}
```

### Using the Client

```typescript
import { FetchApiClient } from './FetchApiClient';

// Configure the client
const apiClient = new FetchApiClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
  authTokenProvider: () => localStorage.getItem('jwt'),
  errorHandler: (error) => console.error('API Error:', error)
});

// Make requests
async function getUsers() {
  const response = await apiClient.get<User[]>('/api/users');
  
  if (response.success) {
    console.log('Users:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

// Upload file
async function uploadAvatar(file: File) {
  const response = await apiClient.uploadFile<{ url: string }>(
    '/api/users/avatar',
    file,
    { category: 'profile' }
  );
  
  if (response.success) {
    console.log('Avatar URL:', response.data?.url);
  }
}

// Batch requests
async function loadDashboardData() {
  const batchResponse = await apiClient.batch({
    requests: [
      { id: 'users', method: 'GET', url: '/api/users' },
      { id: 'teams', method: 'GET', url: '/api/teams' },
      { id: 'games', method: 'GET', url: '/api/games' }
    ]
  });
  
  batchResponse.forEach((response, index) => {
    if (response.success) {
      console.log(`Request ${index} succeeded:`, response.data);
    }
  });
}
```

## Configuration Options

```typescript
interface ApiClientConfig {
  baseURL?: string;                    // Base URL for all requests
  timeout?: number;                    // Request timeout in milliseconds
  retries?: number;                    // Default retry attempts
  authTokenProvider?: () => string | null;  // Function to get auth token
  errorHandler?: (error: ApiError) => void;  // Global error handler
  defaultHeaders?: Record<string, string>;   // Default headers
  validateResponses?: boolean;         // Enable response validation
  enableLogging?: boolean;            // Enable request/response logging
  userAgent?: string;                 // Custom user agent
  followRedirects?: boolean;          // Follow HTTP redirects
  maxRedirects?: number;              // Maximum redirects to follow
  includeCredentials?: boolean;       // Include cookies/credentials
}
```

## Error Handling

The client provides structured error handling with categorization:

```typescript
import { ErrorCategory, ErrorCodes, isRetryableError } from '@draco/api-client';

// Handle API errors
apiClient.configure({
  errorHandler: (error: ApiError) => {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        // Handle auth errors (redirect to login, refresh token, etc.)
        break;
      case ErrorCategory.VALIDATION:
        // Handle validation errors (show field errors)
        break;
      case ErrorCategory.NETWORK:
        // Handle network errors (show retry button)
        break;
    }
    
    if (isRetryableError(error)) {
      console.log('Error is retryable');
    }
  }
});
```

## Interceptors

Add custom processing for requests, responses, and errors:

```typescript
// Request interceptor
apiClient.addRequestInterceptor(async (url, options) => {
  console.log('Making request to:', url);
  return { url, options };
});

// Response interceptor
apiClient.addResponseInterceptor(async (response, url, options) => {
  console.log('Received response from:', url);
  return response;
});

// Error interceptor
apiClient.addErrorInterceptor(async (error, url, options) => {
  if (error.errorCode === 'AUTH_TOKEN_EXPIRED') {
    // Attempt token refresh
    const newToken = await refreshAuthToken();
    apiClient.setAuthToken(newToken);
    // Re-throw to trigger retry
    throw error;
  }
  return error;
});
```

## Type Safety

Full TypeScript support with generic types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Type-safe API calls
const userResponse: ClientResponse<User[]> = await apiClient.get<User[]>('/api/users');
const newUser: ClientResponse<User> = await apiClient.post<User>('/api/users', { name: 'John', email: 'john@example.com' });

// Type-safe endpoint definitions
interface GetUsersEndpoint extends TypedEndpoint {
  method: 'GET';
  path: '/api/users';
  response: User[];
  requiresAuth: true;
  errors: 'PERMISSION_DENIED' | 'ACCOUNT_NOT_FOUND';
}
```

## Statistics and Monitoring

Track client usage and performance:

```typescript
const stats = apiClient.getStats();
console.log('Total requests:', stats.totalRequests);
console.log('Success rate:', stats.successfulRequests / stats.totalRequests);
console.log('Average response time:', stats.averageResponseTime);
```

## Development vs Production

Configure different behaviors for different environments:

```typescript
const apiClient = new FetchApiClient({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : 'https://api.draco.com',
  enableLogging: process.env.NODE_ENV === 'development',
  validateResponses: process.env.NODE_ENV === 'development'
});
```

## Next Steps

This package provides the foundation interfaces. To use it in your application, you'll need:

1. **Transport Adapter**: Implement a concrete client (FetchApiClient, AxiosApiClient, etc.)
2. **Error Mapping**: Define how transport errors map to `ApiError` types
3. **Response Transformation**: Implement backend → frontend response transformation
4. **Integration**: Replace existing API calling patterns with the unified client

## Development

### Building

```bash
npm run build           # Build TypeScript
npm run build:watch     # Build in watch mode
```

### Type Checking

```bash
npm run type-check      # Validate TypeScript types
```

### Testing

```bash
npm test                # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with Vitest UI
npm run test:coverage   # Run tests with coverage report
```

### Linting

```bash
npm run lint            # Lint TypeScript code
npm run lint:fix        # Lint and auto-fix issues
```

## License

MIT