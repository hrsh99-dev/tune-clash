import { ChaosModifier, PointsBreakdown, PlayerLeaderboardEntry } from '../types/index.js';

export interface ScoreCalculationParams {
  wasCorrect: boolean;
  elapsedMs: number;
  windowMs: number;
  isFirstCorrect: boolean;
  streakBefore: number;
  isBottomHalf: boolean;
  modifier?: ChaosModifier;
}

export function calculateRoundScore(params: ScoreCalculationParams): {
  pointsBreakdown: PointsBreakdown;
  streakAfter: number;
} {
  const {
    wasCorrect,
    elapsedMs,
    windowMs,
    isFirstCorrect,
    streakBefore,
    isBottomHalf,
    modifier = 'None',
  } = params;

  if (!wasCorrect) {
    return {
      pointsBreakdown: {
        base: 0,
        speedBonus: 0,
        firstCorrectBonus: 0,
        streakBonus: 0,
        chaosModifierBonus: 0,
        total: 0,
      },
      streakAfter: 0, // Wrong answer resets streak
    };
  }

  const streakAfter = streakBefore + 1;
  const base = 500;

  // Speed bonus: 0 to 500, linearly decreasing with elapsed time
  const clampedElapsed = Math.max(0, Math.min(elapsedMs, windowMs));
  const speedBonus = Math.max(0, Math.round(500 * (1 - clampedElapsed / windowMs)));

  // First correct bonus: 250 normal, or 500 in Sudden Death
  let firstCorrectBonus = 0;
  if (isFirstCorrect) {
    firstCorrectBonus = modifier === 'Sudden Death' ? 500 : 250;
  }

  // Streak bonus: +100 for each consecutive prior round, capped at 300.
  // In Sudden Death, no streak bonus.
  let streakBonus = 0;
  if (modifier !== 'Sudden Death' && streakBefore > 0) {
    streakBonus = Math.min(300, streakBefore * 100);
  }

  // Chaos modifier bonuses
  let chaosModifierBonus = 0;
  if (modifier === 'Comeback Boost' && isBottomHalf) {
    chaosModifierBonus += 150;
  }

  let subtotal = base + speedBonus + firstCorrectBonus + streakBonus + chaosModifierBonus;

  // Double Points modifier doubles round's earned points
  if (modifier === 'Double Points') {
    chaosModifierBonus += subtotal; // adds equivalent subtotal to reach 2x
    subtotal *= 2;
  }

  return {
    pointsBreakdown: {
      base,
      speedBonus,
      firstCorrectBonus,
      streakBonus,
      chaosModifierBonus,
      total: subtotal,
    },
    streakAfter,
  };
}

export interface PlayerRankCandidate {
  playerId: string;
  score: number;
  correctCount: number;
  totalElapsedMs: number;
  [key: string]: any;
}

/**
 * Stable tie-breaker sorting:
 * 1. total score descending
 * 2. correct answers count descending
 * 3. cumulative elapsed time for correct answers ascending
 * Shares rank if completely tied.
 */
export function sortAndAssignRanks<T extends PlayerRankCandidate>(
  players: T[]
): (T & { rank: number })[] {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.totalElapsedMs - b.totalElapsedMs;
  });

  let currentRank = 1;
  return sorted.map((player, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      const isTied =
        prev.score === player.score &&
        prev.correctCount === player.correctCount &&
        prev.totalElapsedMs === player.totalElapsedMs;

      if (!isTied) {
        currentRank = index + 1;
      }
    }

    return {
      ...player,
      rank: currentRank,
    };
  });
}
