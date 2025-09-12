import { z } from 'zod';
import {
  BaseTransformer,
  AsyncBaseTransformer,
  TransformationError,
  TransformerOptions,
} from './BaseTransformer';

/**
 * Concrete implementation of BaseTransformer using Zod schemas
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export class ZodTransformer<TApi, TClient> extends BaseTransformer<TApi, TClient> {
  public readonly schema: z.ZodSchema<TClient>;
  private readonly options: Required<TransformerOptions>;

  constructor(schema: z.ZodSchema<TClient>, options: TransformerOptions = {}) {
    super();
    this.schema = schema;
    this.options = {
      strict: options.strict ?? true,
      logErrors: options.logErrors ?? true,
      onError: options.onError ?? this.defaultErrorHandler,
    };
  }

  /**
   * Transform a single API data object to client format with enhanced error handling
   * @param apiData The API data to transform
   * @returns Transformed client data
   */
  public transform(apiData: TApi): TClient {
    try {
      return this.schema.parse(apiData);
    } catch (error) {
      const transformationError = new TransformationError(
        `Failed to transform data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiData,
        error,
      );

      this.options.onError(transformationError, apiData);

      if (this.options.strict) {
        throw transformationError;
      }

      // In non-strict mode, attempt to create a partial result
      return this.createFallbackData(apiData);
    }
  }

  /**
   * Transform an array with individual error handling
   * @param apiDataList Array of API data to transform
   * @returns Array of transformed client data
   */
  public transformList(apiDataList: TApi[]): TClient[] {
    const results: TClient[] = [];
    const errors: TransformationError[] = [];

    for (let i = 0; i < apiDataList.length; i++) {
      try {
        const result = this.transform(apiDataList[i]);
        results.push(result);
      } catch (error) {
        errors.push(error as TransformationError);

        if (this.options.strict) {
          throw new TransformationError(
            `Failed to transform item at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            apiDataList[i],
            error,
          );
        }
      }
    }

    if (errors.length > 0 && this.options.logErrors) {
      console.warn(
        `ZodTransformer: ${errors.length} items failed transformation out of ${apiDataList.length} total items`,
      );
    }

    return results;
  }

  /**
   * Safely transform data with detailed result information
   * @param apiData The API data to transform
   * @returns Safe transformation result with success flag and optional error
   */
  public safeTransform(apiData: TApi): SafeTransformResult<TClient> {
    try {
      const result = this.schema.parse(apiData);
      return { success: true, data: result };
    } catch (error) {
      const transformationError = new TransformationError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiData,
        error,
      );

      this.options.onError(transformationError, apiData);

      return {
        success: false,
        error: transformationError,
        fallbackData: this.options.strict ? undefined : this.createFallbackData(apiData),
      };
    }
  }

  /**
   * Safely transform a list with detailed statistics
   * @param apiDataList Array of API data to transform
   * @returns Safe transformation result with statistics
   */
  public safeTransformList(apiDataList: TApi[]): SafeTransformListResult<TClient> {
    const results: TClient[] = [];
    const errors: Array<{ index: number; error: TransformationError }> = [];

    for (let i = 0; i < apiDataList.length; i++) {
      const result = this.safeTransform(apiDataList[i]);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({ index: i, error: result.error });
        if (result.fallbackData) {
          results.push(result.fallbackData);
        }
      }
    }

    return {
      data: results,
      totalItems: apiDataList.length,
      successfulItems: results.length,
      failedItems: errors.length,
      errors: errors,
      hasErrors: errors.length > 0,
    };
  }

  /**
   * Create a minimal fallback data object when transformation fails
   * Override this method in subclasses for custom fallback logic
   * @param originalData The original data that failed transformation
   * @returns Fallback data object
   */
  protected createFallbackData(_originalData: TApi): TClient {
    // This is a basic fallback - subclasses should override for specific needs
    return {} as TClient;
  }

  /**
   * Default error handler that logs errors in development
   * @param error The transformation error
   * @param originalData The original data that caused the error
   */
  private defaultErrorHandler = (error: Error, originalData: unknown): void => {
    if (this.options.logErrors && process.env.NODE_ENV === 'development') {
      console.error('ZodTransformer Error:', {
        error: error.message,
        originalData,
        stack: error.stack,
      });
    }
  };
}

/**
 * Concrete implementation of AsyncBaseTransformer using Zod schemas
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export class AsyncZodTransformer<TApi, TClient> extends AsyncBaseTransformer<TApi, TClient> {
  public readonly schema: z.ZodSchema<TClient>;
  private readonly options: Required<TransformerOptions>;

  constructor(schema: z.ZodSchema<TClient>, options: TransformerOptions = {}) {
    super();
    this.schema = schema;
    this.options = {
      strict: options.strict ?? true,
      logErrors: options.logErrors ?? true,
      onError: options.onError ?? this.defaultErrorHandler,
    };
  }

  /**
   * Transform a single API data object to client format asynchronously
   * Override this method in subclasses for custom async transformation logic
   * @param apiData The API data to transform
   * @returns Promise resolving to transformed client data
   */
  public async transform(apiData: TApi): Promise<TClient> {
    try {
      // Basic implementation - subclasses should override for actual async operations
      const result = this.schema.parse(apiData);
      return Promise.resolve(result);
    } catch (error) {
      const transformationError = new TransformationError(
        `Failed to transform data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiData,
        error,
      );

      this.options.onError(transformationError, apiData);

      if (this.options.strict) {
        throw transformationError;
      }

      return Promise.resolve(this.createFallbackData(apiData));
    }
  }

  /**
   * Safely transform data asynchronously with detailed result information
   * @param apiData The API data to transform
   * @returns Promise resolving to safe transformation result
   */
  public async safeTransform(apiData: TApi): Promise<SafeTransformResult<TClient>> {
    try {
      const result = await this.transform(apiData);
      return { success: true, data: result };
    } catch (error) {
      const transformationError = error as TransformationError;
      return {
        success: false,
        error: transformationError,
        fallbackData: this.options.strict ? undefined : this.createFallbackData(apiData),
      };
    }
  }

  /**
   * Create a minimal fallback data object when transformation fails
   * Override this method in subclasses for custom fallback logic
   * @param originalData The original data that failed transformation
   * @returns Fallback data object
   */
  protected createFallbackData(_originalData: TApi): TClient {
    // This is a basic fallback - subclasses should override for specific needs
    return {} as TClient;
  }

  /**
   * Default error handler that logs errors in development
   * @param error The transformation error
   * @param originalData The original data that caused the error
   */
  private defaultErrorHandler = (error: Error, originalData: unknown): void => {
    if (this.options.logErrors && process.env.NODE_ENV === 'development') {
      console.error('AsyncZodTransformer Error:', {
        error: error.message,
        originalData,
        stack: error.stack,
      });
    }
  };
}

/**
 * Result of a safe transformation operation
 */
export type SafeTransformResult<T> =
  | {
      success: true;
      data: T;
      error?: never;
      fallbackData?: never;
      originalData?: never;
    }
  | {
      success: false;
      data?: never;
      error: TransformationError;
      fallbackData?: T;
      originalData?: unknown;
    };

/**
 * Result of a safe list transformation operation with statistics
 */
export interface SafeTransformListResult<T> {
  data: T[];
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errors: Array<{ index: number; error: TransformationError }>;
  hasErrors: boolean;
}

/**
 * Factory function to create a ZodTransformer with a schema
 * @param schema Zod schema for validation and transformation
 * @param options Transformer options
 * @returns New ZodTransformer instance
 */
export function createZodTransformer<TApi, TClient>(
  schema: z.ZodSchema<TClient>,
  options?: TransformerOptions,
): ZodTransformer<TApi, TClient> {
  return new ZodTransformer<TApi, TClient>(schema, options);
}

/**
 * Factory function to create an AsyncZodTransformer with a schema
 * @param schema Zod schema for validation and transformation
 * @param options Transformer options
 * @returns New AsyncZodTransformer instance
 */
export function createAsyncZodTransformer<TApi, TClient>(
  schema: z.ZodSchema<TClient>,
  options?: TransformerOptions,
): AsyncZodTransformer<TApi, TClient> {
  return new AsyncZodTransformer<TApi, TClient>(schema, options);
}
