import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { RegisterContext, registerSchemaRefs } from './openapiTypes.js';

type RegisterModule = (context: RegisterContext) => void | Promise<void>;

const registry = new OpenAPIRegistry();
const schemaRefs = registerSchemaRefs(registry);

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

await registerEndpointModules({
  registry,
  schemaRefs,
  z,
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDoc = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Draco API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://localhost:3001',
    },
  ],
});

async function registerEndpointModules(context: RegisterContext) {
  const pathsDirectory = getPathsDirectory();
  const moduleExtension = getModuleExtension();

  const tagDirectories = readdirSync(pathsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const directory of tagDirectories) {
    const modulePath = resolveModulePath(pathsDirectory, directory, moduleExtension);

    if (!modulePath) {
      throw new Error(
        `OpenAPI path module for "${directory}" is missing an index file with extension "${moduleExtension}"`,
      );
    }

    const moduleUrl = pathToFileURL(modulePath).href;
    const importedModule = await import(moduleUrl);
    const register = importedModule.default as RegisterModule | undefined;

    if (typeof register !== 'function') {
      throw new Error(`OpenAPI path module "${directory}" does not have a default export`);
    }

    await register(context);
  }
}

function getPathsDirectory() {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.join(path.dirname(currentFilePath), 'paths');
}

function getModuleExtension() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const extension = path.extname(currentFilePath);

  if (extension) {
    return extension;
  }

  return '.ts';
}

function resolveModulePath(baseDirectory: string, directory: string, moduleExtension: string) {
  const primaryPath = path.join(baseDirectory, directory, `index${moduleExtension}`);

  if (existsSync(primaryPath)) {
    return primaryPath;
  }

  const fallbackExtension = moduleExtension === '.ts' ? '.js' : '.ts';
  const fallbackPath = path.join(baseDirectory, directory, `index${fallbackExtension}`);

  if (existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}
