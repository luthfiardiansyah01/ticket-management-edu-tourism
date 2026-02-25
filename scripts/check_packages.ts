import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function main() {
  console.log('Fetching packages from database...');
  try {
    const packages = await db.select().from(schema.ticketPackages);
    console.log(`Found ${packages.length} packages.`);
    packages.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}`);
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
  }
}

main();
