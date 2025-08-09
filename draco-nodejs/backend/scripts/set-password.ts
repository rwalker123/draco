import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setPassword(username: string, password: string) {
  try {
    // Find the user
    const user = await prisma.aspnetusers.findFirst({
      where: { username },
      select: {
        id: true,
        username: true
      }
    });

    if (!user) {
      console.log(`❌ User '${username}' not found`);
      return;
    }

    console.log(`📋 User: ${user.username}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🔐 Setting password: ${password}`);

    // Hash the password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log(`🔑 Generated bcrypt hash: ${hashedPassword}`);

    // Update the user's password
    await prisma.aspnetusers.update({
      where: { id: user.id },
      data: { passwordhash: hashedPassword }
    });

    console.log(`✅ Password successfully updated for user ${username}`);

  } catch (error) {
    console.error('❌ Error setting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Set the password for the specific user
setPassword('raymondewalker+1@gmail.com', 'abc#def'); 