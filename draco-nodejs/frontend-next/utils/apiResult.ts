export type ApiError = unknown;

export interface ApiResult<T> {
  data?: T;
  error?: ApiError;
}

type ApiResultWithResponse<T> = ApiResult<T> & {
  response?: Response;
};

export class ApiClientError extends Error {
  status?: number;
  response?: Response;
  details?: ApiError;

  constructor(
    message: string,
    options: { status?: number; response?: Response; details?: ApiError } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = options.status;
    this.response = options.response;
    this.details = options.details;

    if (options.details instanceof Error) {
      // Preserve the original error as the cause when possible.
      (this as { cause?: unknown }).cause = options.details;
    }
  }
}

export const getApiErrorMessage = (error: ApiError, fallbackMessage: string): string => {
  if (error === undefined || error === null) {
    return fallbackMessage;
  }

  if (typeof error === 'object') {
    const candidate = error as { detail?: unknown; message?: unknown };

    if (typeof candidate.detail === 'string' && candidate.detail.trim().length > 0) {
      return candidate.detail;
    }

    if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }

  return fallbackMessage;
};

const throwApiError = <T>(result: ApiResultWithResponse<T>, fallbackMessage: string): never => {
  const message = getApiErrorMessage(result.error, fallbackMessage);
  throw new ApiClientError(message, {
    status: result.response?.status,
    response: result.response,
    details: result.error,
  });
};

export const unwrapApiResult = <T>(
  result: ApiResultWithResponse<T>,
  fallbackMessage: string,
): T => {
  if (result.error) {
    throwApiError(result, fallbackMessage);
  }

  if (result.data === undefined) {
    throw new ApiClientError(fallbackMessage, {
      status: result.response?.status,
      response: result.response,
    });
  }

  return result.data;
};

export const assertNoApiError = (
  result: { error?: ApiError; response?: Response },
  fallbackMessage: string,
): void => {
  if (result.error) {
    throw new ApiClientError(getApiErrorMessage(result.error, fallbackMessage), {
      status: result.response?.status,
      response: result.response,
      details: result.error,
    });
  }
};
