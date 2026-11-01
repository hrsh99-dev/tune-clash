'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Leaderboard } from '@/components/Leaderboard';
import { RoundCountdown } from '@/components/RoundCountdown';
import { AnswerInput } from '@/components/AnswerInput';
import { RevealCard } from '@/components/RevealCard';
import { PodiumResults } from '@/components/PodiumResults';
import { RoomFilterSettings, TrackSummary } from '@/components/RoomFilterSettings';
import {
  SOCKET_EVENTS,
  Player,
  RoomSettings,
  PublicRoundPreparePayload,
  RoundEndedPayload,
  GameFinishedPayload,
  PlayerLeaderboardEntry,
  PlayerProgressPayload,
} from '@/shared';
import {
  Users,
  Copy,
  Check,
  Crown,
  Play,
  Flame,
  Zap,
  ArrowLeft,
  Settings,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { getApiBase, getSocketUrl } from '@/lib/apiConfig';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string)?.toUpperCase();

  const socketRef = useRef<Socket | null>(null);

  // User Identity State
  const [playerId, setPlayerId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Missing Nickname modal (if direct link navigation)
  const [isNicknamePromptOpen, setIsNicknamePromptOpen] = useState(false);
  const [promptNickname, setPromptNickname] = useState('');
  const [promptError, setPromptError] = useState('');

  // Room & Game State
  const [roomStatus, setRoomStatus] = useState<'lobby' | 'in_progress' | 'finished' | 'closed'>('lobby');
  const [hostPlayerId, setHostPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [accumulatedLeaderboard, setAccumulatedLeaderboard] = useState<PlayerLeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<RoomSettings>({
    languages: [],
    categories: [],
    eras: [],
    genres: [],
    difficultyMode: 'all',
    roundCount: 5,
    chaosMode: false,
    clipSeconds: 8,
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [notification, setNotification] = useState<string>('');

  // Active Round State
  const [roundPrepare, setRoundPrepare] = useState<PublicRoundPreparePayload | null>(null);
  const [isRoundPlaying, setIsRoundPlaying] = useState<boolean>(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [roundCue, setRoundCue] = useState<string>('');
  const [hintVoteStatus, setHintVoteStatus] = useState<{ votesCount: number; requiredVotes: number; hintRevealed: boolean }>({
    votesCount: 0,
    requiredVotes: 1,
    hintRevealed: false,
  });
  const [hasVotedForHint, setHasVotedForHint] = useState<boolean>(false);
  const [myAnswerFeedback, setMyAnswerFeedback] = useState<{ isCorrect: boolean; isClose?: boolean; message: string } | null>(null);
  const [playerProgressList, setPlayerProgressList] = useState<PlayerProgressPayload[]>([]);

  // Reveal & Finish State
  const [roundEndedData, setRoundEndedData] = useState<RoundEndedPayload | null>(null);
  const [gameFinishedData, setGameFinishedData] = useState<GameFinishedPayload | null>(null);

  // Catalog filters available
  const [availableFilters, setAvailableFilters] = useState<{
    languages: string[];
    categories: string[];
    eras: string[];
  }>({ languages: [], categories: [], eras: [] });
  const [trackSummaries, setTrackSummaries] = useState<TrackSummary[]>([]);

  // 1. Initial local identity check & socket initialization
  useEffect(() => {
    if (!roomCode) return;

    // Fetch catalog filters for host settings panel
    fetch(`${getApiBase()}/api/catalog/filters`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setAvailableFilters({
            languages: data.languages || [],
            categories: data.categories || [],
            eras: data.eras || [],
          });
          if (data.trackSummaries) {
            setTrackSummaries(data.trackSummaries);
          }
        }
      })
      .catch(() => {});

    const storedRoomCode = sessionStorage.getItem('tune_clash_roomCode');
    const storedPlayerId = sessionStorage.getItem('tune_clash_playerId');
    const storedNickname = sessionStorage.getItem('tune_clash_nickname');
    const storedToken = sessionStorage.getItem('tune_clash_token');

    if (!storedPlayerId || !storedNickname || storedRoomCode !== roomCode) {
      setIsNicknamePromptOpen(true);
      return;
    }

    setPlayerId(storedPlayerId);
    setNickname(storedNickname);

    initSocket(storedPlayerId, storedNickname, storedToken || undefined);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomCode]);

  const initSocket = (pId: string, nick: string, token?: string) => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
        roomCode,
        playerId: pId,
        nickname: nick,
        reconnectToken: token,
      });
    });

    socket.on(SOCKET_EVENTS.SERVER_ROOM_STATE, (data: any) => {
      setRoomStatus(data.status);
      setHostPlayerId(data.hostPlayerId);
      const newPlayers = data.players || [];
      setPlayers(newPlayers);
      if (data.settings) setSettings(data.settings);
      if (data.status === 'lobby') {
        setGameFinishedData(null);
        setRoundEndedData(null);
        setRoundPrepare(null);
        setIsRoundPlaying(false);
      }

      // Keep accumulated leaderboard in sync with current player scores
      const sortedEntries: PlayerLeaderboardEntry[] = newPlayers.map((p: Player, idx: number) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score || 0,
        rank: idx + 1,
        correctCount: p.correctCount || 0,
        currentStreak: p.currentStreak || 0,
        longestStreak: p.longestStreak || 0,
      }));
      sortedEntries.sort((a, b) => b.score - a.score);
      sortedEntries.forEach((entry, i) => {
        entry.rank = i + 1;
      });
      setAccumulatedLeaderboard(sortedEntries);
    });

    socket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err: { code: string; message: string }) => {
      if (err.code === 'PLAYER_NOT_IN_ROOM') {
        sessionStorage.removeItem('tune_clash_playerId');
        sessionStorage.removeItem('tune_clash_nickname');
        sessionStorage.removeItem('tune_clash_token');
        setIsNicknamePromptOpen(true);
      }
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 6000);
    });

    socket.on(SOCKET_EVENTS.SERVER_HOST_CHANGED, (data: { newHostNickname: string }) => {
      setNotification(`Crown passed to ${data.newHostNickname}!`);
      setTimeout(() => setNotification(''), 4000);
    });

    socket.on(SOCKET_EVENTS.SERVER_GAME_STARTED, () => {
      setRoomStatus('in_progress');
      setGameFinishedData(null);
      setRoundEndedData(null);
      setAccumulatedLeaderboard((prev) =>
        prev.map((e, idx) => ({ ...e, score: 0, correctCount: 0, currentStreak: 0, rank: idx + 1 }))
      );
    });

    socket.on(SOCKET_EVENTS.SERVER_ROUND_PREPARE, (payload: PublicRoundPreparePayload) => {
      setRoundEndedData(null);
      setRoundPrepare(payload);
      setIsRoundPlaying(false);
      setRoundCue('');
      setAttemptsLeft(3);
      setMyAnswerFeedback(null);
      setPlayerProgressList([]);
      setHintVoteStatus(payload.hintVoteStatus || { votesCount: 0, requiredVotes: 1, hintRevealed: false });
      setHasVotedForHint(false);
    });

    socket.on(SOCKET_EVENTS.SERVER_ROUND_PLAY, () => {
      setIsRoundPlaying(true);
    });

    socket.on(SOCKET_EVENTS.SERVER_ROUND_CUE, (data: { cue: string }) => {
      setRoundCue(data.cue);
      setHintVoteStatus((prev) => ({ ...prev, hintRevealed: true }));
    });

    socket.on(SOCKET_EVENTS.SERVER_HINT_VOTE_UPDATE, (data: any) => {
      setHintVoteStatus({
        votesCount: data.votesCount,
        requiredVotes: data.requiredVotes,
        hintRevealed: data.hintRevealed,
      });
      if (data.votedPlayerIds && data.votedPlayerIds.includes(pId)) {
        setHasVotedForHint(true);
      }
      if (data.hintRevealed && data.cue) {
        setRoundCue(data.cue);
      }
    });

    socket.on(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, (feedback: any) => {
      setAttemptsLeft(feedback.attemptsLeft ?? 0);
      setMyAnswerFeedback({
        isCorrect: feedback.wasCorrect,
        isClose: Boolean(feedback.isClose),
        message: feedback.message,
      });
    });

    socket.on(SOCKET_EVENTS.SERVER_PLAYER_PROGRESS, (progress: PlayerProgressPayload) => {
      setPlayerProgressList((prev) => {
        const filtered = prev.filter((p) => p.playerId !== progress.playerId);
        return [...filtered, progress];
      });
    });

    socket.on(SOCKET_EVENTS.SERVER_ROUND_ENDED, (endedPayload: RoundEndedPayload) => {
      setIsRoundPlaying(false);
      setRoundEndedData(endedPayload);
      if (endedPayload.leaderboard && endedPayload.leaderboard.length > 0) {
        setAccumulatedLeaderboard(endedPayload.leaderboard);
      }
    });

    socket.on(SOCKET_EVENTS.SERVER_GAME_FINISHED, (finishedPayload: GameFinishedPayload) => {
      setIsRoundPlaying(false);
      setRoundEndedData(null);
      setRoundPrepare(null);
      setRoomStatus('finished');
      setGameFinishedData(finishedPayload);
      if (finishedPayload.standings && finishedPayload.standings.length > 0) {
        setAccumulatedLeaderboard(finishedPayload.standings);
      }
    });
  };

  const handleJoinFromPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptNickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      setPromptError('Nickname must be between 2 and 20 characters.');
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromptError(data.error?.message || 'Could not join room.');
        return;
      }

      sessionStorage.setItem('tune_clash_roomCode', roomCode);
      sessionStorage.setItem('tune_clash_playerId', data.player.playerId);
      sessionStorage.setItem('tune_clash_nickname', data.player.nickname);
      sessionStorage.setItem('tune_clash_token', data.reconnectToken);

      setPlayerId(data.player.playerId);
      setNickname(data.player.nickname);
      setIsNicknamePromptOpen(false);

      initSocket(data.player.playerId, data.player.nickname, data.reconnectToken);
    } catch (err: any) {
      setPromptError('Failed to connect to server.');
    }
  };

  // Actions
  const isHost = playerId === hostPlayerId;
  const me = players.find((p) => p.playerId === playerId);

  const toggleReady = () => {
    if (!socketRef.current || !me || isHost) return;
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_READY_SET, { ready: !me.isReady });
  };

  const updateSetting = (key: keyof RoomSettings, value: any) => {
    if (!socketRef.current || !isHost) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_SETTINGS_UPDATE, newSettings);
  };

  const handleStartGame = () => {
    if (!socketRef.current || !isHost) return;
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_GAME_START);
  };

  const handleSubmitGuess = (answerText: string) => {
    if (!socketRef.current || !isRoundPlaying) return;
    const reqId = `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_ANSWER_SUBMIT, {
      requestId: reqId,
      answer: answerText,
    });
  };

  const handleVoteHint = () => {
    if (!socketRef.current || !isRoundPlaying || hasVotedForHint || hintVoteStatus.hintRevealed) return;
    setHasVotedForHint(true);
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_HINT_VOTE);
  };

  const handleNextRound = () => {
    if (!socketRef.current || !isHost) return;
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_ROUND_NEXT);
  };

  const handlePlayAgain = () => {
    if (!socketRef.current || !isHost) return;
    socketRef.current.emit(SOCKET_EVENTS.CLIENT_PLAY_AGAIN);
    setRoomStatus('lobby');
    setGameFinishedData(null);
    setRoundEndedData(null);
  };

  const handleChangeSettings = () => {
    if (socketRef.current && isHost) {
      socketRef.current.emit(SOCKET_EVENTS.CLIENT_PLAY_AGAIN);
    }
    setRoomStatus('lobby');
    setGameFinishedData(null);
    setRoundEndedData(null);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.CLIENT_ROOM_LEAVE);
    }
    router.push('/');
  };

  // Check start readiness
  const connectedPlayers = players.filter((p) => p.isConnected);
  const allNonHostReady = connectedPlayers.filter((p) => !p.isHost).every((p) => p.isReady);
  const canStart = isHost && connectedPlayers.length >= 2 && allNonHostReady;

  // Leaderboard data mapping: Preserve scores across all rounds until game completes!
  const leaderboardEntries: PlayerLeaderboardEntry[] = (accumulatedLeaderboard.length > 0
    ? accumulatedLeaderboard
    : roundEndedData?.leaderboard ||
      players.map((p, idx) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score,
        rank: idx + 1,
        correctCount: p.correctCount,
        currentStreak: p.currentStreak,
        longestStreak: p.longestStreak,
      }))) as PlayerLeaderboardEntry[];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar onOpenHowToPlay={() => setIsHowToPlayOpen(true)} />

      {/* Notifications and Error alerts */}
      {errorMessage && (
        <div className="w-full bg-neo-pink text-white border-b-2 border-black px-4 py-2 text-center text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-1.5 shadow-neo-sm">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>{errorMessage}</span>
        </div>
      )}
      {notification && (
        <div className="w-full bg-neo-yellow text-black border-b-2 border-black px-4 py-2 text-center text-xs sm:text-sm font-black uppercase shadow-neo-sm">
          {notification}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* ROOM TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeave}
              className="p-2 rounded-xl bg-white text-black border-2 border-black hover:bg-neutral-100 shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              title="Leave Room"
              aria-label="Leave room"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                ROOM:
              </span>
              <span className="font-mono text-lg font-black tracking-widest text-black px-3 py-1 bg-neo-yellow border-2 border-black rounded-lg shadow-neo-sm">
                {roomCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-room-link-btn"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-neutral-50 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4 text-black stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
              <span>{copiedLink ? 'LINK COPIED!' : 'SHARE LINK'}</span>
            </button>
          </div>
        </div>

        {/* ----------------- STATE 1: LOBBY ----------------- */}
        {roomStatus === 'lobby' && (
          <div className="flex flex-col gap-6 w-full">
            {/* Player List */}
            <div className="w-full space-y-6">
              <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-black stroke-[2.5]" />
                    <h2 className="font-black text-base uppercase text-black">Players in Lobby</h2>
                  </div>
                  <span className="text-xs font-black uppercase bg-neo-yellow border border-black px-3 py-1 rounded-full shadow-neo-sm">
                    {players.length} / 12 PLAYERS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {players.map((p) => (
                    <div
                      key={p.playerId}
                      className={`p-3.5 rounded-xl border-2 border-black flex items-center justify-between transition-all ${
                        p.playerId === playerId
                          ? 'bg-neo-yellow-light/80 shadow-neo-sm'
                          : 'bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-9 h-9 rounded-xl bg-neo-cyan border-2 border-black flex items-center justify-center font-black text-xs text-black shrink-0 shadow-neo-sm">
                          {p.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-black text-sm text-black truncate">
                              {p.nickname}
                            </span>
                            {p.playerId === playerId && (
                              <span className="text-[10px] bg-black text-neo-yellow px-1 rounded font-black uppercase">
                                YOU
                              </span>
                            )}
                          </div>
                          {p.isHost && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-black font-black uppercase">
                              <Crown className="w-3 h-3 fill-black text-black" /> HOST
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-black shrink-0 shadow-neo-sm ${
                          p.isHost || p.isReady
                            ? 'bg-neo-green text-black'
                            : 'bg-neo-pink text-white'
                        }`}
                      >
                        {p.isHost ? 'HOST' : p.isReady ? 'READY' : 'NOT READY'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ready / Start Action Bar */}
                <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
                  {!isHost ? (
                    <button
                      id="ready-toggle-btn"
                      onClick={toggleReady}
                      className={`w-full sm:w-auto px-8 py-3 font-black text-sm uppercase rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                        me?.isReady
                          ? 'bg-white hover:bg-neutral-100 text-black'
                          : 'bg-neo-green hover:bg-[#34D399] text-black'
                      }`}
                    >
                      {me?.isReady ? 'CANCEL READY' : 'MARK READY! ✓'}
                    </button>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase text-neutral-600 text-left">
                        {players.length < 2
                          ? '⚠️ Need at least 2 players to start game.'
                          : !allNonHostReady
                          ? '⏳ Waiting for all players to mark Ready...'
                          : '⚡ All players are ready!'}
                      </div>
                      <button
                        id="start-game-btn"
                        onClick={handleStartGame}
                        disabled={!canStart}
                        className="w-full sm:w-auto px-8 py-3.5 bg-neo-yellow hover:bg-[#FFDF00] disabled:bg-neutral-200 disabled:text-neutral-400 text-black font-black uppercase text-base rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        <Play className="w-5 h-5 fill-black stroke-black" />
                        <span>START GAME ➔</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Host Settings & Music Filters Panel */}
            <div className="w-full">
              <RoomFilterSettings
                settings={settings}
                onUpdateSetting={updateSetting}
                isHost={isHost}
                availableFilters={availableFilters}
                trackSummaries={trackSummaries}
              />
            </div>
          </div>
        )}

        {/* ----------------- STATE 2: ACTIVE GAME ROUND ----------------- */}
        {roomStatus === 'in_progress' && (
          <div className="flex flex-col gap-6 w-full">
            <div className="lg:col-span-2 flex flex-col items-center">
              {/* Round Header Bar */}
              {roundPrepare && (
                <div className="w-full bg-white border-2 border-black rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-neo">
                  <div>
                    <span className="font-mono text-xs font-black uppercase tracking-wider text-black block">
                      ROUND {roundPrepare.roundNumber} OF {roundPrepare.totalRounds}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {roundPrepare.filtersSummary.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-neo-yellow border border-black shadow-neo-sm text-black">
                          {roundPrepare.filtersSummary.category}
                        </span>
                      )}
                      {roundPrepare.filtersSummary.language && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-neo-cyan border border-black shadow-neo-sm text-black">
                          {roundPrepare.filtersSummary.language}
                        </span>
                      )}
                    </div>
                  </div>

                  {roundPrepare.modifier !== 'None' && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-neo-pink text-white border-2 border-black shadow-neo-sm">
                      <Flame className="w-4 h-4 fill-current" />
                      <span>{roundPrepare.modifier}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reveal Card or Active Audio + Guessing Area */}
              {roundEndedData ? (
                <RevealCard
                  revealedTrack={roundEndedData.revealedTrack}
                  playerResults={roundEndedData.playerResults}
                  currentPlayerId={playerId}
                  isHost={isHost}
                  onNextRound={handleNextRound}
                  isLastRound={roundEndedData.isLastRound}
                />
              ) : (
                <div className="w-full bg-white border-2 border-black rounded-2xl p-6 shadow-neo flex flex-col items-center">
                  {/* Countdown Timer */}
                  {roundPrepare && isRoundPlaying && (
                    <RoundCountdown
                      startAt={roundPrepare.startAt}
                      deadlineAt={roundPrepare.answerDeadlineAt}
                    />
                  )}

                  {/* Audio Player */}
                  <AudioPlayer
                    audioUrl={roundPrepare?.audioUrl}
                    startAt={roundPrepare?.startAt}
                    isPlaying={isRoundPlaying}
                  />

                  {/* Hint Vote Bar: Only visible if hint not yet revealed and player hasn't guessed correctly */}
                  {isRoundPlaying && !roundCue && !myAnswerFeedback?.isCorrect && (
                    <div className="w-full max-w-lg mt-3 p-3.5 bg-neo-yellow-light/60 border-2 border-black rounded-xl shadow-neo-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-black flex items-center justify-center text-black shrink-0 shadow-neo-sm">
                          <Lightbulb className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black uppercase text-black">
                            Hint Votes: {hintVoteStatus.votesCount} / {hintVoteStatus.requiredVotes}
                          </p>
                          <p className="text-[11px] font-medium text-neutral-600">
                            Unlocks title letters when all players vote
                          </p>
                        </div>
                      </div>

                      <button
                        id="vote-hint-btn"
                        onClick={handleVoteHint}
                        disabled={hasVotedForHint || hintVoteStatus.hintRevealed}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 border-black flex items-center gap-1.5 transition-all shadow-neo-sm shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                          hasVotedForHint
                            ? 'bg-neo-green text-black cursor-default'
                            : 'bg-neo-yellow hover:bg-[#FFDF00] text-black'
                        }`}
                      >
                        {hasVotedForHint ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Voted</span>
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Vote for Hint</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Guessing Input */}
                  <div className="w-full mt-4">
                    <AnswerInput
                      onSubmit={handleSubmitGuess}
                      attemptsLeft={attemptsLeft}
                      isCorrect={Boolean(myAnswerFeedback?.isCorrect)}
                      isClose={Boolean(myAnswerFeedback?.isClose)}
                      feedbackMessage={myAnswerFeedback?.message}
                      titleCue={roundCue}
                      disabled={!isRoundPlaying}
                    />
                  </div>

                  {/* Player Progress Indicators */}
                  {playerProgressList.length > 0 && (
                    <div className="w-full max-w-lg mt-6 pt-4 border-t-2 border-black flex flex-wrap items-center justify-center gap-2">
                      {playerProgressList.map((progress) => (
                        <span
                          key={progress.playerId}
                          className={`text-xs px-3 py-1 rounded-full font-black uppercase border-2 border-black shadow-neo-sm ${
                            progress.wasCorrect
                              ? 'bg-neo-green text-black'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {progress.nickname}: {progress.wasCorrect ? '✓ Guessed' : 'Attempted'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Leaderboard */}
            <div>
              <Leaderboard entries={leaderboardEntries} currentPlayerId={playerId} />
            </div>
          </div>
        )}

        {/* ----------------- STATE 3: FINAL RESULTS ----------------- */}
        {roomStatus === 'finished' && gameFinishedData && (
          <PodiumResults
            standings={gameFinishedData.standings}
            stats={gameFinishedData.stats}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
            onChangeSettings={handleChangeSettings}
          />
        )}
      </main>

      {/* Nickname Prompt Dialog (Direct Link Joiners) */}
      {isNicknamePromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-neo-xl border-[3px] border-black">
            <h2 className="text-xl font-black uppercase tracking-tight text-black mb-1">Enter Room {roomCode}</h2>
            <p className="text-xs text-neutral-600 font-medium mb-4">Choose a nickname to join this party.</p>

            <form onSubmit={handleJoinFromPrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1.5">Your Nickname</label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  minLength={2}
                  value={promptNickname}
                  onChange={(e) => setPromptNickname(e.target.value)}
                  placeholder="e.g. MelodyQueen"
                  autoFocus
                  className="neo-input"
                />
              </div>

              {promptError && (
                <div className="p-2 bg-neo-pink-light border-2 border-black text-black rounded-lg text-xs font-bold">
                  ⚠️ {promptError}
                </div>
              )}

              <button
                type="submit"
                disabled={!promptNickname.trim()}
                className="w-full py-3 bg-neo-yellow hover:bg-[#FFDF00] text-black font-black uppercase text-sm rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                Join Game ➔
              </button>
            </form>
          </div>
        </div>
      )}

      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
      <Footer />
    </div>
  );
}
