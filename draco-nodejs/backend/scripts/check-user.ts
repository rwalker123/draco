import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(username: string) {
  try {
    const user = await prisma.aspnetusers.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordhash: true
      }
    });

    if (!user) {
      console.log(`❌ User '${username}' not found`);
      return;
    }

    console.log(`📋 User: ${user.username}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🔐 Password Hash: ${user.passwordhash}`);
    console.log(`📏 Hash Length: ${user.passwordhash?.length || 0}`);

    if (user.passwordhash) {
      // Check if it's bcrypt (starts with $2b$ or $2a$)
      if (user.passwordhash.startsWith('$2b$') || user.passwordhash.startsWith('$2a$')) {
        console.log(`✅ Hash format: bcrypt (migrated)`);
      } else if (user.passwordhash.startsWith('temp_')) {
        console.log(`⚠️  Hash format: Temporary password (${user.passwordhash})`);
      } else {
        console.log(`🔍 Hash format: Legacy (not migrated)`);
        
        // Try to decode and analyze
        try {
          const decoded = Buffer.from(user.passwordhash, 'base64');
          console.log(`📊 Decoded length: ${decoded.length} bytes`);
          
          if (decoded.length === 49) {
            console.log(`🔍 Likely ASP.NET Identity format (49 bytes)`);
          } else if (decoded.length === 48) {
            console.log(`🔍 Likely ASP.NET Core format (48 bytes)`);
          } else if (user.passwordhash.includes('|')) {
            console.log(`🔍 Likely legacy ASP.NET format (contains |)`);
          } else {
            console.log(`🔍 Unknown format`);
          }
        } catch (error) {
          console.log(`❌ Could not decode hash as base64`);
        }
      }
    } else {
      console.log(`❌ No password hash found`);
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check the specific user
checkUser('raymondewalker+1@gmail.com'); 