import {
  Player,
  RoomSettings,
  RoundEndedPayload,
  GameFinishedPayload,
  PlayerLeaderboardEntry,
  ChaosModifier,
  RoomStatus,
} from '../types';

export const SOCKET_EVENTS = {
  // Client -> Server
  CLIENT_ROOM_JOIN: 'room:join',
  CLIENT_READY_SET: 'room:ready:set',
  CLIENT_SETTINGS_UPDATE: 'room:settings:update',
  CLIENT_GAME_START: 'game:start',
  CLIENT_ANSWER_SUBMIT: 'round:answer:submit',
  CLIENT_AUDIO_READY: 'round:audio:ready',
  CLIENT_ROUND_NEXT: 'round:next',
  CLIENT_PLAY_AGAIN: 'game:playAgain',
  CLIENT_ROOM_LEAVE: 'room:leave',
  CLIENT_PING: 'connection:ping',
  CLIENT_HINT_VOTE: 'round:hint:vote',

  // Server -> Client
  SERVER_ROOM_STATE: 'room:state',
  SERVER_PLAYER_JOINED: 'room:playerJoined',
  SERVER_PLAYER_LEFT: 'room:playerLeft',
  SERVER_HOST_CHANGED: 'room:hostChanged',
  SERVER_ROOM_ERROR: 'room:error',
  SERVER_GAME_STARTED: 'game:started',
  SERVER_ROUND_PREPARE: 'round:prepare',
  SERVER_ROUND_PLAY: 'round:play',
  SERVER_ANSWER_FEEDBACK: 'round:answer:feedback',
  SERVER_ROUND_CUE: 'round:cue',
  SERVER_HINT_VOTE_UPDATE: 'round:hint:voteUpdate',
  SERVER_PLAYER_PROGRESS: 'round:playerProgress',
  SERVER_ROUND_ENDED: 'round:ended',
  SERVER_LEADERBOARD_UPDATE: 'leaderboard:update',
  SERVER_GAME_FINISHED: 'game:finished',
  SERVER_GAME_CANCELLED: 'game:cancelled',
  SERVER_PONG: 'connection:pong',
  SERVER_REJOINED: 'connection:rejoined',
} as const;

export interface HintVoteUpdatePayload {
  roundId: string;
  votesCount: number;
  requiredVotes: number;
  votedPlayerIds: string[];
  hintRevealed: boolean;
  cue?: string;
}

export interface PublicRoundPreparePayload {
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  audioUrl: string;
  clipDurationMs: number;
  startAt: number;
  answerDeadlineAt: number;
  filtersSummary: {
    category?: string;
    language?: string;
    era?: string;
    difficulty?: number;
  };
  modifier: ChaosModifier;
  hintVoteStatus?: {
    votesCount: number;
    requiredVotes: number;
    hintRevealed: boolean;
  };
}

export interface AnswerFeedbackPayload {
  requestId: string;
  wasCorrect: boolean;
  isClose?: boolean;
  message: string;
  attemptsLeft: number;
  pointsEarned?: number;
}

export interface PlayerProgressPayload {
  playerId: string;
  nickname: string;
  hasGuessed: boolean;
  wasCorrect: boolean;
}

export interface PublicRoomState {
  roomCode: string;
  status: RoomStatus;
  hostPlayerId: string;
  players: Player[];
  settings: RoomSettings;
}
