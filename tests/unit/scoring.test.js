/**
 * Banana Brain — Unit Test Suite: Scoring Algorithms & Streak Logic
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function calculateScore({ isCorrect, responseTimeMs, currentStreak }) {
  if (!isCorrect) {
    return {
      pointsAwarded: 0,
      speedBonus: 0,
      streakBonus: 0,
      newStreak: 0
    };
  }

  const basePoints = 100;
  let speedBonus = 0;
  if (responseTimeMs < 10000) {
    speedBonus = 50;
  } else if (responseTimeMs < 20000) {
    speedBonus = 30;
  } else if (responseTimeMs < 30000) {
    speedBonus = 15;
  }

  const newStreak = currentStreak + 1;
  const streakBonus = Math.min(newStreak * 10, 100);
  const pointsAwarded = basePoints + speedBonus + streakBonus;

  return {
    pointsAwarded,
    speedBonus,
    streakBonus,
    newStreak
  };
}

describe('Scoring & Streak Engine Unit Tests', () => {
  it('should award base 100 points for correct answer without speed bonus', () => {
    const result = calculateScore({ isCorrect: true, responseTimeMs: 35000, currentStreak: 0 });
    assert.equal(result.pointsAwarded, 110); // 100 base + 0 speed + 10 streak (1st win)
    assert.equal(result.speedBonus, 0);
    assert.equal(result.streakBonus, 10);
    assert.equal(result.newStreak, 1);
  });

  it('should award maximum +50 speed bonus for answers under 10 seconds', () => {
    const result = calculateScore({ isCorrect: true, responseTimeMs: 4500, currentStreak: 0 });
    assert.equal(result.speedBonus, 50);
    assert.equal(result.pointsAwarded, 160); // 100 + 50 + 10
  });

  it('should award +30 speed bonus for answers between 10 and 20 seconds', () => {
    const result = calculateScore({ isCorrect: true, responseTimeMs: 14200, currentStreak: 0 });
    assert.equal(result.speedBonus, 30);
    assert.equal(result.pointsAwarded, 140);
  });

  it('should award +15 speed bonus for answers between 20 and 30 seconds', () => {
    const result = calculateScore({ isCorrect: true, responseTimeMs: 25000, currentStreak: 0 });
    assert.equal(result.speedBonus, 15);
    assert.equal(result.pointsAwarded, 125);
  });

  it('should cap streak bonus at 100 points for streaks >= 10', () => {
    const result = calculateScore({ isCorrect: true, responseTimeMs: 40000, currentStreak: 12 });
    assert.equal(result.newStreak, 13);
    assert.equal(result.streakBonus, 100);
    assert.equal(result.pointsAwarded, 200); // 100 base + 0 speed + 100 streak cap
  });

  it('should award 0 points and reset streak to 0 on incorrect answer', () => {
    const result = calculateScore({ isCorrect: false, responseTimeMs: 5000, currentStreak: 8 });
    assert.equal(result.pointsAwarded, 0);
    assert.equal(result.speedBonus, 0);
    assert.equal(result.streakBonus, 0);
    assert.equal(result.newStreak, 0);
  });
});
