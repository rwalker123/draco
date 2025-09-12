import { z } from 'zod';
import { TransformationError } from './BaseTransformer.js';

/**
 * Context information for validation fallback creation
 */
export interface ValidationFallbackContext {
  /**
   * The original data that failed validation
   */
  originalData: unknown;

  /**
   * The Zod error that occurred during validation
   */
  zodError: z.ZodError;

  /**
   * The transformation error (if any)
   */
  transformationError?: TransformationError;

  /**
   * Context information about the transformation attempt
   */
  transformationContext?: {
    sourceType: string;
    targetType: string;
    transformerId?: string;
    attemptNumber?: number;
  };
}

/**
 * Interface for validation fallback strategies
 */
export interface ValidationFallbackStrategy<T> {
  /**
   * Name of the fallback strategy
   */
  name: string;

  /**
   * Description of what this strategy does
   */
  description: string;

  /**
   * Whether this strategy can handle the given error context
   * @param context The validation fallback context
   * @returns True if this strategy can create a fallback for this context
   */
  canHandle(context: ValidationFallbackContext): boolean;

  /**
   * Create fallback data for the given context
   * @param context The validation fallback context
   * @returns Fallback data of type T
   */
  createFallback(context: ValidationFallbackContext): T;
}

/**
 * Registry for validation fallback strategies
 */
export class ValidationFallbackRegistry<T> {
  private strategies: ValidationFallbackStrategy<T>[] = [];

  /**
   * Register a fallback strategy
   * @param strategy The fallback strategy to register
   */
  public register(strategy: ValidationFallbackStrategy<T>): void {
    this.strategies.push(strategy);
  }

  /**
   * Find and execute the first applicable fallback strategy
   * @param context The validation fallback context
   * @returns Fallback data if a strategy was found, undefined otherwise
   */
  public createFallback(context: ValidationFallbackContext): T | undefined {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(context)) {
        try {
          return strategy.createFallback(context);
        } catch (error) {
          console.warn(
            `ValidationFallbackRegistry: Strategy '${strategy.name}' failed to create fallback:`,
            error,
          );
          continue;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all registered strategies
   * @returns Array of registered strategies
   */
  public getStrategies(): ValidationFallbackStrategy<T>[] {
    return [...this.strategies];
  }

  /**
   * Clear all registered strategies
   */
  public clear(): void {
    this.strategies.length = 0;
  }
}

/**
 * Generic validation fallback utilities
 */
export class ValidationFallbacks {
  /**
   * Create a fallback for list/array transformations
   * @param context The validation context
   * @param itemFallbackFactory Function to create fallback for individual items
   * @returns Array with fallback items
   */
  public static createListFallback<T>(
    context: ValidationFallbackContext,
    itemFallbackFactory: (itemContext: ValidationFallbackContext) => T,
  ): T[] {
    if (!Array.isArray(context.originalData)) {
      return [];
    }

    const originalArray = context.originalData as unknown[];
    return originalArray.map((item, index) => {
      const itemContext: ValidationFallbackContext = {
        ...context,
        originalData: item,
        transformationContext: {
          ...context.transformationContext,
          sourceType: `${context.transformationContext?.sourceType ?? 'unknown'}[]`,
          targetType: `${context.transformationContext?.targetType ?? 'unknown'}[]`,
        },
      };

      try {
        return itemFallbackFactory(itemContext);
      } catch (error) {
        console.warn(
          `ValidationFallbacks: Failed to create fallback for item at index ${index}:`,
          error,
        );
        return {} as T;
      }
    });
  }
}
