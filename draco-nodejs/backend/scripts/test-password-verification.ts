import { PrismaClient } from '@prisma/client';
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const prisma = new PrismaClient();

/**
 * ASP.NET Password Hasher Implementation
 */
class AspNetPasswordHasher {
  private readonly keyDerivationPrf = 'sha256';
  private readonly iterationCount = 10000;
  private readonly subkeyLength = 32;
  private readonly saltSize = 16;

  /**
   * Verify password against ASP.NET hash
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const decodedHash = Buffer.from(hashedPassword, 'base64');
      
      // Extract salt and hash from the decoded bytes
      const salt = decodedHash.slice(0, this.saltSize);
      const hash = decodedHash.slice(this.saltSize);
      
      // Derive key using PBKDF2
      const derivedKey = pbkdf2Sync(
        password,
        salt,
        this.iterationCount,
        this.subkeyLength,
        this.keyDerivationPrf
      );
      
      // Compare the derived key with the stored hash
      return timingSafeEqual(hash, derivedKey);
    } catch (error) {
      console.error('Error verifying ASP.NET password:', error);
      return false;
    }
  }

  /**
   * Hash password using ASP.NET format (for testing)
   */
  hashPassword(password: string): string {
    const salt = randomBytes(this.saltSize);
    const hash = pbkdf2Sync(
      password,
      salt,
      this.iterationCount,
      this.subkeyLength,
      this.keyDerivationPrf
    );
    
    // Combine salt and hash
    const combined = Buffer.concat([salt, hash]);
    return combined.toString('base64');
  }
}

/**
 * Legacy ASP.NET SQL Password Hasher Implementation
 * Based on SQLPasswordHasher.cs from the original ASP.NET application
 * Format: {hash}|1|{salt} where hash is SHA1(salt + password as UTF-16LE)
 */
class LegacySqlPasswordHasher {
  verifyPassword(password: string, storedHash: string): boolean {
    try {
      // Parse the hash format: {hash}|1|{salt}
      const parts = storedHash.split('|');
      if (parts.length !== 3) {
        console.log('Invalid hash format: expected 3 parts separated by |');
        return false;
      }
      
      const [passwordHash, passwordFormat, saltB64] = parts;
      
      // Verify format version
      if (passwordFormat !== '1') {
        console.log(`Unsupported password format: ${passwordFormat}`);
        return false;
      }
      
      // Decode the hash (includes version byte)
      const hashBytes = Buffer.from(passwordHash, 'base64');
      if (hashBytes.length !== 21) { // 1 version byte + 20 hash bytes
        console.log(`Invalid hash length: ${hashBytes.length} bytes (expected 21)`);
        return false;
      }
      
      // Extract version byte and actual hash
      const version = hashBytes[0];
      const storedHashBytes = hashBytes.slice(1); // 20 bytes
      
      // Decode the salt
      const salt = Buffer.from(saltB64, 'base64');
      
      // Convert password to UTF-16LE bytes
      const passwordBytes = Buffer.from(password, 'utf16le');
      
      // Concatenate salt + password
      const toHash = Buffer.concat([salt, passwordBytes]);
      
      // Compute SHA1 hash
      const computedHash = createHash('sha1').update(toHash).digest();
      
      // Compare computed hash with stored hash
      return timingSafeEqual(computedHash, storedHashBytes);
      
    } catch (error) {
      console.error('Error verifying legacy password:', error);
      return false;
    }
  }

  /**
   * Hash password using legacy format (for testing)
   */
  hashPassword(password: string): string {
    // Generate random salt
    const salt = randomBytes(16);
    
    // Convert password to UTF-16LE bytes
    const passwordBytes = Buffer.from(password, 'utf16le');
    
    // Concatenate salt + password
    const toHash = Buffer.concat([salt, passwordBytes]);
    
    // Compute SHA1 hash
    const hash = createHash('sha1').update(toHash).digest();
    
    // Add version byte (0x00 for legacy format)
    const hashWithVersion = Buffer.concat([Buffer.from([0x00]), hash]);
    
    // Format: {hash}|1|{salt}
    return `${hashWithVersion.toString('base64')}|1|${salt.toString('base64')}`;
  }
}

/**
 * ASP.NET Core Password Hasher Implementation
 * Handles the 49-byte format with version byte
 */
class AspNetCorePasswordHasher {
  private readonly keyDerivationPrf = 'sha1';
  private readonly subkeyLength = 20;
  private readonly saltSize = 16;

  /**
   * Try multiple iteration counts for verification
   */
  tryVerifyWithIterations(password: string, hashedPassword: string, iterationsToTry: number[]): boolean {
    const decodedHash = Buffer.from(hashedPassword, 'base64');
    if (decodedHash.length !== 49) {
      return false;
    }
    const version = decodedHash[0];
    const salt = decodedHash.slice(1, 1 + this.saltSize); // 16 bytes
    const hash = decodedHash.slice(1 + this.saltSize); // 32 bytes (but we'll try 20 first)
    
    console.log(`  Version byte: ${version} (0x${version.toString(16)})`);
    console.log(`  Salt (hex): ${salt.toString('hex')}`);
    console.log(`  Hash (hex): ${hash.toString('hex')}`);
    console.log(`  Hash length: ${hash.length} bytes`);
    
    let anySuccess = false;
    for (const iter of iterationsToTry) {
      try {
        // Try with 20-byte hash (ASP.NET Identity default)
          const derivedKey20 = pbkdf2Sync(
          password,
          salt,
          iter,
          20, // 20 bytes
          this.keyDerivationPrf
        );
          const match20 = timingSafeEqual(hash.slice(0, 20), derivedKey20);
        console.log(`  Iterations: ${iter}, 20-byte hash => ${match20 ? '✅ MATCH' : '❌ no match'}`);
        if (match20) anySuccess = true;
        
        // Also try with 32-byte hash (in case it's a newer format)
        if (hash.length >= 32) {
          const derivedKey32 = pbkdf2Sync(
            password,
            salt,
            iter,
            32, // 32 bytes
            this.keyDerivationPrf
          );
          const match32 = timingSafeEqual(hash.slice(0, 32), derivedKey32);
          console.log(`  Iterations: ${iter}, 32-byte hash => ${match32 ? '✅ MATCH' : '❌ no match'}`);
          if (match32) anySuccess = true;
        }
      } catch (e) {
        console.log(`  Iterations: ${iter} => error: ${e}`);
      }
    }
    return anySuccess;
  }
}

async function testPasswordVerification() {
  const hasher = new AspNetPasswordHasher();
  const legacyHasher = new LegacySqlPasswordHasher();
  const coreHasher = new AspNetCorePasswordHasher();
  
  console.log('🧪 Testing ASP.NET Password Verification...\n');

  // Test 1: Create and verify a test password
  console.log('Test 1: Create and verify test password');
  const testPassword = 'testpass123';
  const testHash = hasher.hashPassword(testPassword);
  console.log(`Password: ${testPassword}`);
  console.log(`Generated Hash: ${testHash}`);
  console.log(`Verification: ${hasher.verifyPassword(testPassword, testHash)}`);
  console.log(`Wrong Password: ${hasher.verifyPassword('wrongpass', testHash)}`);
  console.log('');

  // Test 2: Test with known user credentials
  console.log('Test 2: Test with known user credentials');
  const knownUsername = 'raymondewalker+1@gmail.com';
  const knownPassword = 'abc#def';
  
  try {
    const user = await prisma.aspnetusers.findUnique({
      where: { username: knownUsername },
      select: { id: true, username: true, passwordhash: true }
    });

    if (user) {
      console.log(`Found user: ${user.username}`);
      console.log(`Stored hash: ${user.passwordhash}`);
      
      if (user.passwordhash) {
        // Detailed hash analysis
        console.log('\n🔍 Detailed hash analysis:');
        const decodedHash = Buffer.from(user.passwordhash, 'base64');
        console.log(`- Raw hash (base64): ${user.passwordhash}`);
        console.log(`- Decoded length: ${decodedHash.length} bytes`);
        console.log(`- Decoded hex: ${decodedHash.toString('hex')}`);
        
        // Check if it contains pipe separators
        const hashString = user.passwordhash;
        if (hashString.includes('|')) {
          console.log('- Contains pipe separators - checking legacy format');
          const parts = hashString.split('|');
          console.log(`- Parts: ${parts.length}`);
          parts.forEach((part, index) => {
            console.log(`  Part ${index}: ${part}`);
          });
        } else {
          console.log('- No pipe separators - not legacy format');
        }
        
        // Check first few bytes for patterns
        console.log('- First 10 bytes:', decodedHash.slice(0, 10).toString('hex'));
        console.log('- Last 10 bytes:', decodedHash.slice(-10).toString('hex'));
        
        // Try to identify format based on length and content
        if (decodedHash.length === 49) {
          console.log('- 49-byte format detected');
          console.log('- This might be a custom format or modified ASP.NET format');
          
          // Check if first byte is a version indicator
          const version = decodedHash[0];
          console.log(`- First byte (version?): ${version} (0x${version.toString(16)})`);
          
          // Check if it follows any known pattern
          const remainingBytes = decodedHash.slice(1);
          console.log(`- Remaining bytes: ${remainingBytes.length} bytes`);
          console.log(`- Remaining hex: ${remainingBytes.toString('hex')}`);
        }
        
        // Test different hash verification methods
        console.log('\nTesting hash verification:');
        const parts = user.passwordhash.split('|');
        if (parts.length === 3) {
          const [passwordHash, passwordFormat, saltB64] = parts;
          const hashBytes = Buffer.from(passwordHash, 'base64');
          const salt = Buffer.from(saltB64, 'base64');
          const passwordBytes = Buffer.from(knownPassword, 'utf16le');
          const toHash = Buffer.concat([salt, passwordBytes]);
          const computedHash = Buffer.from(createHash('sha1').update(toHash).digest());
          console.log(`- Hash bytes (base64): ${passwordHash}`);
          console.log(`- Hash bytes (hex): ${hashBytes.toString('hex')}`);
          console.log(`- Hash bytes length: ${hashBytes.length}`);
          console.log(`- Version byte: ${hashBytes[0]}`);
          console.log(`- Stored hash (hex): ${hashBytes.slice(1).toString('hex')}`);
          console.log(`- Salt (base64): ${saltB64}`);
          console.log(`- Salt (hex): ${salt.toString('hex')}`);
          console.log(`- Salt length: ${salt.length}`);
          console.log(`- Computed hash (hex): ${computedHash.toString('hex')}`);
          // Compare byte by byte
          for (let i = 0; i < computedHash.length; i++) {
            console.log(`  Byte ${i}: stored=${hashBytes[i+1]?.toString(16)} computed=${computedHash[i]?.toString(16)}`);
          }
        }
        console.log(`- Legacy SQL verification: ${legacyHasher.verifyPassword(knownPassword, user.passwordhash)}`);
        console.log(`- Bcrypt verification: ${await import('bcrypt').then(bcrypt => bcrypt.compare(knownPassword, user.passwordhash!))}`);
        console.log(`- ASP.NET verification: ${hasher.verifyPassword(knownPassword, user.passwordhash)}`);
        console.log(`- ASP.NET Core verification: ${coreHasher.tryVerifyWithIterations(knownPassword, user.passwordhash, [1000, 10000, 50000, 100000, 600000])}`);
        
        // Check hash format
        const decodedHash2 = Buffer.from(user.passwordhash, 'base64');
        console.log(`- Hash length: ${decodedHash2.length} bytes`);
        console.log(`- Is ASP.NET format (48 bytes): ${decodedHash2.length === 48}`);
        
        // Try to extract salt and hash
        if (decodedHash2.length === 48) {
          const salt = decodedHash2.slice(0, 16);
          const hash = decodedHash2.slice(16);
          console.log(`- Salt (hex): ${salt.toString('hex')}`);
          console.log(`- Hash (hex): ${hash.toString('hex')}`);
        }
      } else {
        console.log('User has no password hash stored');
      }
    } else {
      console.log(`User ${knownUsername} not found in database`);
    }
  } catch (error) {
    console.error('Error testing user:', error);
  }

  // Test 3: Check all users with ASP.NET format hashes
  console.log('\nTest 3: Check all users with ASP.NET format hashes');
  try {
    const users = await prisma.aspnetusers.findMany({
      select: { id: true, username: true, passwordhash: true },
      take: 5
    });

    users.forEach(user => {
      if (user.passwordhash) {
        const decodedHash = Buffer.from(user.passwordhash, 'base64');
        const isAspNetFormat = decodedHash.length === 48;
        console.log(`${user.username}: ${isAspNetFormat ? 'ASP.NET format' : 'Unknown format'} (${decodedHash.length} bytes)`);
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

async function main() {
  try {
    await testPasswordVerification();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { AspNetPasswordHasher }; 