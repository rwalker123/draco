#!/usr/bin/env node

/**
 * Export current swagger-jsdoc generated spec to openapi.yaml
 * This is a one-time migration script to extract the OpenAPI spec
 * so we can replace swagger-jsdoc with a manual YAML file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportOpenApiSpec() {
  try {
    console.log('🔄 Exporting OpenAPI spec from swagger-jsdoc...');
    
    // Import the swagger config (build first if needed)
    const { specs } = await import('../dist/src/config/swagger.js');
    
    if (!specs) {
      throw new Error('No specs found. Make sure to run "npm run build" first.');
    }
    
    // Convert to YAML
    const yamlString = YAML.stringify(specs, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 60
    });
    
    // Write to backend root directory
    const outputPath = path.join(__dirname, '..', 'openapi.yaml');
    fs.writeFileSync(outputPath, yamlString, 'utf8');
    
    console.log('✅ OpenAPI spec exported successfully!');
    console.log(`📄 File location: ${outputPath}`);
    console.log('📊 Spec summary:');
    console.log(`   - OpenAPI version: ${specs.openapi}`);
    console.log(`   - API title: ${specs.info?.title}`);
    console.log(`   - API version: ${specs.info?.version}`);
    console.log(`   - Paths: ${Object.keys(specs.paths || {}).length}`);
    console.log(`   - Components: ${Object.keys(specs.components?.schemas || {}).length} schemas`);
    
  } catch (error) {
    console.error('❌ Failed to export OpenAPI spec:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Run "npm run build" to compile TypeScript');
    console.error('   2. Ensure swagger config is working properly');
    console.error('   3. Check that all route files are accessible');
    process.exit(1);
  }
}

exportOpenApiSpec();