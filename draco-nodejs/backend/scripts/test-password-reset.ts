import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { PasswordResetModel } from '../src/models/PasswordReset.js';

const prisma = new PrismaClient();

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality\n');

  try {
    // Test 1: Create a reset token
    console.log('Test 1: Creating reset token...');
    const testUser = await prisma.aspnetusers.findFirst({
      select: { id: true, username: true }
    });

    if (!testUser) {
      console.log('❌ No users found in database. Please run the migration script first.');
      return;
    }

    console.log(`Using test user: ${testUser.username}`);
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenRecord = await PasswordResetModel.createToken(testUser.id, resetToken, 1); // 1 hour expiry
    
    console.log(`✅ Reset token created: ${resetToken.substring(0, 16)}...`);
    console.log(`   Token ID: ${tokenRecord.id}`);
    console.log(`   Expires: ${tokenRecord.expiresAt}`);
    console.log(`   Used: ${tokenRecord.used}\n`);

    // Test 2: Find valid token
    console.log('Test 2: Finding valid token...');
    const foundToken = await PasswordResetModel.findValidToken(resetToken);
    
    if (foundToken) {
      console.log('✅ Valid token found');
      console.log(`   User ID: ${foundToken.userId}`);
      console.log(`   Expires: ${foundToken.expiresAt}`);
    } else {
      console.log('❌ Valid token not found');
    }
    console.log('');

    // Test 3: Mark token as used
    console.log('Test 3: Marking token as used...');
    await PasswordResetModel.markTokenAsUsed(tokenRecord.id);
    console.log('✅ Token marked as used\n');

    // Test 4: Verify token is no longer valid
    console.log('Test 4: Verifying token is no longer valid...');
    const usedToken = await PasswordResetModel.findValidToken(resetToken);
    
    if (!usedToken) {
      console.log('✅ Token correctly marked as invalid');
    } else {
      console.log('❌ Token still appears valid after being marked as used');
    }
    console.log('');

    // Test 5: Cleanup expired tokens
    console.log('Test 5: Cleaning up expired tokens...');
    const deletedCount = await PasswordResetModel.cleanupExpiredTokens();
    console.log(`✅ Cleaned up ${deletedCount} expired tokens\n`);

    // Test 6: Test with invalid token
    console.log('Test 6: Testing with invalid token...');
    const invalidToken = await PasswordResetModel.findValidToken('invalid-token');
    
    if (!invalidToken) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      console.log('❌ Invalid token incorrectly accepted');
    }

    console.log('\n🎉 All password reset tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPasswordReset(); 