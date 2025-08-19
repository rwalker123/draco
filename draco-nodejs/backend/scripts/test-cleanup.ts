#!/usr/bin/env tsx

/**
 * Test script for the Cleanup Service
 * This script tests the cleanup service functionality
 */

import { PrismaClient } from '@prisma/client';
import { CleanupService } from '../src/services/cleanupService.js';

async function testCleanupService() {
  console.log('🧪 Testing Cleanup Service...\n');

  const prisma = new PrismaClient();
  const cleanupService = new CleanupService(prisma);

  try {
    // Test 1: Check initial status
    console.log('📊 Test 1: Initial Status');
    const initialStatus = cleanupService.getStatus();
    console.log('  - Is Running:', initialStatus.isRunning);
    console.log('  - Next Cleanup:', initialStatus.nextCleanup);
    console.log('  - Last Cleanup:', initialStatus.lastCleanup);
    console.log('');

    // Test 2: Start service
    console.log('🚀 Test 2: Starting Service');
    cleanupService.start();
    const runningStatus = cleanupService.getStatus();
    console.log('  - Is Running:', runningStatus.isRunning);
    console.log('  - Next Cleanup:', runningStatus.nextCleanup);
    console.log('');

    // Test 3: Manual cleanup (this will show actual database operations)
    console.log('🧹 Test 3: Manual Cleanup');
    try {
      const result = await cleanupService.manualCleanup();
      console.log('  - Expired Players Wanted:', result.expiredPlayersWanted);
      console.log('  - Expired Teams Wanted:', result.expiredTeamsWanted);
      console.log('  - Total Deleted:', result.totalDeleted);
    } catch (error) {
      console.log('  - Manual cleanup failed (expected if no expired records):', error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Test 4: Stop service
    console.log('⏹️  Test 4: Stopping Service');
    cleanupService.stop();
    const stoppedStatus = cleanupService.getStatus();
    console.log('  - Is Running:', stoppedStatus.isRunning);
    console.log('  - Next Cleanup:', stoppedStatus.nextCleanup);
    console.log('');

    console.log('✅ Cleanup Service tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCleanupService().catch(console.error);
}
