#!/usr/bin/env node

/**
 * Security Check Script for Git Pre-commit Hook
 * This script is now deprecated in favor of detect-secrets
 * Kept for reference but not actively used
 */

const { execSync } = require('child_process');

function main() {
  console.log('🔒 Security check script - now using detect-secrets instead');
  console.log('✅ This script is deprecated and will always pass');
  return 0;
}

// Run the security check
process.exit(main()); 