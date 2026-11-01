'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Zap, Flame, RotateCcw, Sliders, CheckCircle, Crown } from 'lucide-react';
import { PlayerLeaderboardEntry, FinalGameStats } from '@/shared';

interface PodiumResultsProps {
  standings: PlayerLeaderboardEntry[];
  stats: FinalGameStats;
  isHost?: boolean;
  onPlayAgain?: () => void;
  onChangeSettings?: () => void;
}

export const PodiumResults: React.FC<PodiumResultsProps> = ({
  standings,
  stats,
  isHost,
  onPlayAgain,
  onChangeSettings,
}) => {
  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE600', '#4ADE80', '#FF6B8B', '#38BDF8', '#000000'],
      });
    }
  }, []);

  const winner = standings[0];
  const second = standings[1];
  const third = standings[2];

  return (
    <div className="w-full max-w-2xl mx-auto text-center animate-in fade-in duration-300">
      {/* Trophy Header */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neo-yellow border-2 border-black text-black mb-3 shadow-neo">
        <Trophy className="w-9 h-9 stroke-[2.5]" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-black mb-1">
        GAME FINISHED!
      </h1>
      <p className="text-black font-bold text-base mb-8">
        Congratulations <span className="bg-neo-yellow px-2 py-0.5 rounded border border-black shadow-neo-sm">👑 {winner?.nickname}</span> on claiming victory!
      </p>

      {/* Arcade Podium Display */}
      <div className="flex items-end justify-center gap-3 sm:gap-5 mb-8 px-2 sm:px-4">
        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center flex-1 max-w-[130px]">
            <span className="text-xs font-black text-black truncate w-full mb-1 uppercase">
              {second.nickname}
            </span>
            <div className="w-full h-28 bg-neo-cyan border-2 border-black rounded-t-2xl flex flex-col items-center justify-center text-black p-2 shadow-neo">
              <span className="text-3xl font-black">2</span>
              <span className="text-[11px] font-black uppercase mt-1">{second.score} PTS</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {winner && (
          <div className="flex flex-col items-center flex-1 max-w-[150px]">
            <span className="text-xs font-black text-black truncate w-full mb-1 uppercase flex items-center justify-center gap-1">
              <Crown className="w-4 h-4 fill-black text-black" /> {winner.nickname}
            </span>
            <div className="w-full h-36 bg-neo-yellow border-2 border-black rounded-t-2xl flex flex-col items-center justify-center text-black p-2 shadow-neo-lg">
              <span className="text-5xl font-black">1</span>
              <span className="text-xs font-black uppercase mt-1 bg-black text-neo-yellow px-2 py-0.5 rounded">
                {winner.score} PTS
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center flex-1 max-w-[130px]">
            <span className="text-xs font-black text-black truncate w-full mb-1 uppercase">
              {third.nickname}
            </span>
            <div className="w-full h-22 bg-neo-pink border-2 border-black rounded-t-2xl flex flex-col items-center justify-center text-white p-2 shadow-neo">
              <span className="text-2xl font-black">3</span>
              <span className="text-[11px] font-black uppercase mt-1 text-black bg-white px-1.5 py-0.2 rounded border border-black">
                {third.score} PTS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Stats Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
        <div className="bg-white border-2 border-black rounded-xl p-3.5 shadow-neo-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black mb-1">
            <Zap className="w-4 h-4 text-black stroke-[2.5]" /> FASTEST GUESS
          </div>
          <p className="text-sm font-black text-black">
            {stats.fastestGuess
              ? `${stats.fastestGuess.nickname} (${(stats.fastestGuess.elapsedMs / 1000).toFixed(1)}s)`
              : '—'}
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-xl p-3.5 shadow-neo-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black mb-1">
            <Flame className="w-4 h-4 text-neo-orange stroke-[2.5]" /> LONGEST STREAK
          </div>
          <p className="text-sm font-black text-black">
            {stats.longestStreak
              ? `${stats.longestStreak.nickname} (${stats.longestStreak.streak} rounds)`
              : '—'}
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-xl p-3.5 shadow-neo-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black mb-1">
            <CheckCircle className="w-4 h-4 text-neo-green stroke-[2.5]" /> SONGS GUESSED
          </div>
          <p className="text-sm font-black text-black">
            {stats.totalSongsGuessed} correct answers
          </p>
        </div>
      </div>

      {/* Complete Standings Table */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 mb-8 shadow-neo text-left">
        <h3 className="font-black text-sm uppercase tracking-wider text-black mb-3">
          FINAL STANDINGS
        </h3>
        <div className="divide-y-2 divide-neutral-100 text-sm">
          {standings.map((p) => (
            <div key={p.playerId} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-black text-black w-6 h-6 rounded border border-black bg-neutral-100 flex items-center justify-center text-xs">
                  {p.rank}
                </span>
                <span className="font-bold text-black">{p.nickname}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-black">
                <span className="text-neutral-500 uppercase">{p.correctCount} CORRECT</span>
                <span className="text-black text-sm font-black">{p.score.toLocaleString()} PTS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Host Actions */}
      {isHost ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-3.5 bg-neo-yellow hover:bg-[#FFDF00] text-black font-black uppercase text-sm rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" /> PLAY AGAIN (SAME SETTINGS)
          </button>
          <button
            onClick={onChangeSettings}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-neutral-100 text-black font-black uppercase text-sm rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4 stroke-[2.5]" /> RETURN TO LOBBY
          </button>
        </div>
      ) : (
        <p className="text-xs font-black uppercase tracking-wider text-neutral-600">
          Waiting for host to start another game or return to lobby...
        </p>
      )}
    </div>
  );
};
