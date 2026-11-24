"use client";

import React, { useState } from "react";
import {
  Zap,
  Wrench,
  Cpu,
  Monitor,
  FileSpreadsheet,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Car,
} from "lucide-react";
import { assetUrl } from "@/lib/basepath";

export type MascotType =
  | "ev"
  | "auto"
  | "elec"
  | "tron"
  | "it"
  | "acc"
  | "mkt"
  | "academic";

interface MascotAvatarProps {
  type: MascotType;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
}

const MASCOT_CONFIG: Record<
  MascotType,
  {
    title: string;
    subTitle: string;
    imageFile: string;
    gradient: string;
    ringColor: string;
    shadowColor: string;
    icon: React.ElementType;
    iconColor: string;
    accentGlow: string;
  }
> = {
  ev: {
    title: "ยอดนักเทคโนโลยียานยนต์ไฟฟ้า",
    subTitle: "EV Future Specialist",
    imageFile: "/images/mascots/ev.png",
    gradient: "from-cyan-500 via-blue-600 to-emerald-500",
    ringColor: "border-cyan-300",
    shadowColor: "shadow-cyan-500/30",
    icon: Zap,
    iconColor: "text-cyan-200",
    accentGlow: "bg-cyan-400/25",
  },
  auto: {
    title: "ยอดนายช่างยานยนต์มือทอง",
    subTitle: "Master Automotive Tech",
    imageFile: "/images/mascots/auto.png",
    gradient: "from-rose-600 via-red-600 to-amber-600",
    ringColor: "border-rose-300",
    shadowColor: "shadow-rose-500/30",
    icon: Wrench,
    iconColor: "text-amber-200",
    accentGlow: "bg-rose-400/25",
  },
  elec: {
    title: "ยอดนักพลังงานไฟฟ้ากำลัง",
    subTitle: "Power Grid & Solar Engineer",
    imageFile: "/images/mascots/elec.png",
    gradient: "from-amber-400 via-yellow-500 to-orange-600",
    ringColor: "border-amber-300",
    shadowColor: "shadow-amber-500/30",
    icon: Zap,
    iconColor: "text-yellow-100",
    accentGlow: "bg-amber-400/25",
  },
  tron: {
    title: "ยอดนักประดิษฐ์หุ่นยนต์ & IoT",
    subTitle: "Smart Tech & Robotics",
    imageFile: "/images/mascots/tron.png",
    gradient: "from-slate-700 via-slate-800 to-blue-900",
    ringColor: "border-amber-300/90",
    shadowColor: "shadow-slate-900/30",
    icon: Cpu,
    iconColor: "text-amber-200",
    accentGlow: "bg-slate-400/15",
  },
  it: {
    title: "ยอดนักพัฒนาซอฟต์แวร์ & AI",
    subTitle: "Digital & AI Creator",
    imageFile: "/images/mascots/it.png",
    gradient: "from-blue-600 via-indigo-600 to-cyan-600",
    ringColor: "border-blue-300",
    shadowColor: "shadow-blue-500/30",
    icon: Monitor,
    iconColor: "text-sky-200",
    accentGlow: "bg-blue-400/25",
  },
  acc: {
    title: "ยอดนักวางแผนการเงิน & ภาษี",
    subTitle: "Financial Strategist",
    imageFile: "/images/mascots/acc.png",
    gradient: "from-emerald-500 via-teal-600 to-green-700",
    ringColor: "border-emerald-300",
    shadowColor: "shadow-emerald-500/30",
    icon: FileSpreadsheet,
    iconColor: "text-emerald-100",
    accentGlow: "bg-emerald-400/25",
  },
  mkt: {
    title: "ยอดนักการตลาดดิจิทัล & ครีเอเตอร์",
    subTitle: "Digital Growth Marketer",
    imageFile: "/images/mascots/mkt.png",
    gradient: "from-rose-700 via-rose-800 to-slate-900",
    ringColor: "border-rose-200/80",
    shadowColor: "shadow-slate-900/20",
    icon: TrendingUp,
    iconColor: "text-rose-100",
    accentGlow: "bg-transparent",
  },
  academic: {
    title: "ยอดนักวิชาการ & การวิจัย",
    subTitle: "Academic Explorer",
    imageFile: "/images/mascots/academic.png",
    gradient: "from-slate-700 via-indigo-800 to-blue-900",
    ringColor: "border-indigo-300",
    shadowColor: "shadow-indigo-500/30",
    icon: GraduationCap,
    iconColor: "text-indigo-200",
    accentGlow: "bg-indigo-400/25",
  },
};

export default function MascotAvatar({
  type,
  size = "md",
  className = "",
  showBadge = true,
}: MascotAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const cfg = MASCOT_CONFIG[type] || MASCOT_CONFIG.auto;
  const IconComponent = cfg.icon;

  const sizeStyles = {
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-36 h-36",
    xl: "w-48 h-48 sm:w-56 sm:h-56",
  };

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-12 h-12",
    lg: "w-18 h-18",
    xl: "w-24 h-24",
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Outer Avatar Frame */}
      <div
        className={`relative ${sizeStyles[size]} rounded-2xl p-1 bg-gradient-to-tr ${cfg.gradient} border ${cfg.ringColor} shadow-sm flex items-center justify-center overflow-hidden`}
      >
        {/* Content: Image or Fallback Icon */}
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(cfg.imageFile)}
            alt={cfg.title}
            className="w-full h-full object-contain relative z-10"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-slate-900/40 flex flex-col items-center justify-center relative z-10 border border-white/15">
            <IconComponent className={`${iconSizes[size]} ${cfg.iconColor}`} strokeWidth={1.75} />
            {size !== "sm" && (
              <span className="text-xs font-medium text-white/90 mt-1">
                NPC
              </span>
            )}
          </div>
        )}
      </div>

      {/* Label Badge below avatar */}
      {showBadge && (
        <div className="mt-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 text-xs font-bold border border-amber-300/40 shadow-xs leading-snug">
            {cfg.title}
          </span>
        </div>
      )}
    </div>
  );
}
