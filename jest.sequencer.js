const Sequencer = require('@jest/test-sequencer').default;

class E2ESequencer extends Sequencer {
  sort(tests) {
    // Run e2e tests last and sequentially
    const e2eTests = tests.filter(t => t.path.includes('.e2e.test.ts'));
    const unitTests = tests.filter(t => !t.path.includes('.e2e.test.ts'));
    
    return [...unitTests, ...e2eTests];
  }
}

module.exports = E2ESequencer;