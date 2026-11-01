'use client';

import React from 'react';
import { Music, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { RevealedTrack, PlayerRoundResult } from '@tune-clash/shared';

interface RevealCardProps {
  revealedTrack: RevealedTrack;
  playerResults: PlayerRoundResult[];
  currentPlayerId?: string;
  isHost?: boolean;
  onNextRound?: () => void;
  isLastRound?: boolean;
}

export const RevealCard: React.FC<RevealCardProps> = ({
  revealedTrack,
  playerResults,
  currentPlayerId,
  isHost,
  onNextRound,
  isLastRound,
}) => {
  const myResult = playerResults.find((p) => p.playerId === currentPlayerId);

  return (
    <div className="w-full max-w-xl mx-auto bg-white border-[3px] border-black rounded-2xl p-6 sm:p-8 shadow-neo-lg text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold uppercase bg-neo-yellow border-2 border-black rounded-full shadow-neo-sm mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>TRACK REVEALED</span>
      </div>

      {/* Song Title and Artists */}
      <div className="mb-5">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black mt-1 mb-1 leading-tight">
          {revealedTrack.title}
        </h2>
        <p className="text-base font-bold text-neutral-700">
          by {revealedTrack.artists.join(', ')}
        </p>

        {/* Badges / Pill Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {revealedTrack.categories.map((c) => (
            <span
              key={c}
              className="px-3 py-1 rounded-full text-xs font-black uppercase bg-neo-yellow border-2 border-black shadow-neo-sm text-black"
            >
              {c}
            </span>
          ))}
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-neo-cyan border-2 border-black shadow-neo-sm text-black">
            {revealedTrack.era}
          </span>
          {revealedTrack.genres?.map((g) => (
            <span
              key={g}
              className="px-3 py-1 rounded-full text-xs font-black uppercase bg-neo-purple-light border-2 border-black shadow-neo-sm text-black"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Point breakdown for current user */}
      {myResult && (
        <div className="bg-[#FFFDF7] rounded-xl p-4 mb-6 text-left border-2 border-black shadow-neo-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
            <span className="text-xs font-black uppercase tracking-wider text-black">
              YOUR ROUND RESULT
            </span>
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-black shadow-neo-sm ${
                myResult.wasCorrect
                  ? 'bg-neo-green text-black'
                  : 'bg-neo-pink text-white'
              }`}
            >
              {myResult.wasCorrect ? '✓ CORRECT GUESS!' : '✗ MISSED'}
            </span>
          </div>

          {myResult.wasCorrect ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-neo-sm">
                <span className="text-neutral-500 font-bold block text-[10px] uppercase">Base</span>
                <span className="font-black text-black text-sm">+{myResult.pointsBreakdown.base}</span>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-neo-sm">
                <span className="text-neutral-500 font-bold block text-[10px] uppercase">Speed</span>
                <span className="font-black text-black text-sm">+{myResult.pointsBreakdown.speedBonus}</span>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-neo-sm">
                <span className="text-neutral-500 font-bold block text-[10px] uppercase">1st Bonus</span>
                <span className="font-black text-black text-sm">
                  {myResult.pointsBreakdown.firstCorrectBonus > 0
                    ? `+${myResult.pointsBreakdown.firstCorrectBonus}`
                    : '0'}
                </span>
              </div>
              <div className="bg-neo-yellow border-2 border-black rounded-lg p-2 text-center shadow-neo-sm">
                <span className="text-black font-black block text-[10px] uppercase">Total</span>
                <span className="font-black text-black text-base">+{myResult.pointsBreakdown.total}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs font-bold text-neutral-600">
              No points awarded this round. Streak reset!
            </p>
          )}
        </div>
      )}

      {/* Host next round button */}
      {isHost ? (
        <button
          onClick={onNextRound}
          className="w-full py-3.5 bg-neo-yellow hover:bg-[#FFDF00] text-black font-black text-sm uppercase tracking-wider rounded-xl border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <span>{isLastRound ? 'SEE FINAL RESULTS 🏆' : 'NEXT ROUND NOW'}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      ) : (
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Waiting for host to continue...
        </p>
      )}
    </div>
  );
};
