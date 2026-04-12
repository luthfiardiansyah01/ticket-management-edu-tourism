const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // CRITICAL: Run E2E tests sequentially to avoid SQLITE_BUSY
  testSequencer: './jest.sequencer.js',
  maxWorkers: 1,
  
  // Group e2e tests
  testMatch: [
    '**/*.test.ts',
    '**/*.e2e.test.ts',
  ],
  
  // Run e2e tests sequentially
  // Use testSequencer or maxWorkers: 1
};

module.exports = createJestConfig(config);