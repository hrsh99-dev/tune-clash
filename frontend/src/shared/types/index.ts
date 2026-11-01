export type RoomStatus = 'lobby' | 'in_progress' | 'finished' | 'closed';

export type GameSessionStatus = 'created' | 'in_progress' | 'finished' | 'cancelled';

export type RoundStatus = 'preparing' | 'playing' | 'revealing' | 'finished' | 'cancelled';

export type ChaosModifier = 'Double Points' | 'Lightning' | 'Comeback Boost' | 'Sudden Death' | 'None';

export type TrackStatus = 'draft' | 'pending_review' | 'approved' | 'disabled';

export type TrackSourceType = 'synthetic_demo' | 'direct_upload' | 'licensed_provider';

export type LicenseReviewStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface RoomSettings {
  languages: string[];
  categories: string[];
  eras: string[];
  genres: string[];
  difficultyMode: number | 'all'; // 1-5 or 'all'
  roundCount: number; // 3 to 20
  chaosMode: boolean;
  clipSeconds: number; // 6 to 10
}

export interface Player {
  playerId: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  joinOrder: number;
  score: number;
  correctCount: number;
  currentStreak: number;
  longestStreak: number;
  fastestGuessMs?: number;
  lastActiveAt: number;
}

export interface PointsBreakdown {
  base: number;
  speedBonus: number;
  firstCorrectBonus: number;
  streakBonus: number;
  chaosModifierBonus: number;
  total: number;
}

export interface PlayerRoundResult {
  playerId: string;
  nickname: string;
  wasCorrect: boolean;
  attemptsCount: number;
  elapsedMs?: number;
  pointsBreakdown: PointsBreakdown;
  streakBefore: number;
  streakAfter: number;
}

export interface RevealedTrack {
  id: string;
  title: string;
  artists: string[];
  languages: string[];
  categories: string[];
  genres: string[];
  releaseYear?: number;
  era: string;
  difficulty: number;
  tags: string[];
}

export interface RoundEndedPayload {
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  revealedTrack: RevealedTrack;
  playerResults: PlayerRoundResult[];
  leaderboard: PlayerLeaderboardEntry[];
  nextRoundInMs: number;
  isLastRound: boolean;
}

export interface PlayerLeaderboardEntry {
  playerId: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  rank: number;
  correctCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface FinalGameStats {
  fastestGuess?: {
    playerId: string;
    nickname: string;
    elapsedMs: number;
    songTitle: string;
  };
  longestStreak?: {
    playerId: string;
    nickname: string;
    streak: number;
  };
  biggestComeback?: {
    playerId: string;
    nickname: string;
    initialRank: number;
    finalRank: number;
  };
  totalSongsGuessed: number;
}

export interface GameFinishedPayload {
  gameSessionId: string;
  roomCode: string;
  standings: PlayerLeaderboardEntry[];
  stats: FinalGameStats;
}
