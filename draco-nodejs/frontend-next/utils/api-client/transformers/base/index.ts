/**
 * Transformer Foundation - Base Classes and Utilities
 *
 * This module exports the core transformer infrastructure for the API client.
 * It provides the foundation for all data transformations between API types and client types.
 */

// Type exports (interfaces, type aliases, and types)
export type { DataTransformer, TransformerOptions } from './BaseTransformer';

export type { SafeTransformResult, SafeTransformListResult } from './ZodTransformer';

export type { FallbackFactory, ErrorHandler, SafeTransformerOptions } from './SafeTransformer';

export type {
  TransformerMetadata,
  TransformerRegistryEntry,
  RegisterTransformerOptions,
  TransformerSearchCriteria,
} from './TransformerRegistry';

export type { ValidationFallbackContext, ValidationFallbackStrategy } from './ValidationFallbacks';

// Value exports (classes, functions, constants)

// Base transformer classes and errors
export { BaseTransformer, AsyncBaseTransformer, TransformationError } from './BaseTransformer';

// Zod-based transformer implementations
export {
  ZodTransformer,
  AsyncZodTransformer,
  createZodTransformer,
  createAsyncZodTransformer,
} from './ZodTransformer';

// Safe transformer wrapper for error handling
export {
  SafeTransformer,
  createSafeTransformer,
  createSafeTransformerWithFallback,
} from './SafeTransformer';

// Transformer registry for pattern management
export {
  TransformerRegistry,
  globalTransformerRegistry,
  registerTransformer,
  getTransformer,
  findTransformer,
} from './TransformerRegistry';

// Validation fallback utilities
export { ValidationFallbacks, ValidationFallbackRegistry } from './ValidationFallbacks';
