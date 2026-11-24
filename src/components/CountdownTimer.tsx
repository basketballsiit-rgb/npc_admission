"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string; // ISO string
  roundName: string;
}

export default function CountdownTimer({ targetDate, roundName }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isEnded: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isEnded: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isEnded) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/70 border border-rose-400/30 text-rose-100 text-xs font-medium">
        <Clock className="w-4 h-4 text-rose-300 shrink-0" strokeWidth={1.75} />
        <span>รอบนี้สิ้นสุดระยะเวลารับสมัครแล้ว</span>
      </div>
    );
  }

  const displayName = roundName.replace(/\s*\([^)]*\)/g, "").trim();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-300">
        <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} />
        <span>
          เวลาคงเหลือก่อนปิดรับสมัคร ({displayName})
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
        <div className="bg-amber-50 px-2 py-2 rounded-lg border border-amber-300">
          <div className="font-semibold text-[#162C63] text-lg leading-none">{timeLeft.days}</div>
          <div className="text-xs text-slate-700 font-sans mt-1">วัน</div>
        </div>
        <div className="bg-white px-2 py-2 rounded-lg border border-slate-200">
          <div className="font-semibold text-[#162C63] text-lg leading-none">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-600 font-sans mt-1">ชม.</div>
        </div>
        <div className="bg-white px-2 py-2 rounded-lg border border-slate-200">
          <div className="font-semibold text-[#162C63] text-lg leading-none">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-600 font-sans mt-1">นาที</div>
        </div>
        <div className="bg-white/90 px-2 py-2 rounded-lg border border-slate-200">
          <div className="font-medium text-slate-600 text-lg leading-none">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-500 font-sans mt-1">วินาที</div>
        </div>
      </div>
    </div>
  );
}
