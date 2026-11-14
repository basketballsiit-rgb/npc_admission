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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-rose-400/30 text-rose-200 text-xs sm:text-sm font-medium backdrop-blur-md">
        <Clock className="w-4 h-4 text-rose-400" />
        <span>รอบนี้สิ้นสุดระยะเวลารับสมัครแล้ว</span>
      </div>
    );
  }

  const displayName = roundName.replace(/\s*\([^)]*\)/g, "").trim();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 border border-amber-400/40 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-white">
        <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>
          เวลาที่เหลือก่อนปิด <strong className="text-amber-300 font-bold">{displayName}</strong>:
        </span>
      </div>
      <div className="flex items-center gap-2 text-center font-mono">
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-amber-200">
          <span className="font-black text-[#1E3A8A] text-sm sm:text-base">{timeLeft.days}</span>
          <span className="text-[11px] text-slate-500 font-sans ml-1">วัน</span>
        </div>
        <span className="text-amber-300 font-bold text-sm">:</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-amber-200">
          <span className="font-black text-[#1E3A8A] text-sm sm:text-base">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-slate-500 font-sans ml-1">ชม.</span>
        </div>
        <span className="text-amber-300 font-bold text-sm">:</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-amber-200">
          <span className="font-black text-[#1E3A8A] text-sm sm:text-base">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-slate-500 font-sans ml-1">นาที</span>
        </div>
        <span className="text-amber-300 font-bold text-sm">:</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-amber-200">
          <span className="font-black text-[#F59E0B] text-sm sm:text-base">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-slate-500 font-sans ml-1">วิ</span>
        </div>
      </div>
    </div>
  );
}
