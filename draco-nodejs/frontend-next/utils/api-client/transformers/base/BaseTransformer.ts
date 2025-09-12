import { z } from 'zod';

/**
 * Base interface for data transformers that convert API types to client types
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export interface DataTransformer<TApi, TClient> {
  /**
   * Zod schema for validation and transformation
   */
  schema: z.ZodSchema<TClient>;

  /**
   * Transform a single API data object to client format
   * @param apiData The API data to transform
   * @returns Transformed client data
   */
  transform(apiData: TApi): Promise<TClient> | TClient;

  /**
   * Transform an array of API data objects to client format
   * @param apiDataList Array of API data to transform
   * @returns Array of transformed client data
   */
  transformList(apiDataList: TApi[]): Promise<TClient[]> | TClient[];

  /**
   * Validate and transform unknown data to client format
   * @param data Unknown data to validate and transform
   * @returns Validated and transformed client data
   * @throws ZodError if validation fails
   */
  validate(data: unknown): TClient;
}

/**
 * Abstract base class for transformers providing common functionality
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export abstract class BaseTransformer<TApi, TClient> implements DataTransformer<TApi, TClient> {
  /**
   * Zod schema for validation and transformation
   * Must be implemented by concrete classes
   */
  public abstract readonly schema: z.ZodSchema<TClient>;

  /**
   * Transform a single API data object to client format
   * Default implementation uses the schema for transformation
   * @param apiData The API data to transform
   * @returns Transformed client data
   */
  public transform(apiData: TApi): TClient {
    return this.schema.parse(apiData);
  }

  /**
   * Transform an array of API data objects to client format
   * @param apiDataList Array of API data to transform
   * @returns Array of transformed client data
   */
  public transformList(apiDataList: TApi[]): TClient[] {
    return apiDataList.map((item) => this.transform(item));
  }

  /**
   * Validate and transform unknown data to client format
   * @param data Unknown data to validate and transform
   * @returns Validated and transformed client data
   * @throws ZodError if validation fails
   */
  public validate(data: unknown): TClient {
    return this.schema.parse(data);
  }

  /**
   * Safely validate data with optional fallback
   * @param data Data to validate
   * @param fallback Optional fallback value if validation fails
   * @returns Validated data or fallback
   */
  protected safeValidate(data: unknown, fallback?: TClient): TClient | undefined {
    try {
      return this.schema.parse(data);
    } catch {
      if (fallback !== undefined) {
        return fallback;
      }
      return undefined;
    }
  }

  /**
   * Check if data is valid according to the schema
   * @param data Data to check
   * @returns True if data is valid, false otherwise
   */
  public isValid(data: unknown): boolean {
    return this.schema.safeParse(data).success;
  }

  /**
   * Get validation errors for data
   * @param data Data to validate
   * @returns Array of validation error messages, or empty array if valid
   */
  public getValidationErrors(data: unknown): string[] {
    const result = this.schema.safeParse(data);
    if (result.success) {
      return [];
    }
    return result.error?.issues?.map((err) => err.message) ?? [];
  }
}

/**
 * Base class for async transformers that require asynchronous operations
 * @template TApi The API data type (input)
 * @template TClient The client data type (output)
 */
export abstract class AsyncBaseTransformer<TApi, TClient>
  implements DataTransformer<TApi, TClient>
{
  /**
   * Zod schema for validation and transformation
   * Must be implemented by concrete classes
   */
  public abstract readonly schema: z.ZodSchema<TClient>;

  /**
   * Transform a single API data object to client format
   * Must be implemented by concrete classes for async operations
   * @param apiData The API data to transform
   * @returns Promise resolving to transformed client data
   */
  public abstract transform(apiData: TApi): Promise<TClient>;

  /**
   * Transform an array of API data objects to client format
   * @param apiDataList Array of API data to transform
   * @returns Promise resolving to array of transformed client data
   */
  public async transformList(apiDataList: TApi[]): Promise<TClient[]> {
    return Promise.all(apiDataList.map((item) => this.transform(item)));
  }

  /**
   * Validate and transform unknown data to client format
   * @param data Unknown data to validate and transform
   * @returns Validated and transformed client data
   * @throws ZodError if validation fails
   */
  public validate(data: unknown): TClient {
    return this.schema.parse(data);
  }

  /**
   * Safely validate data with optional fallback
   * @param data Data to validate
   * @param fallback Optional fallback value if validation fails
   * @returns Validated data or fallback
   */
  protected safeValidate(data: unknown, fallback?: TClient): TClient | undefined {
    try {
      return this.schema.parse(data);
    } catch {
      if (fallback !== undefined) {
        return fallback;
      }
      return undefined;
    }
  }

  /**
   * Check if data is valid according to the schema
   * @param data Data to check
   * @returns True if data is valid, false otherwise
   */
  public isValid(data: unknown): boolean {
    return this.schema.safeParse(data).success;
  }

  /**
   * Get validation errors for data
   * @param data Data to validate
   * @returns Array of validation error messages, or empty array if valid
   */
  public getValidationErrors(data: unknown): string[] {
    const result = this.schema.safeParse(data);
    if (result.success) {
      return [];
    }
    return result.error?.issues?.map((err) => err.message) ?? [];
  }
}

/**
 * Error thrown when transformation fails but is recoverable
 */
export class TransformationError extends Error {
  constructor(
    message: string,
    public readonly originalData: unknown,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TransformationError';
  }
}

/**
 * Options for transformer behavior
 */
export interface TransformerOptions {
  /**
   * Whether to throw errors on validation failure (default: true)
   */
  strict?: boolean;

  /**
   * Whether to log errors in development mode (default: true)
   */
  logErrors?: boolean;

  /**
   * Custom error handler for transformation failures
   */
  onError?: (error: Error, originalData: unknown) => void;
}
