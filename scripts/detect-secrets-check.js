#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getMacOSPythonBinPaths() {
  const libPython = path.join(process.env.HOME, 'Library', 'Python');
  if (!fs.existsSync(libPython)) return [];
  try {
    return fs.readdirSync(libPython)
      .map(ver => path.join(libPython, ver, 'bin'))
      .filter(p => fs.existsSync(p));
  } catch {
    return [];
  }
}

function findBinary(name) {
  const extraPaths = [
    `${process.env.HOME}/.local/bin`,
    ...getMacOSPythonBinPaths(),
  ];
  const searchPath = [...extraPaths, process.env.PATH].join(':');
  try {
    return execFileSync('which', [name], {
      encoding: 'utf8',
      env: { ...process.env, PATH: searchPath },
    }).trim();
  } catch {
    return null;
  }
}

function main() {
  const stagedFiles = process.argv.slice(2);

  if (stagedFiles.length === 0) {
    console.log('No staged files to check');
    return 0;
  }

  console.log('Running detect-secrets check on staged files...');

  const detectSecretsHook = findBinary('detect-secrets-hook');
  if (!detectSecretsHook) {
    console.error('detect-secrets-hook not found in PATH.');
    console.error('Install with: pip install detect-secrets');
    return 1;
  }

  const baselinePath = '.secrets.baseline';
  const tempBaselinePath = '.secrets.baseline.tmp';
  const excludeFilesPattern = 'scripts/load-test\\.config\\.example\\.json|pnpm-lock\\.yaml';

  if (fs.existsSync(baselinePath)) {
    fs.copyFileSync(baselinePath, tempBaselinePath);
  }

  try {
    execFileSync(
      detectSecretsHook,
      ['--exclude-files', excludeFilesPattern, '--baseline', baselinePath, ...stagedFiles],
      { stdio: 'inherit' },
    );

    console.log('detect-secrets check passed');
    return 0;
  } catch (error) {
    if (fs.existsSync(tempBaselinePath)) {
      fs.copyFileSync(tempBaselinePath, baselinePath);
    }

    console.log('\ndetect-secrets found potential secrets in staged files');
    console.log('');
    console.log('To add a new secret to the baseline (if it\'s approved):');
    console.log('   pnpm secrets:update-baseline');
    console.log('   git add .secrets.baseline && git commit -m "Update baseline"');

    return 1;
  } finally {
    if (fs.existsSync(tempBaselinePath)) {
      fs.unlinkSync(tempBaselinePath);
    }
  }
}

process.exit(main());
