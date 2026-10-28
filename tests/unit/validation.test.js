/**
 * Banana Brain — Unit Test Suite: Input Sanitization & Contract Validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BananaApiService } from '../../src/services/banana-api.service.js';

describe('Validation & Contract Rules Unit Tests', () => {
  const service = new BananaApiService();

  it('should accept valid Banana API response schema', () => {
    const valid = {
      question: 'https://www.sanfoh.com/uob/banana/data/sample123.png',
      solution: 7
    };
    assert.equal(service.validateApiResponse(valid), true);
  });

  it('should reject malformed non-object response', () => {
    assert.throws(() => service.validateApiResponse(null), /Malformed API response/);
    assert.throws(() => service.validateApiResponse('not-json'), /Malformed API response/);
  });

  it('should reject non-HTTP question URL', () => {
    const bad = { question: 'ftp://evil.com/payload.png', solution: 4 };
    assert.throws(() => service.validateApiResponse(bad), /must be a valid HTTP\/HTTPS URL/);
  });

  it('should reject out-of-range or non-numeric solution', () => {
    assert.throws(() => service.validateApiResponse({ question: 'https://valid.com/img.png', solution: -1 }), /must be an integer between 0 and 9/);
    assert.throws(() => service.validateApiResponse({ question: 'https://valid.com/img.png', solution: 15 }), /must be an integer between 0 and 9/);
    assert.throws(() => service.validateApiResponse({ question: 'https://valid.com/img.png', solution: 'banana' }), /must be an integer between 0 and 9/);
  });

  it('should correctly validate single-digit user answer submissions', () => {
    const isValidAnswer = (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 9 && String(num) === String(val).trim();
    };

    assert.equal(isValidAnswer('0'), true);
    assert.equal(isValidAnswer('8'), true);
    assert.equal(isValidAnswer('9'), true);
    assert.equal(isValidAnswer('-1'), false);
    assert.equal(isValidAnswer('10'), false);
    assert.equal(isValidAnswer('abc'), false);
    assert.equal(isValidAnswer(''), false);
  });
});
