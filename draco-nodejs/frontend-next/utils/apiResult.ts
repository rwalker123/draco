export type ApiError = unknown;

export interface ApiResult<T> {
  data?: T;
  error?: ApiError;
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

export const unwrapApiResult = <T>(result: ApiResult<T>, fallbackMessage: string): T => {
  if (result.error) {
    throw new Error(getApiErrorMessage(result.error, fallbackMessage));
  }

  if (result.data === undefined) {
    throw new Error(fallbackMessage);
  }

  return result.data;
};

export const assertNoApiError = (result: { error?: ApiError }, fallbackMessage: string): void => {
  if (result.error) {
    throw new Error(getApiErrorMessage(result.error, fallbackMessage));
  }
};
