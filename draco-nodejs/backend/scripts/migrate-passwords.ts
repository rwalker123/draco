import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createHash, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

const prisma = new PrismaClient();

interface User {
  id: string;
  username: string;
  passwordhash: string;
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
        return false;
      }
      
      const [passwordHash, passwordFormat, saltB64] = parts;
      
      // Verify format version
      if (passwordFormat !== '1') {
        return false;
      }
      
      // Decode the hash (includes version byte)
      const hashBytes = Buffer.from(passwordHash, 'base64');
      if (hashBytes.length !== 21) { // 1 version byte + 20 hash bytes
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
      return false;
    }
  }
}

/**
 * ASP.NET Password Hasher Implementation
 * This mimics the ASP.NET Core PasswordHasher behavior
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
}

/**
 * ASP.NET Identity Default Password Hasher Implementation
 * Handles the 49-byte format with version byte, 1000 iterations, SHA1
 */
class AspNetIdentityPasswordHasher {
  private readonly keyDerivationPrf = 'sha1';
  private readonly iterationCount = 1000; // ASP.NET Identity default
  private readonly subkeyLength = 20; // ASP.NET Identity default
  private readonly saltSize = 16;

  /**
   * Verify password against ASP.NET Identity hash
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const decodedHash = Buffer.from(hashedPassword, 'base64');
      
      // Check if it's the 49-byte format with version byte
      if (decodedHash.length !== 49) {
        return false;
      }
      
      // Extract version byte, salt, and hash
      const version = decodedHash[0];
      const salt = decodedHash.slice(1, 1 + this.saltSize); // 16 bytes
      const hash = decodedHash.slice(1 + this.saltSize); // 32 bytes
      
      // Derive key using PBKDF2 with SHA1, 1000 iterations, 20-byte output
      const derivedKey = pbkdf2Sync(
        password,
        salt,
        this.iterationCount,
        this.subkeyLength,
        this.keyDerivationPrf
      );
      
      // Compare the derived key with the first 20 bytes of the stored hash
      return timingSafeEqual(hash.slice(0, 20), derivedKey);
    } catch (error) {
      return false;
    }
  }
}

/**
 * Password Migration Script
 */
class PasswordMigration {
  private legacyHasher = new LegacySqlPasswordHasher();
  private aspNetHasher = new AspNetPasswordHasher();
  private aspNetIdentityHasher = new AspNetIdentityPasswordHasher();
  private batchSize = 100;
  private processedCount = 0;
  private successCount = 0;
  private errorCount = 0;

  /**
   * Check if hash is in ASP.NET Identity default format (49 bytes, version byte)
   */
  private isAspNetIdentityHash(hash: string): boolean {
    try {
      const decoded = Buffer.from(hash, 'base64');
      // ASP.NET Identity hashes are 49 bytes (1 version + 16 salt + 32 hash)
      return decoded.length === 49;
    } catch {
      return false;
    }
  }

  /**
   * Check if hash is in legacy ASP.NET format ({hash}|1|{salt})
   */
  private isLegacyHash(hash: string): boolean {
    try {
      const parts = hash.split('|');
      if (parts.length !== 3) return false;
      
      const [passwordHash, passwordFormat, saltB64] = parts;
      if (passwordFormat !== '1') return false;
      
      // Verify hash structure
      const hashBytes = Buffer.from(passwordHash, 'base64');
      return hashBytes.length === 21; // 1 version + 20 hash bytes
    } catch {
      return false;
    }
  }

  /**
   * Check if hash is in ASP.NET Core format (base64, 48 bytes)
   */
  private isAspNetHash(hash: string): boolean {
    try {
      const decoded = Buffer.from(hash, 'base64');
      // ASP.NET Core hashes are typically 48 bytes (16 salt + 32 hash)
      return decoded.length === 48;
    } catch {
      return false;
    }
  }

  /**
   * Check if hash is already in bcrypt format
   */
  private isBcryptHash(hash: string): boolean {
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are typically 60 characters
    return /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(hash);
  }

  /**
   * Migrate a single user's password
   */
  private async migrateUserPassword(user: User): Promise<boolean> {
    try {
      const { id, username, passwordhash } = user;

      // Skip if already bcrypt
      if (this.isBcryptHash(passwordhash)) {
        console.log(`✅ User ${username} already has bcrypt hash, skipping`);
        return true;
      }

      // Check if it's ASP.NET Identity default format
      if (this.isAspNetIdentityHash(passwordhash)) {
        console.log(`⚠️  User ${username} has ASP.NET Identity default hash format`);
        console.log(`   Hash: ${passwordhash}`);
        console.log(`   This format cannot be migrated without knowing the original password`);
        console.log(`   Will set temporary password and require reset`);
        return false;
      }

      // Check if it's legacy format
      if (this.isLegacyHash(passwordhash)) {
        console.log(`⚠️  User ${username} has legacy ASP.NET hash format`);
        console.log(`   Hash: ${passwordhash}`);
        console.log(`   This format cannot be migrated without knowing the original password`);
        console.log(`   Will set temporary password and require reset`);
        return false;
      }

      // Check if it's ASP.NET Core format
      if (this.isAspNetHash(passwordhash)) {
        console.log(`⚠️  User ${username} has ASP.NET Core hash format`);
        console.log(`   Hash: ${passwordhash}`);
        console.log(`   This format cannot be migrated without knowing the original password`);
        console.log(`   Will set temporary password and require reset`);
        return false;
      }

      // Unknown format
      console.log(`⚠️  User ${username} has unknown hash format, skipping`);
      console.log(`   Hash: ${passwordhash}`);
      return false;
    } catch (error) {
      console.error(`❌ Error migrating user ${user.username}:`, error);
      return false;
    }
  }

  /**
   * Get all users that need migration
   */
  private async getUsersToMigrate(): Promise<User[]> {
    const users = await prisma.aspnetusers.findMany({
      select: {
        id: true,
        username: true,
        passwordhash: true
      },
      where: {
        passwordhash: {
          not: null
        }
      }
    });

    return users
      .filter(user => user.username && user.passwordhash) // Filter out null values
      .map(user => ({
        id: user.id,
        username: user.username!,
        passwordhash: user.passwordhash!
      }))
      .filter(user => !this.isBcryptHash(user.passwordhash));
  }

  /**
   * Run the migration
   */
  async run(): Promise<void> {
    console.log('🚀 Starting password migration...');
    console.log('📊 Fetching users to migrate...');

    const usersToMigrate = await this.getUsersToMigrate();
    console.log(`📋 Found ${usersToMigrate.length} users to process`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration - all passwords are already in bcrypt format');
      return;
    }

    console.log('\n🔍 Analyzing hash formats...');
    const aspNetIdentityUsers = usersToMigrate.filter(user => this.isAspNetIdentityHash(user.passwordhash));
    const legacyUsers = usersToMigrate.filter(user => this.isLegacyHash(user.passwordhash));
    const aspNetUsers = usersToMigrate.filter(user => this.isAspNetHash(user.passwordhash));
    const unknownFormatUsers = usersToMigrate.filter(user => 
      !this.isAspNetIdentityHash(user.passwordhash) &&
      !this.isLegacyHash(user.passwordhash) && 
      !this.isAspNetHash(user.passwordhash) && 
      !this.isBcryptHash(user.passwordhash)
    );

    console.log(`📊 Hash format breakdown:`);
    console.log(`   - ASP.NET Identity default: ${aspNetIdentityUsers.length}`);
    console.log(`   - Legacy ASP.NET format: ${legacyUsers.length}`);
    console.log(`   - ASP.NET Core format: ${aspNetUsers.length}`);
    console.log(`   - Unknown format: ${unknownFormatUsers.length}`);
    console.log(`   - Already bcrypt: ${usersToMigrate.length - aspNetIdentityUsers.length - legacyUsers.length - aspNetUsers.length - unknownFormatUsers.length}`);

    if (aspNetIdentityUsers.length > 0) {
      console.log('\n⚠️  IMPORTANT: Users with ASP.NET Identity default hashes found!');
      console.log('   These use PBKDF2-SHA1 with 1000 iterations (49-byte format)');
      console.log('   Since we cannot decrypt these hashes, you have these options:');
      console.log('   1. Set temporary passwords and require users to reset');
      console.log('   2. Use known passwords if available');
      console.log('   3. Contact users to reset their passwords');
      console.log('   4. Skip migration for these users');
      
      console.log('\n📋 Users with ASP.NET Identity default hashes:');
      aspNetIdentityUsers.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user.id})`);
      });
    }

    if (legacyUsers.length > 0) {
      console.log('\n⚠️  IMPORTANT: Users with legacy ASP.NET hashes found!');
      console.log('   These use the format {hash}|1|{salt} with SHA1 hashing');
      console.log('   Since we cannot decrypt these hashes, you have these options:');
      console.log('   1. Set temporary passwords and require users to reset');
      console.log('   2. Use known passwords if available');
      console.log('   3. Contact users to reset their passwords');
      console.log('   4. Skip migration for these users');
      
      console.log('\n📋 Users with legacy ASP.NET hashes:');
      legacyUsers.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user.id})`);
      });
    }

    if (aspNetUsers.length > 0) {
      console.log('\n⚠️  IMPORTANT: Users with ASP.NET Core hashes found!');
      console.log('   These use PBKDF2 with SHA256 and cannot be decrypted');
      console.log('   Since we cannot decrypt these hashes, you have these options:');
      console.log('   1. Set temporary passwords and require users to reset');
      console.log('   2. Use known passwords if available');
      console.log('   3. Contact users to reset their passwords');
      console.log('   4. Skip migration for these users');
      
      console.log('\n📋 Users with ASP.NET Core hashes:');
      aspNetUsers.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user.id})`);
      });
    }

    if (unknownFormatUsers.length > 0) {
      console.log('\n⚠️  Users with unknown hash format:');
      unknownFormatUsers.forEach(user => {
        console.log(`   - ${user.username} (Hash: ${user.passwordhash})`);
      });
    }

    console.log('\n💡 Migration Strategy:');
    console.log('   1. For ASP.NET Identity users: Set temporary password and require reset');
    console.log('   2. For legacy ASP.NET users: Set temporary password and require reset');
    console.log('   3. For ASP.NET Core users: Set temporary password and require reset');
    console.log('   4. For unknown format: Skip and investigate');
    console.log('   5. For bcrypt users: Already migrated');

    // Set temporary passwords for users that need migration
    const usersNeedingMigration = [...aspNetIdentityUsers, ...legacyUsers, ...aspNetUsers];
    if (usersNeedingMigration.length > 0) {
      console.log('\n🔧 Setting temporary passwords for users needing migration...');
      
      for (const user of usersNeedingMigration) {
        try {
          const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const bcryptHash = await bcrypt.hash(tempPassword, 12);
          
          await prisma.aspnetusers.update({
            where: { id: user.id },
            data: { passwordhash: bcryptHash }
          });
          
          console.log(`✅ User ${user.username} migrated with temporary password: ${tempPassword}`);
          this.successCount++;
        } catch (error) {
          console.error(`❌ Failed to migrate user ${user.username}:`, error);
          this.errorCount++;
        }
        this.processedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   - Processed: ${this.processedCount}`);
    console.log(`   - Successful: ${this.successCount}`);
    console.log(`   - Errors: ${this.errorCount}`);
    console.log(`   - Skipped: ${usersToMigrate.length - this.processedCount}`);

    if (this.successCount > 0) {
      console.log('\n⚠️  IMPORTANT: Users with temporary passwords need to reset them!');
      console.log('   Consider implementing a password reset flow.');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const migration = new PasswordMigration();
    await migration.run();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { PasswordMigration, AspNetPasswordHasher }; 