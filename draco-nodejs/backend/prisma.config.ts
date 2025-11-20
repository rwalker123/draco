import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ezrecsports';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    // Fallback avoids CI build failures when DATABASE_URL is not provided.
    url: databaseUrl,
    shadowDatabaseUrl,
  },
});
