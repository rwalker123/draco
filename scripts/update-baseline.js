#!/usr/bin/env node

/**
 * Script to manually update the detect-secrets baseline
 * Run this when you want to update the baseline with new approved secrets
 */

const { execSync } = require('child_process');

console.log('🔄 Updating detect-secrets baseline...');

try {
  // Run detect-secrets scan to update the baseline
  execSync('~/Library/Python/3.9/bin/detect-secrets scan --baseline .secrets.baseline --exclude-files pnpm-lock.yaml', {
    stdio: 'inherit'
  });
  
  console.log('✅ Baseline updated successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Review the updated baseline file');
  console.log('   2. Commit the changes: git add .secrets.baseline && git commit -m "Update baseline"');
  console.log('   3. Push the changes: git push');
  
} catch (error) {
  console.error('❌ Error updating baseline:', error.message);
  process.exit(1);
} 