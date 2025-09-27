import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import yaml from 'yaml';
import { openApiDoc } from '../src/openapi/zod-to-openapi.js';

const yamlDoc = yaml.stringify(openApiDoc);

// Write YAML for docs
const __dirname = dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, '../openapi.yaml'), yamlDoc);

// Also write JSON for codegen
fs.writeFileSync(path.join(__dirname, '../openapi.json'), JSON.stringify(openApiDoc, null, 2));

console.log('✅ openapi.yaml and openapi.json generated from Zod schemas');
