#!/usr/bin/env node
// Rewrite relative import specifiers in TypeScript source to be Node ESM-friendly.
// - Adds .js to relative file imports
// - Rewrites directory imports to /index.js when index.ts exists

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srcRoot = path.join(projectRoot, 'src');

/**
 * Determine if a path is a directory that contains index.ts
 */
function hasIndexTs(candidateAbsPath) {
  try {
    const stat = fs.statSync(candidateAbsPath);
    if (stat.isDirectory()) {
      const indexTs = path.join(candidateAbsPath, 'index.ts');
      return fs.existsSync(indexTs);
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Determine if a path corresponds to a TS file (ts or tsx)
 */
function hasTsFile(candidateAbsPath) {
  return fs.existsSync(`${candidateAbsPath}.ts`) || fs.existsSync(`${candidateAbsPath}.tsx`);
}

/**
 * Resolve and rewrite a relative specifier to ESM-friendly form.
 * - If already ends with .js/.mjs/.cjs/.json, leave as-is
 * - If ends with .ts/.tsx, replace with .js
 * - If no extension:
 *    - if file exists with .ts/.tsx → add .js
 *    - else if directory with index.ts → add /index.js
 */
function rewriteSpecifier(fileDir, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return spec; // not relative

  if (/\.(js|mjs|cjs|json)$/.test(spec)) return spec;
  if (/\.(ts|tsx)$/.test(spec)) return spec.replace(/\.(ts|tsx)$/, '.js');

  const absCandidate = path.resolve(fileDir, spec);
  if (hasTsFile(absCandidate)) {
    return `${spec}.js`;
  }
  if (hasIndexTs(absCandidate)) {
    return `${spec.replace(/\/$/, '')}/index.js`;
  }
  return spec; // leave unchanged if we can't confidently resolve
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;
  const fileDir = path.dirname(filePath);

  // Handle static imports: import ... from '...'; and side-effect imports: import '...';
  updated = updated.replace(/(import\s+[^'";]*?from\s+['"])([^'"\n]+)(['"];)/g, (m, p1, spec, p3) => {
    return `${p1}${rewriteSpecifier(fileDir, spec)}${p3}`;
  });
  updated = updated.replace(/(import\s+)(['"])([^'"\n]+)(['"];)/g, (m, p1, q1, spec, q2) => {
    return `${p1}${q1}${rewriteSpecifier(fileDir, spec)}${q2}`;
  });

  // Handle export ... from '...';
  updated = updated.replace(/(export\s+[^'";]*?from\s+['"])([^'"\n]+)(['"];)/g, (m, p1, spec, p3) => {
    return `${p1}${rewriteSpecifier(fileDir, spec)}${p3}`;
  });

  // Handle dynamic imports: import('...')
  updated = updated.replace(/(import\(\s*['"])([^'"\n]+)(['"]\s*\))/g, (m, p1, spec, p3) => {
    return `${p1}${rewriteSpecifier(fileDir, spec)}${p3}`;
  });

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return true;
  }
  return false;
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, onFile);
    } else if (stat.isFile()) {
      onFile(full);
    }
  }
}

let changed = 0;
walk(srcRoot, (file) => {
  if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
    if (processFile(file)) changed += 1;
  }
});

console.log(`ESM import rewrite complete. Files changed: ${changed}`);


