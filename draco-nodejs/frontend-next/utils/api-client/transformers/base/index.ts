/**
 * Transformer Foundation - Base Classes and Utilities
 *
 * This module exports the core transformer infrastructure for the API client.
 * It provides the foundation for all data transformations between API types and client types.
 */

// Type exports (interfaces, type aliases, and types)
export type { DataTransformer, TransformerOptions } from './BaseTransformer.js';

export type { SafeTransformResult, SafeTransformListResult } from './ZodTransformer.js';

export type { FallbackFactory, ErrorHandler, SafeTransformerOptions } from './SafeTransformer.js';

export type {
  TransformerMetadata,
  TransformerRegistryEntry,
  RegisterTransformerOptions,
  TransformerSearchCriteria,
} from './TransformerRegistry.js';

export type {
  ValidationFallbackContext,
  ValidationFallbackStrategy,
} from './ValidationFallbacks.js';

// Value exports (classes, functions, constants)

// Base transformer classes and errors
export { BaseTransformer, AsyncBaseTransformer, TransformationError } from './BaseTransformer.js';

// Zod-based transformer implementations
export {
  ZodTransformer,
  AsyncZodTransformer,
  createZodTransformer,
  createAsyncZodTransformer,
} from './ZodTransformer.js';

// Safe transformer wrapper for error handling
export {
  SafeTransformer,
  createSafeTransformer,
  createSafeTransformerWithFallback,
} from './SafeTransformer.js';

// Transformer registry for pattern management
export {
  TransformerRegistry,
  globalTransformerRegistry,
  registerTransformer,
  getTransformer,
  findTransformer,
} from './TransformerRegistry.js';

// Validation fallback utilities
export { ValidationFallbacks, ValidationFallbackRegistry } from './ValidationFallbacks.js';
