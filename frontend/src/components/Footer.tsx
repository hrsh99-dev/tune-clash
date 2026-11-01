'use client';

import React, { useState } from 'react';
import { Info, Shield, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const handleOpen = (type: 'about' | 'privacy' | 'terms') => {
    if (type === 'about') {
      setModalContent({
        title: 'About Tune Clash',
        content:
          'Tune Clash is a casual, multiplayer music party game designed for friends, families, and music lovers. Players join private rooms with a simple 6-character room code, listen to short audio clips, and guess songs in real time. Features smart filters for Bollywood, Hollywood Pop, Retro Classics, real-time hint voting, and arcade leaderboard standings.',
      });
    } else if (type === 'privacy') {
      setModalContent({
        title: 'Privacy Notice',
        content:
          'Tune Clash does not require account creation or passwords for casual play. Only temporary nicknames and room scores are stored for active multiplayer sessions. We do not collect email addresses, personal identification, or location data.',
      });
    } else {
      setModalContent({
        title: 'Terms of Service',
        content:
          'Tune Clash is intended for friendly party entertainment. All audio tracks in the baseline catalog are curated demo audio clips for gameplay evaluation. Users agree to respect fair play and friendly sportsmanship in private rooms.',
      });
    }
  };

  return (
    <>
      <footer className="w-full mt-auto py-6 border-t-2 border-black bg-[#FAF5EE] text-center text-sm text-black">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-wider text-black">
            © 2026 TUNE CLASH • RETRO MULTIPLAYER PARTY GAME
          </p>

          <div className="flex items-center gap-3 text-xs font-black uppercase">
            <button
              onClick={() => handleOpen('about')}
              className="px-2.5 py-1 bg-white border border-black rounded-md shadow-neo-sm hover:bg-neutral-100 transition-all flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> ABOUT
            </button>
            <button
              onClick={() => handleOpen('privacy')}
              className="px-2.5 py-1 bg-white border border-black rounded-md shadow-neo-sm hover:bg-neutral-100 transition-all flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> PRIVACY
            </button>
            <button
              onClick={() => handleOpen('terms')}
              className="px-2.5 py-1 bg-white border border-black rounded-md shadow-neo-sm hover:bg-neutral-100 transition-all flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> TERMS
            </button>
          </div>
        </div>
      </footer>

      {/* Info Dialog */}
      {modalContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-neo-xl border-[3px] border-black">
            <h3 className="text-xl font-black uppercase tracking-tight text-black mb-3">{modalContent.title}</h3>
            <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed mb-6">{modalContent.content}</p>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-3 bg-neo-yellow hover:bg-[#FFDF00] text-black font-black uppercase rounded-xl text-xs sm:text-sm border-2 border-black shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
