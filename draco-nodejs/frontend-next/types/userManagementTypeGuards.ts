// Type guards for API responses to improve type safety

export interface ContactUpdateResponse {
  id: string;
  firstname: string;
  lastname: string;
  middlename?: string | null;
  email?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  phone3?: string | null;
  streetaddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  dateofbirth?: string | null;
  photoUrl?: string | null;
}

export interface UserSearchResponse {
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    photoUrl?: string | null;
    contactDetails?: {
      middlename?: string | null;
      phone1?: string | null;
      phone2?: string | null;
      phone3?: string | null;
      streetaddress?: string | null;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
      dateofbirth?: string | null;
    };
    roles?: Array<{
      roleid: number;
      roledata: string;
      role_context_name?: string;
    }>;
  }>;
  pagination: {
    page: number;
    hasNext: boolean;
    hasPrev: boolean;
    total?: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  details?: string | Array<{ field: string; message: string }>;
}

// Type guard for ContactUpdateResponse
export function isContactUpdateResponse(data: unknown): data is ContactUpdateResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.firstname !== 'string' ||
    typeof obj.lastname !== 'string'
  ) {
    return false;
  }

  // Check optional fields - they should either be undefined, null, or the correct type
  const optionalStringFields = [
    'middlename',
    'email',
    'phone1',
    'phone2',
    'phone3',
    'streetaddress',
    'city',
    'state',
    'zip',
    'dateofbirth',
    'photoUrl',
  ];

  for (const field of optionalStringFields) {
    if (obj[field] !== undefined && obj[field] !== null && typeof obj[field] !== 'string') {
      return false;
    }
  }

  return true;
}

// Type guard for UserSearchResponse
export function isUserSearchResponse(data: unknown): data is UserSearchResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check users array
  if (!Array.isArray(obj.users)) {
    return false;
  }

  // Check each user in the array
  for (const user of obj.users) {
    if (!isValidUser(user)) {
      return false;
    }
  }

  // Check pagination object
  if (typeof obj.pagination !== 'object' || obj.pagination === null) {
    return false;
  }

  const pagination = obj.pagination as Record<string, unknown>;
  if (
    typeof pagination.page !== 'number' ||
    typeof pagination.hasNext !== 'boolean' ||
    typeof pagination.hasPrev !== 'boolean'
  ) {
    return false;
  }

  return true;
}

// Helper function to validate user object structure
function isValidUser(user: unknown): boolean {
  if (typeof user !== 'object' || user === null) {
    return false;
  }

  const obj = user as Record<string, unknown>;

  // Check required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.firstName !== 'string' ||
    typeof obj.lastName !== 'string'
  ) {
    return false;
  }

  // Check optional email and photoUrl
  if (obj.email !== undefined && obj.email !== null && typeof obj.email !== 'string') {
    return false;
  }

  if (obj.photoUrl !== undefined && obj.photoUrl !== null && typeof obj.photoUrl !== 'string') {
    return false;
  }

  // Check contactDetails if present
  if (obj.contactDetails !== undefined) {
    if (!isValidContactDetails(obj.contactDetails)) {
      return false;
    }
  }

  // Check roles if present
  if (obj.roles !== undefined) {
    if (!Array.isArray(obj.roles)) {
      return false;
    }

    for (const role of obj.roles) {
      if (!isValidRole(role)) {
        return false;
      }
    }
  }

  return true;
}

// Helper function to validate contact details
function isValidContactDetails(details: unknown): boolean {
  if (typeof details !== 'object' || details === null) {
    return false;
  }

  const obj = details as Record<string, unknown>;
  const optionalStringFields = [
    'middlename',
    'phone1',
    'phone2',
    'phone3',
    'streetaddress',
    'city',
    'state',
    'zip',
    'dateofbirth',
  ];

  for (const field of optionalStringFields) {
    if (obj[field] !== undefined && obj[field] !== null && typeof obj[field] !== 'string') {
      return false;
    }
  }

  return true;
}

// Helper function to validate role object
function isValidRole(role: unknown): boolean {
  if (typeof role !== 'object' || role === null) {
    return false;
  }

  const obj = role as Record<string, unknown>;

  if (typeof obj.roleid !== 'number' || typeof obj.roledata !== 'string') {
    return false;
  }

  if (obj.role_context_name !== undefined && typeof obj.role_context_name !== 'string') {
    return false;
  }

  return true;
}

// Type guard for API error responses
export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.error !== 'string') {
    return false;
  }

  // Details can be a string or an array of validation errors
  if (obj.details !== undefined) {
    if (typeof obj.details !== 'string' && !Array.isArray(obj.details)) {
      return false;
    }

    // If it's an array, check that each item has the right structure
    if (Array.isArray(obj.details)) {
      for (const detail of obj.details) {
        if (
          typeof detail !== 'object' ||
          detail === null ||
          typeof detail.field !== 'string' ||
          typeof detail.message !== 'string'
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

// Utility function to safely extract error message from API response
export function extractErrorMessage(error: unknown): string {
  if (isApiErrorResponse(error)) {
    if (Array.isArray(error.details)) {
      return error.details.map((d) => d.message).join(', ');
    }
    return error.details || error.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

// Utility function to validate and transform user search response
export function validateUserSearchResponse(data: unknown): UserSearchResponse {
  if (!isUserSearchResponse(data)) {
    throw new Error('Invalid user search response format');
  }
  return data;
}
