'use client';

import React from 'react';
import Link from 'next/link';
import { Music2, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenHowToPlay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHowToPlay }) => {
  return (
    <header className="w-full bg-[#FAF5EE] border-b-2 border-black py-3 px-4 sm:px-8 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Chunky Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="bg-neo-yellow border-2 border-black rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-neo-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
            <div className="w-6 h-6 rounded-md bg-black text-neo-yellow flex items-center justify-center">
              <Music2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight uppercase text-black">
              TUNE<span className="bg-black text-neo-yellow px-1 ml-0.5 rounded">CLASH</span>
            </span>
          </div>
        </Link>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onOpenHowToPlay && (
            <button
              id="how-to-play-btn"
              onClick={onOpenHowToPlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-white text-black border-2 border-black rounded-lg shadow-neo-sm hover:bg-neo-green-light active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              aria-label="How to play guide"
            >
              <HelpCircle className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="hidden sm:inline">HOW TO PLAY</span>
              <span className="sm:hidden">RULES</span>
            </button>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-white text-black border-2 border-black rounded-lg shadow-neo-sm hover:bg-neo-yellow-light active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            aria-label="Admin catalog"
          >
            <ShieldAlert className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="hidden sm:inline">ADMIN</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
