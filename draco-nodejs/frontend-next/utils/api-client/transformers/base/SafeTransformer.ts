import { z } from 'zod';
import { DataTransformer, TransformationError } from './BaseTransformer';
import { SafeTransformResult, SafeTransformListResult } from './ZodTransformer';

/**
 * Fallback factory function type for creating fallback data when transformation fails
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export type FallbackFactory<TApi, TClient> = (originalData: TApi, error: Error) => TClient;

/**
 * Error handler function type for handling transformation errors
 * @template TApi The API data type (input)
 */
export type ErrorHandler<TApi> = (error: TransformationError, originalData: TApi) => void;

/**
 * Options for SafeTransformer behavior
 */
export interface SafeTransformerOptions<TApi, TClient> {
  /**
   * Factory function to create fallback data when transformation fails
   */
  fallbackFactory?: FallbackFactory<TApi, TClient>;

  /**
   * Custom error handler for transformation failures
   */
  errorHandler?: ErrorHandler<TApi>;

  /**
   * Whether to log errors in development mode (default: true)
   */
  logErrors?: boolean;

  /**
   * Whether to include original data in fallback result (default: false for security)
   */
  includeOriginalData?: boolean;

  /**
   * Maximum number of transformation attempts (default: 1)
   */
  maxRetries?: number;

  /**
   * Whether to suppress errors and always return fallback data (default: false)
   */
  suppressErrors?: boolean;
}

/**
 * A wrapper transformer that provides safe error handling and fallback mechanisms
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export class SafeTransformer<TApi, TClient> implements DataTransformer<TApi, TClient> {
  private readonly transformer: DataTransformer<TApi, TClient>;
  private readonly options: Required<SafeTransformerOptions<TApi, TClient>>;

  constructor(
    transformer: DataTransformer<TApi, TClient>,
    options: SafeTransformerOptions<TApi, TClient> = {},
  ) {
    this.transformer = transformer;
    this.options = {
      fallbackFactory: options.fallbackFactory ?? this.defaultFallbackFactory,
      errorHandler: options.errorHandler ?? this.defaultErrorHandler,
      logErrors: options.logErrors ?? true,
      includeOriginalData: options.includeOriginalData ?? false,
      maxRetries: Math.max(1, options.maxRetries ?? 1),
      suppressErrors: options.suppressErrors ?? false,
    };
  }

  // DataTransformer interface implementation via delegation

  /**
   * Get the Zod schema from the wrapped transformer
   */
  public get schema(): z.ZodSchema<TClient> {
    return this.transformer.schema;
  }

  /**
   * Transform API data using the wrapped transformer
   * @param apiData The API data to transform
   * @returns Transformed client data
   */
  public transform(apiData: TApi): Promise<TClient> | TClient {
    return this.transformer.transform(apiData);
  }

  /**
   * Transform an array of API data using the wrapped transformer
   * @param apiDataList Array of API data to transform
   * @returns Array of transformed client data
   */
  public transformList(apiDataList: TApi[]): Promise<TClient[]> | TClient[] {
    return this.transformer.transformList(apiDataList);
  }

  /**
   * Validate and transform unknown data using the wrapped transformer
   * @param data Unknown data to validate and transform
   * @returns Validated and transformed client data
   * @throws ZodError if validation fails
   */
  public validate(data: unknown): TClient {
    return this.transformer.validate(data);
  }

  // SafeTransformer-specific methods

  /**
   * Safely transform a single API data object with error handling and fallback
   * @param apiData The API data to transform
   * @returns Safe transformation result
   */
  public safeTransform(apiData: TApi): SafeTransformResult<TClient> {
    let lastError: TransformationError | undefined;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = this.transformer.transform(apiData);

        // Handle async results
        if (result instanceof Promise) {
          throw new Error(
            'SafeTransformer.safeTransform() does not support async transformers. Use async methods instead.',
          );
        }

        return { success: true, data: result };
      } catch (error) {
        lastError =
          error instanceof TransformationError
            ? error
            : new TransformationError(
                `Transformation failed on attempt ${attempt}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                apiData,
                error,
              );

        if (attempt < this.options.maxRetries) {
          continue;
        }
      }
    }

    // All attempts failed
    return this.handleTransformationError(apiData, lastError!);
  }

  /**
   * Safely transform an array of API data objects with detailed statistics
   * @param apiDataList Array of API data to transform
   * @returns Safe transformation result with statistics
   */
  public safeTransformList(apiDataList: TApi[]): SafeTransformListResult<TClient> {
    const results: TClient[] = [];
    const errors: Array<{ index: number; error: TransformationError }> = [];

    for (let i = 0; i < apiDataList.length; i++) {
      const result = this.safeTransform(apiDataList[i]);

      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push({ index: i, error: result.error! });

        // Add fallback data if available
        if (result.fallbackData) {
          results.push(result.fallbackData);
        }
      }
    }

    return {
      data: results,
      totalItems: apiDataList.length,
      successfulItems: results.length - errors.length,
      failedItems: errors.length,
      errors: errors,
      hasErrors: errors.length > 0,
    };
  }

  /**
   * Transform with guaranteed result (never throws, always returns data)
   * @param apiData The API data to transform
   * @returns Transformed data or fallback data
   */
  public transformOrFallback(apiData: TApi): TClient {
    const result = this.safeTransform(apiData);
    return result.success && result.data
      ? result.data
      : (result.fallbackData ??
          this.options.fallbackFactory(apiData, result.error ?? new Error('Unknown error')));
  }

  /**
   * Transform list with guaranteed results (never throws, always returns data)
   * @param apiDataList Array of API data to transform
   * @returns Array of transformed data or fallback data
   */
  public transformListOrFallback(apiDataList: TApi[]): TClient[] {
    return apiDataList.map((item) => this.transformOrFallback(item));
  }

  /**
   * Check if the transformer can handle the given data
   * @param apiData The API data to check
   * @returns True if data can be transformed, false otherwise
   */
  public canTransform(apiData: TApi): boolean {
    try {
      if ('isValid' in this.transformer && typeof this.transformer.isValid === 'function') {
        return this.transformer.isValid(apiData);
      }

      // Fallback: attempt transformation
      const result = this.transformer.transform(apiData);
      return result !== undefined && result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors for data without transforming
   * @param apiData The API data to validate
   * @returns Array of validation error messages
   */
  public getValidationErrors(apiData: TApi): string[] {
    try {
      if (
        'getValidationErrors' in this.transformer &&
        typeof this.transformer.getValidationErrors === 'function'
      ) {
        return this.transformer.getValidationErrors(apiData);
      }

      // Fallback: attempt transformation to get errors
      this.transformer.transform(apiData);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map((err: z.ZodIssue) => err.message);
      }
      return [error instanceof Error ? error.message : 'Unknown validation error'];
    }
  }

  /**
   * Handle transformation errors and create fallback results
   * @param apiData The original API data
   * @param error The transformation error
   * @param attemptNumber The attempt number (optional)
   * @returns Safe transformation result with error and fallback data
   */
  private handleTransformationError(
    apiData: TApi,
    error: TransformationError,
    _attemptNumber?: number,
  ): SafeTransformResult<TClient> {
    // Call custom error handler
    this.options.errorHandler(error, apiData);

    // Create fallback data
    let fallbackData: TClient | undefined;
    try {
      fallbackData = this.options.fallbackFactory(apiData, error);
    } catch (fallbackError) {
      if (this.options.logErrors && process.env.NODE_ENV === 'development') {
        console.warn('SafeTransformer: Fallback factory also failed:', fallbackError);
      }
    }

    const result: SafeTransformResult<TClient> = {
      success: false,
      error,
      fallbackData,
    };

    // Include original data if requested (be careful with sensitive data)
    if (this.options.includeOriginalData) {
      result.originalData = apiData;
    }

    // Suppress errors if configured
    if (this.options.suppressErrors && fallbackData) {
      return { success: true, data: fallbackData };
    }

    return result;
  }

  /**
   * Default fallback factory that creates an empty object
   * @param originalData The original data that failed transformation
   * @param error The transformation error
   * @returns Basic fallback object
   */
  private defaultFallbackFactory: FallbackFactory<TApi, TClient> = (originalData, error) => {
    if (this.options.logErrors && process.env.NODE_ENV === 'development') {
      console.warn('SafeTransformer: Using default fallback factory for failed transformation:', {
        error: error.message,
        hasOriginalData: originalData !== undefined,
      });
    }

    // Return empty object as fallback - subclasses should provide better defaults
    return {} as TClient;
  };

  /**
   * Default error handler that logs errors in development
   * @param error The transformation error
   * @param originalData The original data that caused the error
   */
  private defaultErrorHandler: ErrorHandler<TApi> = (error, originalData) => {
    if (this.options.logErrors && process.env.NODE_ENV === 'development') {
      console.error('SafeTransformer Error:', {
        error: error.message,
        hasOriginalData: originalData !== undefined,
        stack: error.stack,
      });
    }
  };
}

/**
 * Factory function to create a SafeTransformer with a transformer and options
 * @param transformer The underlying transformer to wrap
 * @param options Safe transformer options
 * @returns New SafeTransformer instance
 */
export function createSafeTransformer<TApi, TClient>(
  transformer: DataTransformer<TApi, TClient>,
  options?: SafeTransformerOptions<TApi, TClient>,
): SafeTransformer<TApi, TClient> {
  return new SafeTransformer(transformer, options);
}

/**
 * Utility function to create a safe transformer with a custom fallback factory
 * @param transformer The underlying transformer to wrap
 * @param fallbackFactory Custom fallback factory function
 * @param options Additional safe transformer options
 * @returns New SafeTransformer instance with custom fallback
 */
export function createSafeTransformerWithFallback<TApi, TClient>(
  transformer: DataTransformer<TApi, TClient>,
  fallbackFactory: FallbackFactory<TApi, TClient>,
  options?: Omit<SafeTransformerOptions<TApi, TClient>, 'fallbackFactory'>,
): SafeTransformer<TApi, TClient> {
  return new SafeTransformer(transformer, { ...options, fallbackFactory });
}
