import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load OpenAPI specification from YAML file
 * This replaces the previous swagger-jsdoc dynamic generation
 */
function loadOpenApiSpec() {
  try {
    // Point to the YAML file in the backend root (not in dist)
    const yamlPath = path.resolve(process.cwd(), 'openapi.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const spec = YAML.parse(yamlContent);

    if (!spec || !spec.openapi) {
      throw new Error('Invalid OpenAPI spec: missing openapi version');
    }

    return spec;
  } catch (error) {
    console.error(
      'Failed to load OpenAPI spec:',
      error instanceof Error ? error.message : String(error),
    );
    // Return a minimal fallback spec
    return {
      openapi: '3.0.0',
      info: {
        title: 'Draco Sports Manager API',
        version: '1.0.0',
        description: 'API documentation for Draco Sports Manager (fallback spec)',
      },
      paths: {},
      components: {},
    };
  }
}

export const specs = loadOpenApiSpec();
