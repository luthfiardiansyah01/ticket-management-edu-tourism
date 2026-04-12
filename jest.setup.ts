import * as dotenv from 'dotenv';

// Load environment variables from .env.local for tests
dotenv.config({ path: '.env.local' });

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  // Use local SQLite database for tests
  process.env.DATABASE_URL = 'file:./local.db';
}

// Global test setup - runs once before all tests
beforeAll(async () => {
  // Give database time to initialize
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Global test teardown - runs once after all tests
afterAll(async () => {
  // Give database time to close connections
  await new Promise(resolve => setTimeout(resolve, 100));
});
