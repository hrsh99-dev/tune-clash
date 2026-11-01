import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import {
  Room,
  GameSession,
  RoundResult,
  Track,
  AudioAsset,
  ITrack,
} from '../models/index.js';
import {
  SOCKET_EVENTS,
  isAnswerCorrect,
  checkAnswerMatch,
  generateTitleCue,
  calculateRoundScore,
  sortAndAssignRanks,
  ChaosModifier,
  PlayerRoundResult,
  PlayerLeaderboardEntry,
  FinalGameStats,
  PublicRoundPreparePayload,
  RoomSettingsSchema,
} from '../shared/index.js';
import { logger } from '../logger/index.js';

interface ActiveRound {
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  track: ITrack;
  audioUrl: string;
  modifier: ChaosModifier;
  windowMs: number;
  startAt: number;
  answerDeadlineAt: number;
  hasFirstCorrect: boolean;
  playerAttempts: Map<string, { count: number; lastTime: number; wasCorrect: boolean; elapsedMs?: number; points?: any }>;
  state: 'preparing' | 'playing' | 'revealing' | 'finished';
  hintVotes: Set<string>;
  hintRevealed: boolean;
  cue: string;
  timer?: NodeJS.Timeout;
  startTimer?: NodeJS.Timeout;
  graceTimer?: NodeJS.Timeout;
  cueTimer?: NodeJS.Timeout;
}

interface ActiveGame {
  gameSessionId: string;
  roomCode: string;
  tracks: ITrack[];
  currentRoundIndex: number;
  activeRound?: ActiveRound;
  initialStandings?: Map<string, number>; // playerId -> rank at round 1 for comeback bonus
}

export class GameManager {
  private io: Server;
  private activeGames = new Map<string, ActiveGame>(); // roomCode -> ActiveGame
  private socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Socket connected', { socketId: socket.id });

      // Ping/pong for latency and clock offset estimation
      socket.on(SOCKET_EVENTS.CLIENT_PING, (data: { timestamp: number }) => {
        socket.emit(SOCKET_EVENTS.SERVER_PONG, {
          clientTimestamp: data?.timestamp || Date.now(),
          serverTimestamp: Date.now(),
        });
      });

      // Join room via socket
      socket.on(SOCKET_EVENTS.CLIENT_ROOM_JOIN, async (data: { roomCode: string; playerId?: string; reconnectToken?: string }) => {
        await this.handleSocketJoin(socket, data);
      });

      // Toggle ready status
      socket.on(SOCKET_EVENTS.CLIENT_READY_SET, async (data: { ready: boolean }) => {
        await this.handleReadySet(socket, data?.ready);
      });

      // Update room settings (host only)
      socket.on(SOCKET_EVENTS.CLIENT_SETTINGS_UPDATE, async (settings: any) => {
        await this.handleSettingsUpdate(socket, settings);
      });

      // Start game (host only)
      socket.on(SOCKET_EVENTS.CLIENT_GAME_START, async () => {
        await this.handleGameStart(socket);
      });

      // Vote for hint
      socket.on(SOCKET_EVENTS.CLIENT_HINT_VOTE, async () => {
        await this.handleHintVote(socket);
      });

      // Submit guess
      socket.on(SOCKET_EVENTS.CLIENT_ANSWER_SUBMIT, async (data: { requestId: string; answer: string }) => {
        await this.handleAnswerSubmit(socket, data);
      });

      // Next round (host fallback)
      socket.on(SOCKET_EVENTS.CLIENT_ROUND_NEXT, async () => {
        await this.handleNextRoundTrigger(socket);
      });

      // Play again
      socket.on(SOCKET_EVENTS.CLIENT_PLAY_AGAIN, async () => {
        await this.handlePlayAgain(socket);
      });

      // Leave room
      socket.on(SOCKET_EVENTS.CLIENT_ROOM_LEAVE, async () => {
        await this.handleLeaveRoom(socket);
      });

      // Disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleSocketJoin(socket: Socket, data: { roomCode: string; playerId?: string; reconnectToken?: string; nickname?: string }) {
    const roomCode = data.roomCode?.toUpperCase();
    if (!roomCode) return;

    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    let player = room.players.find((p) => p.playerId === data.playerId);
    if (!player && data.reconnectToken) {
      const hashed = crypto.createHash('sha256').update(data.reconnectToken).digest('hex');
      player = room.players.find((p) => p.reconnectTokenHash === hashed);
    }
    if (!player && data.nickname) {
      player = room.players.find((p) => p.nickname.toLowerCase() === data.nickname?.toLowerCase());
    }

    if (!player) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'PLAYER_NOT_IN_ROOM',
        message: 'Player identity not found in this room. Please enter your nickname to join.',
      });
      return;
    }

    player.isConnected = true;
    player.socketId = socket.id;
    player.lastActiveAt = Date.now();
    await room.save();

    socket.join(roomCode);
    this.socketToPlayer.set(socket.id, { roomCode, playerId: player.playerId });

    // Cancel pending disconnect timer if reconnected
    const timerKey = `${roomCode}:${player.playerId}`;
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
      this.disconnectTimers.delete(timerKey);
    }

    this.broadcastRoomState(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER_REJOINED, { player });
    logger.info('Player joined room socket', { roomCode, playerId: player.playerId, nickname: player.nickname });
  }

  private async handleReadySet(socket: Socket, ready: boolean) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room || room.status !== 'lobby') return;

    const player = room.players.find((p) => p.playerId === session.playerId);
    if (!player || player.isHost) return; // Host is always ready

    player.isReady = Boolean(ready);
    await room.save();
    this.broadcastRoomState(room.code);
  }

  private async handleSettingsUpdate(socket: Socket, settings: any) {
    try {
      const session = this.socketToPlayer.get(socket.id);
      if (!session) return;

      const room = await Room.findOne({ code: session.roomCode });
      if (!room || (room.status !== 'lobby' && room.status !== 'finished') || room.hostPlayerId !== session.playerId) return;

      if (room.status === 'finished') {
        room.status = 'lobby';
        for (const p of room.players) {
          p.isReady = p.isHost;
          p.score = 0;
          p.correctCount = 0;
          p.currentStreak = 0;
          p.longestStreak = 0;
        }
      }

      const parseResult = RoomSettingsSchema.partial().safeParse(settings);
      if (!parseResult.success) {
        socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
          code: 'INVALID_SETTINGS',
          message: 'Invalid settings format provided.',
        });
        return;
      }

      room.settings = { ...room.settings, ...parseResult.data };
      await room.save();
      this.broadcastRoomState(room.code);
    } catch (err: any) {
      logger.error('Error updating room settings', { error: err.message });
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'SETTINGS_UPDATE_FAILED',
        message: 'Could not update settings: ' + err.message,
      });
    }
  }

  private async handleGameStart(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    logger.info('CLIENT_START_GAME received', { socketId: socket.id, session });
    if (!session) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room) {
      logger.warn('Room not found on start', { code: session.roomCode });
      return;
    }
    if (room.status !== 'lobby' && room.status !== 'finished') {
      logger.warn('Room not in lobby or finished on start', { status: room.status });
      return;
    }

    if (room.status === 'finished') {
      room.status = 'lobby';
      for (const p of room.players) {
        p.score = 0;
        p.correctCount = 0;
        p.currentStreak = 0;
        p.longestStreak = 0;
      }
    }

    if (room.hostPlayerId !== session.playerId) {
      logger.warn('Non-host attempted game start', { host: room.hostPlayerId, sender: session.playerId });
      return;
    }

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length < 2) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'NOT_ENOUGH_PLAYERS',
        message: 'At least 2 connected players are required to start the game.',
      });
      return;
    }

    const nonHostPlayers = connectedPlayers.filter((p) => !p.isHost);
    const unready = nonHostPlayers.find((p) => !p.isReady);
    if (unready) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'PLAYERS_NOT_READY',
        message: `Cannot start until all players are ready. (${unready.nickname} is not ready)`,
      });
      return;
    }

    // Query eligible tracks matching room filters (exclude synthetic demo tracks)
    const query: any = { status: 'approved', sourceType: { $ne: 'synthetic_demo' } };
    const { languages, categories, eras, difficultyMode } = room.settings;

    if (languages && languages.length > 0) {
      query.languages = { $in: languages.map((l) => new RegExp(`^${l}$`, 'i')) };
    }
    if (categories && categories.length > 0) {
      query.categories = { $in: categories.map((c) => new RegExp(`^${c}$`, 'i')) };
    }
    if (eras && eras.length > 0) {
      query.era = { $in: eras.map((e) => new RegExp(`^${e}$`, 'i')) };
    }
    if (difficultyMode && difficultyMode !== 'all') {
      query.difficulty = Number(difficultyMode);
    }

    let matchingTracks = await Track.find(query).populate('audioAssetId');

    // If filtered set is too small, fallback gracefully or report error
    if (matchingTracks.length === 0) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'NO_TRACKS_MATCH',
        message: 'No approved tracks match the selected filters. Please broaden your settings.',
      });
      return;
    }

    // Filter only tracks with ready audio asset
    matchingTracks = matchingTracks.filter((t) => (t.audioAssetId as any)?.storageKey);

    if (matchingTracks.length === 0) {
      socket.emit(SOCKET_EVENTS.SERVER_ROOM_ERROR, {
        code: 'NO_AUDIO_TRACKS',
        message: 'Matching tracks do not have audio assets ready. Please adjust room filter settings.',
      });
      return;
    }

    // Shuffle tracks
    const shuffled = [...matchingTracks].sort(() => Math.random() - 0.5);
    const roundCount = Math.min(room.settings.roundCount || 5, shuffled.length);
    const selectedTracks = shuffled.slice(0, roundCount);

    // Create GameSession
    const gameSession = await GameSession.create({
      roomCode: room.code,
      hostPlayerId: room.hostPlayerId,
      status: 'in_progress',
      settingsSnapshot: room.settings,
      playerSnapshots: room.players.map((p) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        joinOrder: p.joinOrder,
        finalScore: 0,
        correctCount: 0,
        rank: 1,
      })),
      startedAt: new Date(),
    });

    room.status = 'in_progress';
    room.activeGameSessionId = gameSession._id as any;
    // Reset scores for all players
    for (const p of room.players) {
      p.score = 0;
      p.correctCount = 0;
      p.currentStreak = 0;
      p.longestStreak = 0;
      p.fastestGuessMs = undefined;
    }
    await room.save();
    this.broadcastRoomState(room.code);

    const activeGame: ActiveGame = {
      gameSessionId: gameSession._id.toString(),
      roomCode: room.code,
      tracks: selectedTracks,
      currentRoundIndex: 0,
      initialStandings: new Map(),
    };
    this.activeGames.set(room.code, activeGame);

    this.io.to(room.code).emit(SOCKET_EVENTS.SERVER_GAME_STARTED, {
      gameSessionId: gameSession._id.toString(),
      settings: room.settings,
      totalRounds: selectedTracks.length,
    });

    logger.info('Game started', { roomCode: room.code, rounds: selectedTracks.length });

    // Begin Round 1
    await this.startRound(room.code);
  }

  private async startRound(roomCode: string) {
    const activeGame = this.activeGames.get(roomCode);
    if (!activeGame) return;

    const roundNumber = activeGame.currentRoundIndex + 1;
    const totalRounds = activeGame.tracks.length;
    const track = activeGame.tracks[activeGame.currentRoundIndex];
    if (!track) {
      await this.finishGame(roomCode);
      return;
    }

    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    // Pick modifier if chaos mode enabled
    let modifier: ChaosModifier = 'None';
    if (room.settings.chaosMode) {
      if (roundNumber === totalRounds) {
        modifier = 'Sudden Death';
      } else {
        const pool: ChaosModifier[] = ['Double Points', 'Lightning', 'Comeback Boost', 'None'];
        modifier = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    // 20-second input time for guessing and voting
    const windowMs = modifier === 'Lightning' ? 12000 : 20000;
    const startAt = Date.now() + 2000; // 2 seconds future sync
    const answerDeadlineAt = startAt + windowMs;
    const roundId = `rnd_${crypto.randomBytes(6).toString('hex')}`;

    const audioAsset = track.audioAssetId as any;
    const audioUrl = `/api/assets/audio/${audioAsset.storageKey}`;
    const cue = generateTitleCue(track.title);

    const connectedCount = Math.max(1, room.players.filter((p) => p.isConnected).length);

    const activeRound: ActiveRound = {
      roundId,
      roundNumber,
      totalRounds,
      track,
      audioUrl,
      modifier,
      windowMs,
      startAt,
      answerDeadlineAt,
      hasFirstCorrect: false,
      playerAttempts: new Map(),
      state: 'preparing',
      hintVotes: new Set<string>(),
      hintRevealed: false,
      cue,
    };
    activeGame.activeRound = activeRound;

    // Public round payload: NO canonical title, NO artist, NO alias, NO answer!
    const publicPrepare: PublicRoundPreparePayload = {
      roundId,
      roundNumber,
      totalRounds,
      audioUrl,
      clipDurationMs: (room.settings.clipSeconds || 8) * 1000,
      startAt,
      answerDeadlineAt,
      filtersSummary: {
        category: track.categories?.[0],
        language: track.languages?.[0],
        era: track.era,
        difficulty: track.difficulty,
      },
      modifier,
      hintVoteStatus: {
        votesCount: 0,
        requiredVotes: connectedCount,
        hintRevealed: false,
      },
    };

    this.io.to(roomCode).emit(SOCKET_EVENTS.SERVER_ROUND_PREPARE, publicPrepare);

    // Schedule transition to 'playing' at startAt
    activeRound.startTimer = setTimeout(() => {
      if (activeRound.state === 'preparing') {
        activeRound.state = 'playing';
        this.io.to(roomCode).emit(SOCKET_EVENTS.SERVER_ROUND_PLAY, {
          roundId,
          startAt: activeRound.startAt,
        });
      }
    }, Math.max(0, startAt - Date.now()));

    // Schedule round deadline
    activeRound.timer = setTimeout(async () => {
      await this.endRound(roomCode);
    }, Math.max(0, answerDeadlineAt - Date.now()));

    logger.info('Round prepared', { roomCode, roundNumber, totalRounds, modifier });
  }

  private async handleHintVote(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const activeGame = this.activeGames.get(session.roomCode);
    if (!activeGame || !activeGame.activeRound) return;

    const round = activeGame.activeRound;
    if (round.state !== 'playing' || round.hintRevealed) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room) return;

    round.hintVotes.add(session.playerId);

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const requiredVotes = Math.max(1, connectedPlayers.length);

    const hintRevealed = round.hintVotes.size >= requiredVotes;

    if (hintRevealed) {
      round.hintRevealed = true;
      this.io.to(session.roomCode).emit(SOCKET_EVENTS.SERVER_ROUND_CUE, {
        roundId: round.roundId,
        cue: round.cue,
      });
      logger.info('All players voted for hint! Title cue revealed.', {
        roomCode: session.roomCode,
        cue: round.cue,
      });
    }

    this.io.to(session.roomCode).emit(SOCKET_EVENTS.SERVER_HINT_VOTE_UPDATE, {
      roundId: round.roundId,
      votesCount: round.hintVotes.size,
      requiredVotes,
      votedPlayerIds: Array.from(round.hintVotes),
      hintRevealed: round.hintRevealed,
      cue: round.hintRevealed ? round.cue : undefined,
    });
  }

  private async handleAnswerSubmit(socket: Socket, data: { requestId: string; answer: string }) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const activeGame = this.activeGames.get(session.roomCode);
    if (!activeGame || !activeGame.activeRound) return;

    const round = activeGame.activeRound;
    if (round.state !== 'playing' || Date.now() >= round.answerDeadlineAt) {
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data?.requestId,
        wasCorrect: false,
        message: 'Round is not accepting answers.',
        attemptsLeft: 0,
      });
      return;
    }

    const playerId = session.playerId;
    const now = Date.now();

    // Player attempt tracker
    let attemptRecord = round.playerAttempts.get(playerId);
    if (!attemptRecord) {
      attemptRecord = { count: 0, lastTime: 0, wasCorrect: false };
      round.playerAttempts.set(playerId, attemptRecord);
    }

    // If already correct
    if (attemptRecord.wasCorrect) {
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data?.requestId,
        wasCorrect: true,
        message: 'Already correctly answered!',
        attemptsLeft: 0,
      });
      return;
    }

    // Cooldown check (700ms)
    if (now - attemptRecord.lastTime < 700) {
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data?.requestId,
        wasCorrect: false,
        message: 'Too fast! Please wait a moment between guesses.',
        attemptsLeft: Math.max(0, 3 - attemptRecord.count),
      });
      return;
    }

    // Attempt limit check (max 3)
    if (attemptRecord.count >= 3) {
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data?.requestId,
        wasCorrect: false,
        message: 'No attempts remaining for this round.',
        attemptsLeft: 0,
      });
      return;
    }

    attemptRecord.count++;
    attemptRecord.lastTime = now;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room) return;
    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) return;

    // Check correctness and proximity
    const match = checkAnswerMatch(data?.answer || '', round.track.title, round.track.acceptedAnswers);
    const correct = match.isCorrect;

    if (correct) {
      attemptRecord.wasCorrect = true;
      const elapsedMs = Math.max(0, now - round.startAt);
      attemptRecord.elapsedMs = elapsedMs;

      const isFirst = !round.hasFirstCorrect;
      if (isFirst) {
        round.hasFirstCorrect = true;
      }

      // Check if player was in bottom half before this round for Comeback Boost
      const sortedByScore = [...room.players].sort((a, b) => b.score - a.score);
      const playerIndex = sortedByScore.findIndex((p) => p.playerId === playerId);
      const isBottomHalf = playerIndex >= Math.floor(sortedByScore.length / 2);

      const scoreResult = calculateRoundScore({
        wasCorrect: true,
        elapsedMs,
        windowMs: round.windowMs,
        isFirstCorrect: isFirst,
        streakBefore: player.currentStreak,
        isBottomHalf,
        modifier: round.modifier,
      });

      attemptRecord.points = scoreResult.pointsBreakdown;

      // Update player stats
      player.score += scoreResult.pointsBreakdown.total;
      player.correctCount++;
      player.currentStreak = scoreResult.streakAfter;
      player.longestStreak = Math.max(player.longestStreak, scoreResult.streakAfter);
      if (!player.fastestGuessMs || elapsedMs < player.fastestGuessMs) {
        player.fastestGuessMs = elapsedMs;
      }
      await room.save();
      this.broadcastRoomState(session.roomCode);

      // Emit private feedback to submitter
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data.requestId,
        wasCorrect: true,
        isClose: false,
        message: isFirst ? 'First to guess correctly! 🎉' : 'Correct!',
        attemptsLeft: 3 - attemptRecord.count,
        pointsEarned: scoreResult.pointsBreakdown.total,
      });

      // Broadcast public progress to everyone (NO answer text)
      this.io.to(session.roomCode).emit(SOCKET_EVENTS.SERVER_PLAYER_PROGRESS, {
        playerId,
        nickname: player.nickname,
        hasGuessed: true,
        wasCorrect: true,
      });

      // Check if all connected players have guessed correctly
      const activeConnectedPlayers = room.players.filter((p) => p.isConnected);
      const allCorrect = activeConnectedPlayers.every((p) => round.playerAttempts.get(p.playerId)?.wasCorrect);

      if (allCorrect && !round.graceTimer) {
        logger.info('All players guessed correctly! Ending round in 1s grace period', { roomCode: session.roomCode });
        round.graceTimer = setTimeout(async () => {
          await this.endRound(session.roomCode);
        }, 1000);
      }
    } else {
      // Incorrect answer: check if player is close enough
      const isClose = match.isClose;
      socket.emit(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, {
        requestId: data?.requestId,
        wasCorrect: false,
        isClose,
        message: isClose
          ? "🔥 You're so close! Check your spelling..."
          : attemptRecord.count >= 3
          ? 'Out of attempts for this round!'
          : 'Not quite...',
        attemptsLeft: 3 - attemptRecord.count,
      });

      this.io.to(session.roomCode).emit(SOCKET_EVENTS.SERVER_PLAYER_PROGRESS, {
        playerId,
        nickname: player.nickname,
        hasGuessed: true,
        wasCorrect: false,
      });
    }
  }

  private async endRound(roomCode: string) {
    const activeGame = this.activeGames.get(roomCode);
    if (!activeGame || !activeGame.activeRound) return;

    const round = activeGame.activeRound;
    if (round.state === 'revealing' || round.state === 'finished') return;

    round.state = 'revealing';
    if (round.timer) clearTimeout(round.timer);
    if (round.startTimer) clearTimeout(round.startTimer);
    if (round.graceTimer) clearTimeout(round.graceTimer);
    if (round.cueTimer) clearTimeout(round.cueTimer);

    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    // Reset streak for players who did not get it right
    const playerResults: PlayerRoundResult[] = [];
    for (const player of room.players) {
      const attempt = round.playerAttempts.get(player.playerId);
      const wasCorrect = Boolean(attempt?.wasCorrect);
      const streakBefore = player.currentStreak;

      if (!wasCorrect) {
        player.currentStreak = 0;
      }

      playerResults.push({
        playerId: player.playerId,
        nickname: player.nickname,
        wasCorrect,
        attemptsCount: attempt?.count || 0,
        elapsedMs: attempt?.elapsedMs,
        pointsBreakdown: attempt?.points || {
          base: 0,
          speedBonus: 0,
          firstCorrectBonus: 0,
          streakBonus: 0,
          chaosModifierBonus: 0,
          total: 0,
        },
        streakBefore,
        streakAfter: player.currentStreak,
      });
    }
    await room.save();
    this.broadcastRoomState(roomCode);

    // Assign leaderboard ranks
    const rankedPlayers = sortAndAssignRanks(
      room.players.map((p) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score,
        correctCount: p.correctCount,
        currentStreak: p.currentStreak,
        longestStreak: p.longestStreak,
        totalElapsedMs: p.fastestGuessMs || 999999,
      }))
    );

    // Save RoundResult to database
    await RoundResult.create({
      gameSessionId: activeGame.gameSessionId,
      roomCode,
      roundNumber: round.roundNumber,
      trackId: round.track._id,
      modifier: round.modifier,
      status: 'finished',
      playerResults,
      endedAt: new Date(),
    });

    const isLastRound = round.roundNumber >= activeGame.tracks.length;

    // Broadcast revealed answer and round scoreboard
    this.io.to(roomCode).emit(SOCKET_EVENTS.SERVER_ROUND_ENDED, {
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      totalRounds: activeGame.tracks.length,
      revealedTrack: {
        id: round.track._id.toString(),
        title: round.track.title,
        artists: round.track.artists,
        languages: round.track.languages,
        categories: round.track.categories,
        genres: round.track.genres,
        releaseYear: round.track.releaseYear,
        era: round.track.era,
        difficulty: round.track.difficulty,
        tags: round.track.tags,
      },
      playerResults,
      leaderboard: rankedPlayers,
      nextRoundInMs: 5000,
      isLastRound,
    });

    logger.info('Round ended & revealed', { roomCode, roundNumber: round.roundNumber, song: round.track.title });

    // Auto-advance after 5s or wait for host
    setTimeout(async () => {
      if (round.state === 'revealing') {
        round.state = 'finished';
        if (isLastRound) {
          await this.finishGame(roomCode);
        } else {
          activeGame.currentRoundIndex++;
          await this.startRound(roomCode);
        }
      }
    }, 5000);
  }

  private async handleNextRoundTrigger(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room || room.hostPlayerId !== session.playerId) return;

    const activeGame = this.activeGames.get(session.roomCode);
    if (!activeGame || !activeGame.activeRound) return;

    if (activeGame.activeRound.state === 'revealing') {
      activeGame.activeRound.state = 'finished';
      if (activeGame.activeRound.roundNumber >= activeGame.tracks.length) {
        await this.finishGame(session.roomCode);
      } else {
        activeGame.currentRoundIndex++;
        await this.startRound(session.roomCode);
      }
    }
  }

  private async finishGame(roomCode: string) {
    const activeGame = this.activeGames.get(roomCode);
    if (!activeGame) return;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    const rankedStandings: PlayerLeaderboardEntry[] = sortAndAssignRanks(
      room.players.map((p) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score,
        correctCount: p.correctCount,
        currentStreak: p.currentStreak,
        longestStreak: p.longestStreak,
        totalElapsedMs: p.fastestGuessMs || 999999,
      }))
    );

    // Compute playful stats
    let fastestPlayer: any = null;
    let longestStreakPlayer: any = null;
    let totalSongsGuessed = 0;

    for (const player of room.players) {
      totalSongsGuessed += player.correctCount;
      if (player.fastestGuessMs && (!fastestPlayer || player.fastestGuessMs < fastestPlayer.elapsedMs)) {
        fastestPlayer = {
          playerId: player.playerId,
          nickname: player.nickname,
          elapsedMs: player.fastestGuessMs,
          songTitle: 'Quickest response',
        };
      }
      if (player.longestStreak > 0 && (!longestStreakPlayer || player.longestStreak > longestStreakPlayer.streak)) {
        longestStreakPlayer = {
          playerId: player.playerId,
          nickname: player.nickname,
          streak: player.longestStreak,
        };
      }
    }

    const finalStats: FinalGameStats = {
      fastestGuess: fastestPlayer || undefined,
      longestStreak: longestStreakPlayer || undefined,
      totalSongsGuessed,
    };

    // Update GameSession & Room in database
    await GameSession.findByIdAndUpdate(activeGame.gameSessionId, {
      status: 'finished',
      winnerPlayerId: rankedStandings[0]?.playerId,
      finalStandings: rankedStandings,
      finalStats,
      finishedAt: new Date(),
    });

    room.status = 'finished';
    await room.save();

    this.io.to(roomCode).emit(SOCKET_EVENTS.SERVER_GAME_FINISHED, {
      gameSessionId: activeGame.gameSessionId,
      roomCode,
      standings: rankedStandings,
      stats: finalStats,
    });

    this.activeGames.delete(roomCode);
    logger.info('Game finished', { roomCode, winner: rankedStandings[0]?.nickname });
  }

  private async handlePlayAgain(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room || room.hostPlayerId !== session.playerId) return;

    room.status = 'lobby';
    for (const p of room.players) {
      p.isReady = p.isHost;
      p.score = 0;
      p.correctCount = 0;
      p.currentStreak = 0;
      p.longestStreak = 0;
    }
    await room.save();

    this.broadcastRoomState(room.code);
    logger.info('Room returned to lobby for rematch', { roomCode: room.code });
  }

  private async handleLeaveRoom(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    const room = await Room.findOne({ code: session.roomCode });
    if (!room) return;

    room.players = room.players.filter((p) => p.playerId !== session.playerId) as any;

    if (room.players.length === 0) {
      room.status = 'closed';
      room.closedAt = new Date();
      await room.save();
      this.activeGames.delete(room.code);
      return;
    }

    // Reassign host if host left
    if (room.hostPlayerId === session.playerId) {
      const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
      if (nextHost) {
        nextHost.isHost = true;
        nextHost.isReady = true;
        room.hostPlayerId = nextHost.playerId;
        this.io.to(room.code).emit(SOCKET_EVENTS.SERVER_HOST_CHANGED, {
          newHostPlayerId: nextHost.playerId,
          newHostNickname: nextHost.nickname,
        });
      }
    }

    await room.save();
    socket.leave(room.code);
    this.socketToPlayer.delete(socket.id);
    this.broadcastRoomState(room.code);
  }

  private async handleDisconnect(socket: Socket) {
    const session = this.socketToPlayer.get(socket.id);
    if (!session) return;

    this.socketToPlayer.delete(socket.id);
    const room = await Room.findOne({ code: session.roomCode });
    if (!room) return;

    const player = room.players.find((p) => p.playerId === session.playerId);
    if (!player) return;

    player.isConnected = false;
    await room.save();

    // If host disconnected, reassign to earliest connected player
    if (player.isHost) {
      const nextHost = room.players.find((p) => p.isConnected && p.playerId !== player.playerId);
      if (nextHost) {
        player.isHost = false;
        nextHost.isHost = true;
        nextHost.isReady = true;
        room.hostPlayerId = nextHost.playerId;
        await room.save();
        this.io.to(room.code).emit(SOCKET_EVENTS.SERVER_HOST_CHANGED, {
          newHostPlayerId: nextHost.playerId,
          newHostNickname: nextHost.nickname,
        });
      }
    }

    this.broadcastRoomState(room.code);

    // 30-second disconnect grace window before permanent cleanup
    const timerKey = `${room.code}:${player.playerId}`;
    const timer = setTimeout(async () => {
      this.disconnectTimers.delete(timerKey);
      try {
        const r = await Room.findOne({ code: session.roomCode });
        if (!r) return;
        const p = r.players.find((pl) => pl.playerId === session.playerId);
        if (p && !p.isConnected && r.status === 'lobby') {
          await Room.updateOne(
            { code: session.roomCode },
            { $pull: { players: { playerId: session.playerId } } }
          );
          await this.broadcastRoomState(session.roomCode);
        }
      } catch (err: any) {
        logger.error('Error during disconnect cleanup timer', { error: err?.message });
      }
    }, 30000);

    this.disconnectTimers.set(timerKey, timer);
  }

  private async broadcastRoomState(roomCode: string) {
    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    const publicPlayers = room.players.map((p) => ({
      playerId: p.playerId,
      nickname: p.nickname,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      joinOrder: p.joinOrder,
      score: p.score,
      correctCount: p.correctCount,
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      lastActiveAt: p.lastActiveAt,
    }));

    this.io.to(roomCode).emit(SOCKET_EVENTS.SERVER_ROOM_STATE, {
      roomCode: room.code,
      status: room.status,
      hostPlayerId: room.hostPlayerId,
      players: publicPlayers,
      settings: room.settings,
    });
  }
}
