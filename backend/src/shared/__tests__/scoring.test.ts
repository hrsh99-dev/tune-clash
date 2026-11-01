import { describe, it, expect } from 'vitest';
import { calculateRoundScore, sortAndAssignRanks } from '../scoring/index.js';

describe('calculateRoundScore', () => {
  const windowMs = 12000;

  it('awards zero points and resets streak on incorrect answer', () => {
    const result = calculateRoundScore({
      wasCorrect: false,
      elapsedMs: 2000,
      windowMs,
      isFirstCorrect: false,
      streakBefore: 3,
      isBottomHalf: false,
    });

    expect(result.pointsBreakdown.total).toBe(0);
    expect(result.streakAfter).toBe(0);
  });

  it('calculates full points at the very beginning of window for first correct with streak', () => {
    const result = calculateRoundScore({
      wasCorrect: true,
      elapsedMs: 0,
      windowMs,
      isFirstCorrect: true,
      streakBefore: 3,
      isBottomHalf: false,
    });

    // 500 base + 500 speed + 250 first-correct + 300 streak cap = 1550
    expect(result.pointsBreakdown.base).toBe(500);
    expect(result.pointsBreakdown.speedBonus).toBe(500);
    expect(result.pointsBreakdown.firstCorrectBonus).toBe(250);
    expect(result.pointsBreakdown.streakBonus).toBe(300);
    expect(result.pointsBreakdown.total).toBe(1550);
    expect(result.streakAfter).toBe(4);
  });

  it('calculates half speed bonus at midpoint of answer window', () => {
    const result = calculateRoundScore({
      wasCorrect: true,
      elapsedMs: 6000,
      windowMs: 12000,
      isFirstCorrect: false,
      streakBefore: 0,
      isBottomHalf: false,
    });

    // 500 base + 250 speed + 0 first + 0 streak = 750
    expect(result.pointsBreakdown.base).toBe(500);
    expect(result.pointsBreakdown.speedBonus).toBe(250);
    expect(result.pointsBreakdown.firstCorrectBonus).toBe(0);
    expect(result.pointsBreakdown.streakBonus).toBe(0);
    expect(result.pointsBreakdown.total).toBe(750);
    expect(result.streakAfter).toBe(1);
  });

  it('applies Double Points chaos modifier to entire round score', () => {
    const result = calculateRoundScore({
      wasCorrect: true,
      elapsedMs: 6000,
      windowMs: 12000,
      isFirstCorrect: false,
      streakBefore: 0,
      isBottomHalf: false,
      modifier: 'Double Points',
    });

    // 750 * 2 = 1500
    expect(result.pointsBreakdown.total).toBe(1500);
  });

  it('applies Comeback Boost modifier for bottom-half players', () => {
    const result = calculateRoundScore({
      wasCorrect: true,
      elapsedMs: 6000,
      windowMs: 12000,
      isFirstCorrect: false,
      streakBefore: 0,
      isBottomHalf: true,
      modifier: 'Comeback Boost',
    });

    // 750 + 150 = 900
    expect(result.pointsBreakdown.total).toBe(900);
  });

  it('applies Sudden Death rules: 500 first-correct bonus and no streak bonus', () => {
    const result = calculateRoundScore({
      wasCorrect: true,
      elapsedMs: 0,
      windowMs: 12000,
      isFirstCorrect: true,
      streakBefore: 5,
      isBottomHalf: false,
      modifier: 'Sudden Death',
    });

    // 500 base + 500 speed + 500 first-correct + 0 streak = 1500
    expect(result.pointsBreakdown.firstCorrectBonus).toBe(500);
    expect(result.pointsBreakdown.streakBonus).toBe(0);
    expect(result.pointsBreakdown.total).toBe(1500);
  });
});

describe('sortAndAssignRanks', () => {
  it('correctly ranks players by score descending', () => {
    const players = [
      { playerId: 'p1', score: 1000, correctCount: 2, totalElapsedMs: 4000 },
      { playerId: 'p2', score: 1500, correctCount: 2, totalElapsedMs: 3000 },
      { playerId: 'p3', score: 800, correctCount: 1, totalElapsedMs: 2000 },
    ];

    const ranked = sortAndAssignRanks(players);
    expect(ranked[0].playerId).toBe('p2');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].playerId).toBe('p1');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].playerId).toBe('p3');
    expect(ranked[2].rank).toBe(3);
  });

  it('breaks score ties using correctCount and then elapsed time', () => {
    const players = [
      { playerId: 'p1', score: 1000, correctCount: 1, totalElapsedMs: 3000 },
      { playerId: 'p2', score: 1000, correctCount: 2, totalElapsedMs: 5000 },
      { playerId: 'p3', score: 1000, correctCount: 1, totalElapsedMs: 2000 },
    ];

    const ranked = sortAndAssignRanks(players);
    // p2 has higher correctCount (2) -> Rank 1
    expect(ranked[0].playerId).toBe('p2');
    expect(ranked[0].rank).toBe(1);

    // p3 and p1 both have correctCount (1), but p3 was faster (2000ms vs 3000ms) -> Rank 2
    expect(ranked[1].playerId).toBe('p3');
    expect(ranked[1].rank).toBe(2);

    expect(ranked[2].playerId).toBe('p1');
    expect(ranked[2].rank).toBe(3);
  });

  it('shares rank when all tie-breaker values are identical', () => {
    const players = [
      { playerId: 'p1', score: 1000, correctCount: 1, totalElapsedMs: 3000 },
      { playerId: 'p2', score: 1000, correctCount: 1, totalElapsedMs: 3000 },
      { playerId: 'p3', score: 500, correctCount: 1, totalElapsedMs: 1000 },
    ];

    const ranked = sortAndAssignRanks(players);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
  });
});
