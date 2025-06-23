import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestDomainUrls() {
  try {
    console.log('Adding test domain URLs...');

    // Get the first account (assuming it exists)
    const firstAccount = await prisma.accounts.findFirst({
      select: {
        id: true,
        name: true
      }
    });

    if (!firstAccount) {
      console.log('No accounts found in database. Please create an account first.');
      return;
    }

    console.log(`Found account: ${firstAccount.name} (ID: ${firstAccount.id})`);

    // Add test domain URLs
    const testUrls = [
      'www.detroitmsl.com',
      'detroitmsl.com',
      'localhost:3000',
      '127.0.0.1:3000'
    ];

    for (const url of testUrls) {
      // Check if URL already exists
      const existingUrl = await prisma.accountsurl.findFirst({
        where: {
          accountid: firstAccount.id,
          url: url
        }
      });

      if (!existingUrl) {
        await prisma.accountsurl.create({
          data: {
            accountid: firstAccount.id,
            url: url
          }
        });
        console.log(`Added URL: ${url}`);
      } else {
        console.log(`URL already exists: ${url}`);
      }
    }

    // List all URLs for the account
    const accountUrls = await prisma.accountsurl.findMany({
      where: {
        accountid: firstAccount.id
      },
      select: {
        id: true,
        url: true
      }
    });

    console.log('\nAll URLs for account:');
    accountUrls.forEach(url => {
      console.log(`  - ${url.url} (ID: ${url.id})`);
    });

    console.log('\nTest domain routing by visiting:');
    console.log('  - http://localhost:3000 (should redirect to account home)');
    console.log('  - http://127.0.0.1:3000 (should redirect to account home)');

  } catch (error) {
    console.error('Error adding test domain URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestDomainUrls(); 