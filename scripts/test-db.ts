
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Testing connection to:', url);
// console.log('Auth Token:', authToken); // Don't print secrets

if (!url) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

async function main() {
  try {
    const result = await client.execute("SELECT count(*) as count FROM ticket_packages;");
    console.log('Packages count:', result.rows[0]);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    client.close();
  }
}

main();
