/**
 * Banana Brain — Automated Master Test Runner
 * Orchestrates all Unit and Integration test suites for the University Assessment.
 */
import './unit/scoring.test.js';
import './unit/validation.test.js';
import './integration/auth.test.js';
import './integration/game-flow.test.js';
import './integration/banana-api.test.js';

console.log('Master Test Runner loaded all unit & integration test suites.');
