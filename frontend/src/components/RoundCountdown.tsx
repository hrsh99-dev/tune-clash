'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface RoundCountdownProps {
  startAt: number;
  deadlineAt: number;
  serverTime?: number;
  windowMs?: number;
  onDeadlineReached?: () => void;
}

export const RoundCountdown: React.FC<RoundCountdownProps> = ({
  startAt,
  deadlineAt,
  serverTime,
  windowMs,
  onDeadlineReached,
}) => {
  // Total guessing window duration in ms: immune to client-server clock skew because both timestamps are from server
  const totalDurationMs = Math.max(1000, windowMs || deadlineAt - startAt);

  // Measure client monotonic start time from component mount
  const mountPerfRef = useRef<number>(performance.now());
  const initialClientNowRef = useRef<number>(Date.now());
  const hasTriggeredDeadlineRef = useRef<boolean>(false);

  // Compute exact remaining ms
  const computeTimeRemaining = (): number => {
    // 1. Monotonic elapsed time on client machine
    const elapsedMonotonic = performance.now() - mountPerfRef.current;
    const monotonicRemaining = Math.max(0, totalDurationMs - elapsedMonotonic);

    // 2. Server time skew adjustment (if serverTime provided)
    if (serverTime) {
      // Offset between client clock and server clock at the moment the event arrived
      const clockSkew = initialClientNowRef.current - serverTime;
      const estimatedServerNow = Date.now() - clockSkew;
      const serverRemaining = Math.max(0, deadlineAt - estimatedServerNow);
      // Bound within [0, totalDurationMs] to prevent wild clock drift numbers
      return Math.min(monotonicRemaining, serverRemaining);
    }

    return monotonicRemaining;
  };

  const [timeLeftMs, setTimeLeftMs] = useState<number>(computeTimeRemaining());

  useEffect(() => {
    mountPerfRef.current = performance.now();
    initialClientNowRef.current = Date.now();
    hasTriggeredDeadlineRef.current = false;
    setTimeLeftMs(computeTimeRemaining());

    const interval = setInterval(() => {
      const left = computeTimeRemaining();
      setTimeLeftMs(left);

      if (left <= 0 && !hasTriggeredDeadlineRef.current) {
        hasTriggeredDeadlineRef.current = true;
        clearInterval(interval);
        onDeadlineReached?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [deadlineAt, startAt, totalDurationMs, serverTime, onDeadlineReached]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / totalDurationMs) * 100));
  const secondsDisplay = (timeLeftMs / 1000).toFixed(1);

  // Progressive color based on time remaining
  let barColor = 'bg-neo-green';
  let badgeColor = 'bg-neo-green-light text-black';
  if (progressPercent < 25) {
    barColor = 'bg-neo-pink';
    badgeColor = 'bg-neo-pink-light text-black';
  } else if (progressPercent < 55) {
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
          className={`h-full rounded-full border-r-2 border-black transition-all duration-75 ease-linear ${barColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
