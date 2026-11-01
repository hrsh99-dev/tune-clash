'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';

interface RoundCountdownProps {
  startAt: number;
  deadlineAt: number;
  onDeadlineReached?: () => void;
}

export const RoundCountdown: React.FC<RoundCountdownProps> = ({
  startAt,
  deadlineAt,
  onDeadlineReached,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(Math.max(0, deadlineAt - Date.now()));
  const totalWindowMs = Math.max(1000, deadlineAt - startAt);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, deadlineAt - now);
      setTimeLeftMs(left);

      if (left <= 0) {
        clearInterval(interval);
        onDeadlineReached?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadlineAt, onDeadlineReached]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / totalWindowMs) * 100));
  const secondsDisplay = (timeLeftMs / 1000).toFixed(1);

  // Progressive color based on time remaining
  let barColor = 'bg-neo-green';
  let badgeColor = 'bg-neo-green-light';
  if (progressPercent < 30) {
    barColor = 'bg-neo-pink';
    badgeColor = 'bg-neo-pink-light text-black';
  } else if (progressPercent < 60) {
    barColor = 'bg-neo-yellow';
    badgeColor = 'bg-neo-yellow-light text-black';
  }

  return (
    <div className="w-full max-w-lg mx-auto mb-4">
      <div className="flex items-center justify-between text-xs font-black uppercase text-black mb-1.5 px-0.5">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 stroke-[2.5]" />
          <span>TIME REMAINING</span>
        </span>
        <span
          className={`font-mono text-base font-black px-2.5 py-0.5 rounded-md border-2 border-black shadow-neo-sm ${badgeColor}`}
        >
          {secondsDisplay}s
        </span>
      </div>

      <div className="w-full h-4 bg-white rounded-full overflow-hidden border-2 border-black shadow-neo-sm p-0.5">
        <div
          className={`h-full rounded-full border-r-2 border-black transition-all duration-100 ease-linear ${barColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
