import { z } from 'zod';
import { DataTransformer } from './BaseTransformer.js';
import { createZodTransformer } from './ZodTransformer.js';
import { createSafeTransformer, SafeTransformerOptions } from './SafeTransformer.js';

/**
 * Metadata for registered transformers
 */
export interface TransformerMetadata {
  /**
   * Unique identifier for the transformer
   */
  id: string;

  /**
   * Human-readable name for the transformer
   */
  name: string;

  /**
   * Description of what the transformer does
   */
  description: string;

  /**
   * Version of the transformer (for compatibility tracking)
   */
  version: string;

  /**
   * Tags for categorizing and searching transformers
   */
  tags: string[];

  /**
   * Source API type name
   */
  sourceType: string;

  /**
   * Target client type name
   */
  targetType: string;

  /**
   * Whether this transformer is deprecated
   */
  deprecated?: boolean;

  /**
   * Deprecation message if deprecated
   */
  deprecationMessage?: string;
}

/**
 * Registry entry containing transformer and its metadata
 */
export interface TransformerRegistryEntry<TApi, TClient> {
  transformer: DataTransformer<TApi, TClient>;
  metadata: TransformerMetadata;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

/**
 * Options for registering a transformer
 */
export interface RegisterTransformerOptions<TApi, TClient> {
  /**
   * Whether to wrap the transformer in a SafeTransformer (default: false)
   */
  makeSafe?: boolean;

  /**
   * Safe transformer options (only used if makeSafe is true)
   */
  safeOptions?: SafeTransformerOptions<TApi, TClient>;

  /**
   * Whether to allow overwriting existing transformers with the same ID (default: false)
   */
  allowOverwrite?: boolean;
}

/**
 * Search criteria for finding transformers
 */
export interface TransformerSearchCriteria {
  /**
   * Search by transformer ID (exact match)
   */
  id?: string;

  /**
   * Search by source type name
   */
  sourceType?: string;

  /**
   * Search by target type name
   */
  targetType?: string;

  /**
   * Search by tags (any matching tag)
   */
  tags?: string[];

  /**
   * Search by name or description (partial match, case-insensitive)
   */
  query?: string;

  /**
   * Whether to include deprecated transformers (default: false)
   */
  includeDeprecated?: boolean;

  /**
   * Minimum version (semver comparison)
   */
  minVersion?: string;
}

/**
 * Central registry for managing data transformers
 * Provides registration, discovery, and lifecycle management for transformers
 */
export class TransformerRegistry {
  // note that unknown is used here because the registry can hold any transformer types
  private readonly transformers = new Map<string, TransformerRegistryEntry<unknown, unknown>>();
  private readonly typeIndex = new Map<string, Set<string>>();
  private readonly tagIndex = new Map<string, Set<string>>();

  /**
   * Register a transformer in the registry
   * @param transformer The transformer to register
   * @param metadata Metadata for the transformer
   * @param options Registration options
   * @returns True if registration was successful
   */
  public register<TApi, TClient>(
    transformer: DataTransformer<TApi, TClient>,
    metadata: TransformerMetadata,
    options: RegisterTransformerOptions<TApi, TClient> = {},
  ): boolean {
    // Check for existing transformer
    if (this.transformers.has(metadata.id) && !options.allowOverwrite) {
      console.warn(
        `TransformerRegistry: Transformer with ID '${metadata.id}' already exists. Use allowOverwrite option to replace.`,
      );
      return false;
    }

    // Wrap in SafeTransformer if requested
    let finalTransformer = transformer;
    if (options.makeSafe) {
      finalTransformer = createSafeTransformer(transformer, options.safeOptions);
    }

    // Create registry entry
    const entry: TransformerRegistryEntry<TApi, TClient> = {
      transformer: finalTransformer,
      metadata: { ...metadata },
      createdAt: new Date(),
      usageCount: 0,
    };

    // Store transformer
    this.transformers.set(metadata.id, entry);

    // Update indexes
    this.updateTypeIndex(metadata);
    this.updateTagIndex(metadata);

    return true;
  }

  /**
   * Register a Zod-based transformer with automatic metadata generation
   * @param id Unique identifier for the transformer
   * @param schema Zod schema for transformation
   * @param sourceTypeName Name of the source API type
   * @param targetTypeName Name of the target client type
   * @param options Registration options with additional metadata
   * @returns True if registration was successful
   */
  public registerZodTransformer<TApi, TClient>(
    id: string,
    schema: z.ZodSchema<TClient>,
    sourceTypeName: string,
    targetTypeName: string,
    options: RegisterTransformerOptions<TApi, TClient> & {
      name?: string;
      description?: string;
      version?: string;
      tags?: string[];
    } = {},
  ): boolean {
    const transformer = createZodTransformer<TApi, TClient>(schema);

    const metadata: TransformerMetadata = {
      id,
      name: options.name ?? `${sourceTypeName} → ${targetTypeName}`,
      description:
        options.description ?? `Transform ${sourceTypeName} to ${targetTypeName} using Zod schema`,
      version: options.version ?? '1.0.0',
      tags: options.tags ?? [sourceTypeName.toLowerCase(), targetTypeName.toLowerCase(), 'zod'],
      sourceType: sourceTypeName,
      targetType: targetTypeName,
    };

    return this.register(transformer, metadata, options);
  }

  /**
   * Get a transformer by its ID
   * @param id The transformer ID
   * @returns The transformer if found, undefined otherwise
   */
  public get<TApi, TClient>(id: string): DataTransformer<TApi, TClient> | undefined {
    const entry = this.transformers.get(id);
    if (!entry) {
      return undefined;
    }

    // Update usage tracking
    entry.lastUsed = new Date();
    entry.usageCount++;

    // Check for deprecation warning
    if (entry.metadata.deprecated && process.env.NODE_ENV === 'development') {
      console.warn(
        `TransformerRegistry: Using deprecated transformer '${id}': ${entry.metadata.deprecationMessage ?? 'No deprecation message provided'}`,
      );
    }

    return entry.transformer as DataTransformer<TApi, TClient>;
  }

  /**
   * Search for transformers based on criteria
   * @param criteria Search criteria
   * @returns Array of matching transformer entries
   */
  public search(criteria: TransformerSearchCriteria): TransformerRegistryEntry<unknown, unknown>[] {
    // unknown is used here because the search can return any transformer types
    const results: TransformerRegistryEntry<unknown, unknown>[] = [];

    for (const [id, entry] of this.transformers) {
      // Skip deprecated transformers unless explicitly included
      if (entry.metadata.deprecated && !criteria.includeDeprecated) {
        continue;
      }

      // Check ID match (exact)
      if (criteria.id && criteria.id !== id) {
        continue;
      }

      // Check type matches
      if (criteria.sourceType && entry.metadata.sourceType !== criteria.sourceType) {
        continue;
      }

      if (criteria.targetType && entry.metadata.targetType !== criteria.targetType) {
        continue;
      }

      // Check tag matches (any matching tag)
      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some((tag) => entry.metadata.tags.includes(tag));
        if (!hasMatchingTag) {
          continue;
        }
      }

      // Check query match (name or description)
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const nameMatch = entry.metadata.name.toLowerCase().includes(query);
        const descriptionMatch = entry.metadata.description.toLowerCase().includes(query);
        if (!nameMatch && !descriptionMatch) {
          continue;
        }
      }

      // Check version requirement (basic semver comparison)
      if (
        criteria.minVersion &&
        !this.isVersionCompatible(entry.metadata.version, criteria.minVersion)
      ) {
        continue;
      }

      results.push(entry);
    }

    // Sort by usage count (most used first), then by creation date (newest first)
    return results.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Find transformer for a specific type transformation
   * @param sourceType Source API type name
   * @param targetType Target client type name
   * @returns First matching transformer or undefined
   */
  public findTransformer<TApi, TClient>(
    sourceType: string,
    targetType: string,
  ): DataTransformer<TApi, TClient> | undefined {
    const results = this.search({ sourceType, targetType });
    return results.length > 0
      ? (results[0].transformer as DataTransformer<TApi, TClient>)
      : undefined;
  }

  /**
   * Get all available source types
   * @returns Array of source type names
   */
  public getSourceTypes(): string[] {
    return Array.from(this.typeIndex.keys())
      .filter((key) => key.startsWith('source:'))
      .map((key) => key.substring(7));
  }

  /**
   * Get all available target types
   * @returns Array of target type names
   */
  public getTargetTypes(): string[] {
    return Array.from(this.typeIndex.keys())
      .filter((key) => key.startsWith('target:'))
      .map((key) => key.substring(7));
  }

  /**
   * Get transformer metadata by ID
   * @param id The transformer ID
   * @returns Transformer metadata if found, undefined otherwise
   */
  public getMetadata(id: string): TransformerMetadata | undefined {
    return this.transformers.get(id)?.metadata;
  }

  /**
   * Mark a transformer as deprecated
   * @param id The transformer ID
   * @param message Deprecation message
   * @returns True if transformer was found and marked as deprecated
   */
  public deprecate(id: string, message?: string): boolean {
    const entry = this.transformers.get(id);
    if (!entry) {
      return false;
    }

    entry.metadata.deprecated = true;
    entry.metadata.deprecationMessage = message;
    return true;
  }

  /**
   * Remove a transformer from the registry
   * @param id The transformer ID
   * @returns True if transformer was found and removed
   */
  public unregister(id: string): boolean {
    const entry = this.transformers.get(id);
    if (!entry) {
      return false;
    }

    // Remove from main registry
    this.transformers.delete(id);

    // Update indexes
    this.removeFromTypeIndex(entry.metadata);
    this.removeFromTagIndex(entry.metadata);

    return true;
  }

  /**
   * Clear all transformers from the registry
   */
  public clear(): void {
    this.transformers.clear();
    this.typeIndex.clear();
    this.tagIndex.clear();
  }

  /**
   * Update the type index for efficient searching
   * @param metadata Transformer metadata
   */
  private updateTypeIndex(metadata: TransformerMetadata): void {
    const sourceKey = `source:${metadata.sourceType}`;
    const targetKey = `target:${metadata.targetType}`;

    if (!this.typeIndex.has(sourceKey)) {
      this.typeIndex.set(sourceKey, new Set());
    }
    if (!this.typeIndex.has(targetKey)) {
      this.typeIndex.set(targetKey, new Set());
    }

    this.typeIndex.get(sourceKey)!.add(metadata.id);
    this.typeIndex.get(targetKey)!.add(metadata.id);
  }

  /**
   * Update the tag index for efficient searching
   * @param metadata Transformer metadata
   */
  private updateTagIndex(metadata: TransformerMetadata): void {
    for (const tag of metadata.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(metadata.id);
    }
  }

  /**
   * Remove from type index when unregistering
   * @param metadata Transformer metadata
   */
  private removeFromTypeIndex(metadata: TransformerMetadata): void {
    const sourceKey = `source:${metadata.sourceType}`;
    const targetKey = `target:${metadata.targetType}`;

    this.typeIndex.get(sourceKey)?.delete(metadata.id);
    this.typeIndex.get(targetKey)?.delete(metadata.id);

    // Clean up empty sets
    if (this.typeIndex.get(sourceKey)?.size === 0) {
      this.typeIndex.delete(sourceKey);
    }
    if (this.typeIndex.get(targetKey)?.size === 0) {
      this.typeIndex.delete(targetKey);
    }
  }

  /**
   * Remove from tag index when unregistering
   * @param metadata Transformer metadata
   */
  private removeFromTagIndex(metadata: TransformerMetadata): void {
    for (const tag of metadata.tags) {
      this.tagIndex.get(tag)?.delete(metadata.id);

      // Clean up empty sets
      if (this.tagIndex.get(tag)?.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  /**
   * Basic semver version compatibility check
   * @param currentVersion Current transformer version
   * @param requiredVersion Required minimum version
   * @returns True if current version meets requirement
   */
  private isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const currentPart = current[i] ?? 0;
      const requiredPart = required[i] ?? 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true; // Equal versions are compatible
  }
}

/**
 * Global transformer registry instance
 */
export const globalTransformerRegistry = new TransformerRegistry();

/**
 * Convenience function to register a transformer in the global registry
 */
export function registerTransformer<TApi, TClient>(
  transformer: DataTransformer<TApi, TClient>,
  metadata: TransformerMetadata,
  options?: RegisterTransformerOptions<TApi, TClient>,
): boolean {
  return globalTransformerRegistry.register(transformer, metadata, options);
}

/**
 * Convenience function to get a transformer from the global registry
 */
export function getTransformer<TApi, TClient>(
  id: string,
): DataTransformer<TApi, TClient> | undefined {
  return globalTransformerRegistry.get<TApi, TClient>(id);
}

/**
 * Convenience function to find a transformer in the global registry
 */
export function findTransformer<TApi, TClient>(
  sourceType: string,
  targetType: string,
): DataTransformer<TApi, TClient> | undefined {
  return globalTransformerRegistry.findTransformer<TApi, TClient>(sourceType, targetType);
}
