#!/usr/bin/env node

/**
 * Wrapper script for detect-secrets-hook that prevents baseline updates
 * This prevents the baseline from being modified on every commit
 */

const { execSync } = require('child_process');
const fs = require('fs');

function main() {
  const args = process.argv.slice(2);
  const stagedFiles = args.join(' ');
  
  if (!stagedFiles) {
    console.log('✅ No staged files to check');
    return 0;
  }
  
  console.log('🔒 Running detect-secrets check on staged files...');
  
  // Create a temporary copy of the baseline
  const baselinePath = '.secrets.baseline';
  const tempBaselinePath = '.secrets.baseline.tmp';
  const excludeFilesPattern = 'scripts/load-test\\.config\\.example\\.json|pnpm-lock\\.yaml';
  
  if (fs.existsSync(baselinePath)) {
    fs.copyFileSync(baselinePath, tempBaselinePath);
  }
  
  try {
    // Run detect-secrets-hook
    execSync(
      `~/Library/Python/3.9/bin/detect-secrets-hook --exclude-files ${excludeFilesPattern} --baseline ${baselinePath} ${stagedFiles}`,
      {
        stdio: 'inherit'
      },
    );
    
    console.log('✅ detect-secrets check passed');
    return 0;
    
  } catch (error) {
    // Restore the original baseline if it was modified
    if (fs.existsSync(tempBaselinePath)) {
      fs.copyFileSync(tempBaselinePath, baselinePath);
    }
    
    console.log('\n❌ detect-secrets found potential secrets in staged files');
    console.log('');
    console.log('💡 To add a new secret to the baseline (if it\'s approved):');
    console.log('   pnpm secrets:update-baseline');
    console.log('   git add .secrets.baseline && git commit -m "Update baseline"');
    
    return 1;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempBaselinePath)) {
      fs.unlinkSync(tempBaselinePath);
    }
  }
}

process.exit(main()); 
