'use client';

import React from 'react';
import { X, PlayCircle, Zap, Flame, Award, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-neo-xl border-[3px] border-black my-8">
        <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-black flex items-center justify-center text-black shadow-neo-sm">
              <PlayCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              HOW TO PLAY TUNE CLASH
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-black text-black hover:bg-neutral-100 shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="space-y-3.5 text-sm text-black">
          <div className="flex items-start gap-3 p-3.5 bg-neo-green-light border-2 border-black rounded-xl shadow-neo-sm">
            <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-0.5 stroke-[2.5]" />
            <div>
              <p className="font-black uppercase text-xs text-black">1. Join a Private Room</p>
              <p className="text-neutral-700 text-xs mt-0.5 font-medium leading-relaxed">
                Host creates a room and shares the 6-letter room code. Friends join with just a nickname — no login or account required!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-neo-cyan-light border-2 border-black rounded-xl shadow-neo-sm">
            <Zap className="w-5 h-5 text-black shrink-0 mt-0.5 stroke-[2.5]" />
            <div>
              <p className="font-black uppercase text-xs text-black">2. Listen & Guess the Tune</p>
              <p className="text-neutral-700 text-xs mt-0.5 font-medium leading-relaxed">
                An 8-second music clip plays. Type your guess in the answer box and press Enter. You get up to 3 attempts per round!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-neo-yellow-light border-2 border-black rounded-xl shadow-neo-sm">
            <Award className="w-5 h-5 text-black shrink-0 mt-0.5 stroke-[2.5]" />
            <div>
              <p className="font-black uppercase text-xs text-black">3. Server Scoring Breakdown</p>
              <ul className="text-neutral-700 text-xs mt-1 list-disc list-inside space-y-0.5 font-medium">
                <li><strong className="text-black">500 Base points</strong> for a correct answer.</li>
                <li><strong className="text-black">0–500 Speed bonus</strong>: faster guesses earn up to 500 extra points.</li>
                <li><strong className="text-black">+250 First-to-guess bonus</strong> for the quickest player.</li>
                <li><strong className="text-black">+100 to +300 Streak bonus</strong> for consecutive correct rounds.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-neo-pink-light border-2 border-black rounded-xl shadow-neo-sm">
            <Flame className="w-5 h-5 text-black shrink-0 mt-0.5 fill-current" />
            <div>
              <p className="font-black uppercase text-xs text-black">4. Chaos Mode Modifiers</p>
              <p className="text-neutral-700 text-xs mt-0.5 font-medium">
                When enabled by the host, special round modifiers apply:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <span className="bg-white px-2 py-1 rounded-lg border border-black font-bold">💥 <strong>Double Points</strong>: 2x points</span>
                <span className="bg-white px-2 py-1 rounded-lg border border-black font-bold">⚡ <strong>Lightning</strong>: 8s quick window</span>
                <span className="bg-white px-2 py-1 rounded-lg border border-black font-bold">🚀 <strong>Comeback Boost</strong>: +150 lower half</span>
                <span className="bg-white px-2 py-1 rounded-lg border border-black font-bold">🔥 <strong>Sudden Death</strong>: final round bonus</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 bg-neo-yellow hover:bg-[#FFDF00] text-black font-black uppercase rounded-xl text-sm border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          GOT IT, LET'S PLAY! ➔
        </button>
      </div>
    </div>
  );
};
