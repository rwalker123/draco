#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function main() {
  const sourceBase = dirname(require.resolve('@stoplight/elements/package.json'));
  const sourceFiles = [
    'web-components.min.js',
    'web-components.min.js.LICENSE.txt',
    'styles.min.css',
  ];
  const sourceDir = resolve(sourceBase, 'web-components');
  const targetBase = resolve(__dirname, '..', 'dist');

  await fs.rm(targetBase, { recursive: true, force: true });
  await fs.mkdir(targetBase, { recursive: true });

  for (const file of sourceFiles) {
    await fs.copyFile(resolve(sourceBase, file), resolve(targetBase, file));
  }

  if (existsSync(sourceDir)) {
    await fs.cp(sourceDir, resolve(targetBase, 'web-components'), { recursive: true });
  }

  console.log('Stoplight assets refreshed.');
}

main().catch((error) => {
  console.error('Failed to update Stoplight assets:', error);
  process.exitCode = 1;
});
