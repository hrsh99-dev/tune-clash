'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import {
  PlusCircle,
  LogIn,
  Sparkles,
  Music2,
  Users,
  Flame,
  Headphones,
  ArrowRight,
  Disc,
  Radio,
  Zap,
} from 'lucide-react';
import { getApiBase } from '@/lib/apiConfig';

export default function HomePage() {
  const router = useRouter();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<'create' | 'join' | null>(null);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createPreset, setCreatePreset] = useState<'all' | 'bollywood' | 'hollywood' | 'retro'>('all');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      setErrorMsg('Nickname must be between 2 and 20 characters.');
      return;
    }

    const initialSettings: any = {};
    if (createPreset === 'bollywood') {
      initialSettings.categories = ['Bollywood'];
      initialSettings.languages = ['Hindi'];
    } else if (createPreset === 'hollywood') {
      initialSettings.categories = ['Hollywood'];
      initialSettings.languages = ['English'];
    } else if (createPreset === 'retro') {
      initialSettings.eras = ['1970s', '1980s', '1990s'];
    }

    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed, settings: initialSettings }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || 'Failed to create room.');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('tune_clash_roomCode', data.roomCode);
      sessionStorage.setItem('tune_clash_playerId', data.player.playerId);
      sessionStorage.setItem('tune_clash_nickname', data.player.nickname);
      sessionStorage.setItem('tune_clash_token', data.reconnectToken);

      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      setErrorMsg('Network error connecting to game server.');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmedNick = nickname.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!trimmedNick || trimmedNick.length < 2 || trimmedNick.length > 20) {
      setErrorMsg('Nickname must be between 2 and 20 characters.');
      return;
    }
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Room code must be exactly 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmedNick }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || 'Failed to join room.');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('tune_clash_roomCode', data.roomCode);
      sessionStorage.setItem('tune_clash_playerId', data.player.playerId);
      sessionStorage.setItem('tune_clash_nickname', data.player.nickname);
      sessionStorage.setItem('tune_clash_token', data.reconnectToken);

      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      setErrorMsg('Network error connecting to game server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenHowToPlay={() => setIsHowToPlayOpen(true)} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-14">
        <div className="max-w-4xl w-full">
          {/* Top Vintage Label */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-black">
              THE MULTIPLAYER MUSIC PARTY GAME
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase bg-neo-green text-black border-2 border-black rounded-full shadow-neo-sm">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span>LIVE MULTIPLAYER</span>
            </div>
          </div>

          {/* BUNKK Style Hero Card */}
          <div className="relative mb-8">
            {/* Main Giant Yellow Box */}
            <div className="relative bg-neo-yellow border-[3px] border-black rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-neo-lg -rotate-0.5 hover:rotate-0 transition-transform">
              {/* Floating Retro Sticker Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider border-2 border-dashed border-black bg-white/95 rounded-md shadow-neo-sm">
                  ⚡ 1,065 SONGS READY
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 font-black text-xs uppercase bg-black text-neo-yellow rounded-full shadow-neo-sm">
                  <Sparkles className="w-3.5 h-3.5" /> NO LOGIN NEEDED
                </span>
              </div>

              {/* Huge Bold Title */}
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-black leading-none mb-4 select-none">
                TUNE<span className="inline-block bg-black text-neo-yellow px-2 py-0.5 rounded-lg ml-1 shadow-neo-sm">CLASH</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-2xl font-bold text-black max-w-2xl leading-snug mb-6">
                Know in ten seconds whether you and your friends know real music.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <button
                  id="create-room-btn"
                  onClick={() => {
                    setErrorMsg('');
                    setActiveModal('create');
                  }}
                  className="px-8 py-4 bg-black hover:bg-neutral-800 text-neo-yellow font-black text-base sm:text-lg uppercase tracking-wide rounded-xl border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                  <span>CREATE PARTY ROOM</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>

                <button
                  id="join-room-btn"
                  onClick={() => {
                    setErrorMsg('');
                    setActiveModal('join');
                  }}
                  className="px-8 py-4 bg-white hover:bg-neutral-100 text-black font-black text-base sm:text-lg uppercase tracking-wide rounded-xl border-2 border-black shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5 stroke-[2.5]" />
                  <span>JOIN WITH CODE</span>
                </button>
              </div>

              {/* Floating Decorative Badges (Bunkk-like calendar / time badge) */}
              <div className="absolute -bottom-5 -right-2 sm:right-6 bg-neo-pink border-2 border-black rounded-xl p-3 shadow-neo rotate-3 hidden sm:flex flex-col items-center select-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">CLIP LENGTH</span>
                <span className="text-2xl font-black text-black leading-none">8 SEC</span>
                <span className="text-[9px] font-bold uppercase tracking-tight bg-black text-white px-1.5 py-0.5 rounded mt-1">FAST PACED</span>
              </div>
            </div>
          </div>

          {/* Micro Subtitle Bar */}
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-neutral-600 px-2 mb-10">
            <span>Runs live in your browser on PC & Mobile</span>
            <span className="inline-flex items-center gap-1 text-black">
              SCROLL FOR FEATURES ↓
            </span>
          </div>

          {/* Neo-Brutalist Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {/* Feature 1 */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-neo-cyan border-2 border-black flex items-center justify-center text-black mb-4 shadow-neo-sm">
                <Users className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="inline-block px-2 py-0.5 bg-neo-cyan-light text-black text-[10px] font-bold uppercase tracking-wider border border-black rounded mb-2">
                2 TO 12 PLAYERS
              </div>
              <h3 className="font-black text-lg text-black uppercase tracking-tight mb-1">
                Private Rooms
              </h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed">
                Create instant 6-character room codes. Share with your friends on WhatsApp or Discord and battle in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-neo-yellow border-2 border-black flex items-center justify-center text-black mb-4 shadow-neo-sm">
                <Radio className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="inline-block px-2 py-0.5 bg-neo-yellow-light text-black text-[10px] font-bold uppercase tracking-wider border border-black rounded mb-2">
                SMART PLAYLISTS
              </div>
              <h3 className="font-black text-lg text-black uppercase tracking-tight mb-1">
                Custom Filters
              </h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed">
                Pick Bollywood, Hollywood Pop, or 70s/80s/90s Retro. Title hint voting and fuzzy matching ensure maximum fun.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-neo-pink border-2 border-black flex items-center justify-center text-black mb-4 shadow-neo-sm">
                <Flame className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="inline-block px-2 py-0.5 bg-neo-pink-light text-black text-[10px] font-bold uppercase tracking-wider border border-black rounded mb-2">
                DOUBLE POINTS & SUDDEN DEATH
              </div>
              <h3 className="font-black text-lg text-black uppercase tracking-tight mb-1">
                Chaos Modifiers
              </h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed">
                Turn up the heat with Double Points rounds, Lightning 8s speed runs, and final Sudden Death tiebreaker battles!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- CREATE ROOM MODAL ----------------- */}
      {activeModal === 'create' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-neo-xl border-[3px] border-black">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  HOST SETUP
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                  Create Party Room
                </h2>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-black flex items-center justify-center text-black font-black shadow-neo-sm">
                ⚡
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label htmlFor="create-nickname" className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Your Nickname
                </label>
                <input
                  id="create-nickname"
                  type="text"
                  required
                  maxLength={20}
                  minLength={2}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. BeatMaster"
                  autoFocus
                  className="neo-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Music Style Preset
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'all', label: '🌟 All-Time Mix', desc: 'Bollywood + Hollywood' },
                    { id: 'bollywood', label: '🎬 Bollywood Hits', desc: 'Hindi cinema bangers' },
                    { id: 'hollywood', label: '🌎 Hollywood Pop', desc: 'English chart toppers' },
                    { id: 'retro', label: '📻 Retro Classics', desc: '70s, 80s & 90s gold' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCreatePreset(p.id as any)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        createPreset === p.id
                          ? 'bg-neo-yellow border-black text-black font-black shadow-neo-sm'
                          : 'bg-white hover:bg-neutral-50 text-black border-black/40'
                      }`}
                    >
                      <div className="font-black text-xs">{p.label}</div>
                      <div className="text-[10px] text-neutral-600 font-medium leading-tight mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-neo-pink-light border-2 border-black text-black rounded-lg text-xs font-bold shadow-neo-sm">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={isLoading}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs sm:text-sm font-bold uppercase border-2 border-black rounded-xl shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-create-room-btn"
                  disabled={isLoading || !nickname.trim()}
                  className="w-1/2 py-3 bg-neo-yellow hover:bg-[#FFDF00] text-black text-xs sm:text-sm font-black uppercase border-2 border-black rounded-xl shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Room ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- JOIN ROOM MODAL ----------------- */}
      {activeModal === 'join' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-neo-xl border-[3px] border-black">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  ENTER PARTY
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                  Join with Code
                </h2>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neo-green border-2 border-black flex items-center justify-center text-black font-black shadow-neo-sm">
                🎮
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="join-room-code" className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  6-Letter Room Code
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  required
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K9X2B"
                  autoFocus
                  className="neo-input font-mono text-center tracking-widest font-black uppercase text-xl"
                />
              </div>

              <div>
                <label htmlFor="join-nickname" className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Your Nickname
                </label>
                <input
                  id="join-nickname"
                  type="text"
                  required
                  maxLength={20}
                  minLength={2}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. SongSlayer"
                  className="neo-input"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-neo-pink-light border-2 border-black text-black rounded-lg text-xs font-bold shadow-neo-sm">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={isLoading}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs sm:text-sm font-bold uppercase border-2 border-black rounded-xl shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-join-room-btn"
                  disabled={isLoading || !nickname.trim() || roomCode.length !== 6}
                  className="w-1/2 py-3 bg-neo-green hover:bg-[#34D399] text-black text-xs sm:text-sm font-black uppercase border-2 border-black rounded-xl shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Enter Game ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
      <Footer />
    </div>
  );
}
