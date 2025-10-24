import {
  ApiErrorType,
  ValidationErrorType,
  NotFoundErrorType,
  AuthenticationErrorType,
  AuthorizationErrorType,
  ConflictErrorType,
  InternalServerErrorType,
} from '@draco/shared-schemas';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';

export class ApiError extends Error implements ApiErrorType {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode: number, isOperational = true, isRetryable = false) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.isRetryable = isRetryable;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
  }

  // Method to get the error response object that matches the schema
  toErrorResponse(): ApiErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class ValidationError extends ApiError {
  public readonly statusCode = 400 as const;
  public readonly isRetryable = false as const;

  constructor(message = 'Validation failed') {
    super(message, 400, true, false);
  }

  toErrorResponse(): ValidationErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class HumanVerificationError extends ApiError {
  public readonly statusCode = 422 as const;
  public readonly isRetryable = true as const;

  constructor(message = 'Human verification failed. Please try again.') {
    super(message, 422, true, true);
  }

  toErrorResponse(): ApiErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class NotFoundError extends ApiError {
  public readonly statusCode = 404 as const;
  public readonly isRetryable = false as const;

  constructor(message = 'Resource not found') {
    super(message, 404, true, false);
  }

  toErrorResponse(): NotFoundErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class NoDomainAccount extends NotFoundError {
  constructor(message = 'No account associated with this domain') {
    super(message);
    this.name = 'NoDomainAccount';
  }
}

export class AuthenticationError extends ApiError {
  public readonly statusCode = 401 as const;
  public readonly isRetryable = false as const;

  constructor(message = 'Authentication required') {
    super(message, 401, true, false);
  }

  toErrorResponse(): AuthenticationErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class AuthorizationError extends ApiError {
  public readonly statusCode = 403 as const;
  public readonly isRetryable = false as const;

  constructor(message = 'Access denied') {
    super(message, 403, true, false);
  }

  toErrorResponse(): AuthorizationErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class ConflictError extends ApiError {
  public readonly statusCode = 409 as const;
  public readonly isRetryable = false as const;

  constructor(message = 'Resource conflict') {
    super(message, 409, true, false);
  }

  toErrorResponse(): ConflictErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export class InternalServerError extends ApiError {
  public readonly statusCode = 500 as const;
  public readonly isRetryable = true as const;

  constructor(message = 'Internal server error') {
    super(message, 500, false, true);
  }

  toErrorResponse(): InternalServerErrorType {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
    };
  }
}

export type PhotoSubmissionNotificationEvent =
  | 'submission-received'
  | 'moderation-approved'
  | 'moderation-denied';

export class PhotoSubmissionNotificationError extends InternalServerError {
  public readonly event: PhotoSubmissionNotificationEvent;
  public readonly detail?: PhotoSubmissionDetailType;

  constructor(
    event: PhotoSubmissionNotificationEvent,
    message = 'Failed to send photo submission notification email',
    detail?: PhotoSubmissionDetailType,
  ) {
    super(message);
    this.event = event;
    this.detail = detail;
    this.name = 'PhotoSubmissionNotificationError';
  }
}

// Workout-specific error classes
export class WorkoutNotFoundError extends NotFoundError {
  constructor(workoutId: string) {
    super(`Workout with ID ${workoutId} not found`);
  }
}

export class WorkoutRegistrationNotFoundError extends NotFoundError {
  constructor(registrationId: string) {
    super(`Workout registration with ID ${registrationId} not found`);
  }
}

export class WorkoutUnauthorizedError extends AuthorizationError {
  constructor(message = 'Unauthorized workout access') {
    super(message);
  }
}
