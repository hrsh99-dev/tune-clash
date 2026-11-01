'use client';

import React from 'react';
import { Crown, Flame, WifiOff, Trophy } from 'lucide-react';
import { PlayerLeaderboardEntry } from '@/shared';

interface LeaderboardProps {
  entries: PlayerLeaderboardEntry[];
  currentPlayerId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentPlayerId }) => {
  return (
    <div className="w-full bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-neo">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-black stroke-[2.5]" />
          <h3 className="font-black text-sm uppercase tracking-wider text-black">
            LEADERBOARD
          </h3>
        </div>
        <span className="font-mono text-xs font-bold uppercase bg-neo-yellow border border-black px-2 py-0.5 rounded shadow-neo-sm">
          {entries.length} PLAYERS
        </span>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {entries.map((player) => {
          const isMe = player.playerId === currentPlayerId;

          // Rank Badge Color
          let rankBg = 'bg-white text-black';
          if (player.rank === 1) rankBg = 'bg-neo-yellow text-black font-black';
          else if (player.rank === 2) rankBg = 'bg-neo-cyan text-black font-black';
          else if (player.rank === 3) rankBg = 'bg-neo-pink text-white font-black';

          return (
            <div
              key={player.playerId}
              className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition-all ${
                isMe
                  ? 'bg-neo-yellow-light/80 shadow-neo-sm font-black'
                  : 'bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center text-xs font-black shrink-0 shadow-neo-sm ${rankBg}`}
                >
                  {player.rank}
                </span>

                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate text-black font-bold text-sm">
                    {player.nickname}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-black text-neo-yellow px-1.5 py-0.2 rounded font-black uppercase tracking-tight">
                      YOU
                    </span>
                  )}
                  {player.isHost && (
                    <span title="Host" className="text-neo-yellow">
                      <Crown className="w-3.5 h-3.5 fill-black stroke-black" />
                    </span>
                  )}
                  {!player.isConnected && (
                    <span title="Disconnected">
                      <WifiOff className="w-3.5 h-3.5 text-neo-pink stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {player.currentStreak > 1 && (
                  <span
                    className="inline-flex items-center gap-0.5 text-xs font-black text-black bg-neo-orange border border-black px-1.5 py-0.5 rounded shadow-neo-sm"
                    title={`${player.currentStreak} correct streak`}
                  >
                    <Flame className="w-3 h-3 fill-current" />
                    {player.currentStreak}
                  </span>
                )}
                <div className="text-right">
                  <span className="font-black text-black text-sm tabular-nums">
                    {player.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-600 uppercase ml-0.5">
                    PTS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
