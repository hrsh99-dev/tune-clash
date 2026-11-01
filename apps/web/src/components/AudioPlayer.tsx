'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Disc, Play, RotateCcw, Radio } from 'lucide-react';
import { getApiBase } from '@/lib/apiConfig';

interface AudioPlayerProps {
  audioUrl?: string;
  startAt?: number;
  isPlaying: boolean;
  onAudioReady?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  startAt,
  isPlaying,
  onAudioReady,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);

  // Initialize and load audio when URL changes
  useEffect(() => {
    if (!audioUrl) return;

    setAudioError(null);
    setAutoplayBlocked(false);
    setIsActuallyPlaying(false);

    const apiBase = getApiBase();
    const fullUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `${apiBase}${audioUrl}`;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = fullUrl;
    audio.preload = 'auto';

    const handleCanPlay = () => {
      onAudioReady?.();
    };

    const handleError = () => {
      setAudioError('Failed to load audio clip. Please check your network connection.');
    };

    const handleEnded = () => {
      setIsActuallyPlaying(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 2) {
      handleCanPlay();
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audioUrl]);

  // Handle synchronization and playback based on startAt & isPlaying
  useEffect(() => {
    if (!isPlaying || !audioRef.current || audioError) return;

    const audio = audioRef.current;
    const now = Date.now();
    const delay = startAt ? Math.max(0, startAt - now) : 0;

    const timer = setTimeout(() => {
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          setIsActuallyPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn('Autoplay blocked by browser policy:', err);
          setAutoplayBlocked(true);
          setIsActuallyPlaying(false);
        });
    }, delay);

    return () => {
      clearTimeout(timer);
      audio.pause();
      setIsActuallyPlaying(false);
    };
  }, [isPlaying, startAt, audioUrl]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleManualUnlock = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsActuallyPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          setAudioError('Could not start audio playback: ' + err.message);
        });
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsActuallyPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn('Replay blocked or failed:', err);
        });
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Autoplay blocked permission banner */}
      {autoplayBlocked && (
        <div className="w-full max-w-md bg-neo-yellow border-2 border-black rounded-xl p-3 mb-4 flex items-center justify-between gap-3 text-black shadow-neo-sm animate-bounce">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-black shrink-0" />
            <span>Sound is blocked by your browser!</span>
          </div>
          <button
            onClick={handleManualUnlock}
            className="px-3 py-1.5 bg-black text-neo-yellow text-xs font-black uppercase rounded-lg border-2 border-black flex items-center gap-1 shrink-0 shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Enable Sound
          </button>
        </div>
      )}

      {/* Audio loading error */}
      {audioError && (
        <div className="w-full max-w-md bg-neo-pink-light border-2 border-black text-black rounded-xl p-3 mb-4 flex items-center justify-between text-xs sm:text-sm font-bold shadow-neo-sm">
          <span>⚠️ {audioError}</span>
          <button
            onClick={handleManualUnlock}
            className="underline font-black ml-2 uppercase hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Retro Vinyl Record Player Box */}
      <div className="relative flex flex-col items-center gap-4 bg-[#FFFDF7] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-neo max-w-md w-full">
        {/* Top Status Strip */}
        <div className="w-full flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border border-black ${isActuallyPlaying ? 'bg-neo-green animate-ping' : 'bg-neutral-300'}`} />
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              {isActuallyPlaying ? 'AUDIO LIVE' : '8-SECOND CLIP'}
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold uppercase bg-neo-yellow px-2 py-0.5 rounded border border-black">
            HIGH-FIDELITY
          </span>
        </div>

        {/* Vinyl Disc with colorful grooved styling */}
        <div className="relative my-2">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-black border-[4px] border-black shadow-neo flex items-center justify-center transition-all ${
              isActuallyPlaying ? 'animate-spin-slow scale-105' : 'opacity-90'
            }`}
          >
            {/* Vinyl grooves */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-neutral-700 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-neutral-800 flex items-center justify-center">
                {/* Center Label (Canary Yellow retro badge) */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neo-yellow border-2 border-black flex items-center justify-center text-black font-black shadow-inner">
                  <Disc className="w-8 h-8 text-black" />
                </div>
              </div>
            </div>
          </div>

          {/* Tonearm graphic overlay */}
          <div className="absolute -top-3 -right-2 w-8 h-14 pointer-events-none select-none hidden sm:block">
            <div className="w-2 h-12 bg-neutral-400 border border-black rounded-sm rotate-12 origin-top shadow-sm" />
          </div>
        </div>

        {/* Dynamic sound wave visualizer bars */}
        <div className="flex items-end justify-center gap-1.5 h-8 w-full px-4">
          {[14, 28, 18, 34, 22, 38, 18, 30, 20, 26, 32, 16].map((h, i) => {
            const colors = ['bg-neo-yellow', 'bg-neo-green', 'bg-neo-pink', 'bg-neo-cyan', 'bg-neo-purple'];
            const barBg = colors[i % colors.length];
            return (
              <span
                key={i}
                className={`w-2 rounded-t-sm border border-black transition-all duration-150 ${
                  isActuallyPlaying ? barBg : 'bg-neutral-200'
                }`}
                style={{
                  height: isActuallyPlaying ? `${Math.min(100, h * ((i % 3) + 1.2))}%` : '20%',
                }}
              />
            );
          })}
        </div>

        {/* Controls: Replay Clip + Mute Button */}
        <div className="w-full flex items-center justify-between pt-3 border-t-2 border-black">
          <button
            id="replay-clip-btn"
            onClick={handleReplay}
            disabled={!isPlaying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neo-cyan hover:bg-[#38BDF8] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Replay this music clip"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>{isActuallyPlaying ? 'REPLAYING...' : 'REPLAY CLIP'}</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-2 bg-white text-black border-2 border-black rounded-xl hover:bg-neutral-100 shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neo-pink stroke-[2.5]" />
            ) : (
              <Volume2 className="w-4 h-4 text-black stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
