#!/usr/bin/env node

const { execFileSync } = require('child_process');

function findBinary(name) {
  const searchPath = `${process.env.HOME}/Library/Python/3.9/bin:${process.env.HOME}/.local/bin:${process.env.PATH}`;
  try {
    return execFileSync('which', [name], {
      encoding: 'utf8',
      env: { ...process.env, PATH: searchPath },
    }).trim();
  } catch {
    return null;
  }
}

console.log('Updating detect-secrets baseline...');

const detectSecrets = findBinary('detect-secrets');
if (!detectSecrets) {
  console.error('detect-secrets not found in PATH.');
  console.error('Install with: pip install detect-secrets');
  process.exit(1);
}

try {
  execFileSync(detectSecrets, ['scan', '--baseline', '.secrets.baseline', '--exclude-files', 'pnpm-lock.yaml'], {
    stdio: 'inherit',
  });

  console.log('Baseline updated successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('   1. Review the updated baseline file');
  console.log('   2. Commit the changes: git add .secrets.baseline && git commit -m "Update baseline"');
  console.log('   3. Push the changes: git push');
} catch (error) {
  console.error('Error updating baseline:', error.message);
  process.exit(1);
}
