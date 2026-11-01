'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, XCircle, Flame, Lightbulb, Sparkles } from 'lucide-react';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  attemptsLeft: number;
  isCorrect: boolean;
  isClose?: boolean;
  feedbackMessage?: string;
  titleCue?: string;
  disabled?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  onSubmit,
  attemptsLeft,
  isCorrect,
  isClose = false,
  feedbackMessage,
  titleCue,
  disabled = false,
}) => {
  const [guess, setGuess] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!disabled && !isCorrect && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, isCorrect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed || disabled || isCorrect || attemptsLeft <= 0) return;

    onSubmit(trimmed);
    setGuess('');
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Title Cue Hint Banner (Retro Marquee) */}
      {titleCue && !isCorrect && (
        <div className="mb-3.5 p-3.5 bg-neo-yellow-light border-2 border-black rounded-xl text-center shadow-neo-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-black uppercase tracking-wider mb-1">
            <Lightbulb className="w-4 h-4 text-black stroke-[2.5]" />
            <span>TITLE HINT UNLOCKED</span>
          </div>
          <div className="inline-block bg-white border-2 border-black rounded-lg px-4 py-1.5 shadow-neo-sm">
            <p className="font-mono text-xl sm:text-2xl font-black tracking-[0.3em] text-black select-none">
              {titleCue}
            </p>
          </div>
        </div>
      )}

      {/* Answer Feedback Banner */}
      {feedbackMessage && (
        <div
          role="status"
          className={`mb-3 p-3 rounded-xl border-2 border-black text-sm font-black flex items-center gap-2.5 shadow-neo-sm transition-all ${
            isCorrect
              ? 'bg-neo-green text-black'
              : isClose
              ? 'bg-neo-orange text-black animate-pulse'
              : 'bg-neo-pink text-white'
          }`}
        >
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5] text-black" />
          ) : isClose ? (
            <Flame className="w-5 h-5 shrink-0 text-black fill-current" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0 stroke-[2.5] text-white" />
          )}
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-stretch gap-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="song-guess-input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={disabled || isCorrect || attemptsLeft <= 0}
            placeholder={
              isCorrect
                ? '🎉 Correct! Waiting for round to end...'
                : attemptsLeft <= 0
                ? '❌ No attempts left for this round'
                : 'Type song title or movie...'
            }
            maxLength={120}
            autoComplete="off"
            className={`w-full px-4 py-3.5 bg-white border-2 border-black rounded-xl text-black font-bold placeholder:text-neutral-500 placeholder:font-normal text-sm sm:text-base shadow-neo-sm focus:outline-none focus:shadow-neo transition-all disabled:bg-neutral-100 disabled:text-neutral-400 ${
              isClose ? 'ring-4 ring-neo-orange' : ''
            }`}
          />
        </div>

        <button
          id="submit-guess-btn"
          type="submit"
          disabled={!guess.trim() || disabled || isCorrect || attemptsLeft <= 0}
          className="px-6 py-3.5 bg-neo-yellow hover:bg-[#FFDF00] disabled:bg-neutral-200 disabled:text-neutral-400 text-black font-black uppercase text-sm border-2 border-black rounded-xl shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5 shrink-0 disabled:shadow-none"
        >
          <span>GUESS</span>
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* Attempt Counter and Key hint */}
      <div className="flex items-center justify-between text-xs font-bold uppercase text-black mt-2.5 px-1">
        <span className="inline-flex items-center gap-1 bg-white border border-black px-2 py-0.5 rounded shadow-neo-sm">
          ATTEMPTS: <strong className="text-black">{attemptsLeft} / 3</strong>
        </span>
        <span className="text-neutral-600 font-mono text-[11px]">
          PRESS <kbd className="bg-white px-1.5 py-0.5 rounded border border-black font-bold text-black shadow-xs">ENTER ↵</kbd>
        </span>
      </div>
    </div>
  );
};
