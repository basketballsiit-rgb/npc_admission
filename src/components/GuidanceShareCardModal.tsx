"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  X,
  Sparkles,
  CheckCircle2,
  Phone,
  Globe,
  Loader2,
  User,
  Award,
  Star,
} from "lucide-react";
import { apiUrl, assetUrl } from "@/lib/basepath";
import { AssessmentResult } from "@/lib/guidance-questions";
import { DEPARTMENTS, EducationLevelType } from "@/lib/guidance-config";
import { MascotType } from "./MascotAvatar";
import RadarChart from "./RadarChart";

interface GuidanceShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AssessmentResult;
  selectedCode: string;
  selectedLevel: EducationLevelType;
  logId?: string | null;
}

export default function GuidanceShareCardModal({
  isOpen,
  onClose,
  result,
  selectedCode,
  selectedLevel,
  logId,
}: GuidanceShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Aspect mode: 'story' (9:16) | 'feed' (1:1 Square)
  const [aspectMode, setAspectMode] = useState<"story" | "feed">("story");
  const [studentName, setStudentName] = useState("น้องผู้สมัคร");

  // QR Code Data URL
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Export state
  const [exporting, setExporting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Map Department to Mascot Type
  const getMascotType = (): MascotType => {
    if (selectedCode === "20143") return "ev";
    if (result.top1 === "AUTO") return "auto";
    if (result.top1 === "ELEC") return "elec";
    if (result.top1 === "TRON") return "tron";
    if (result.top1 === "IT") return "it";
    if (result.top1 === "ACC") return "acc";
    if (result.top1 === "MKT") return "mkt";
    return "academic";
  };

  const mascotType = getMascotType();
  const topDept = DEPARTMENTS[result.top1];

  // Resolve active program name (WITHOUT code or level)
  let programName = selectedLevel === "ปวช." ? topDept.pvc.name : topDept.pvs.name;
  if (selectedLevel === "ปวช." && selectedCode === "20143") {
    programName = "สาขาวิชายานยนต์ไฟฟ้า";
  }

  // Generate Dynamic QR Code
  useEffect(() => {
    if (!isOpen) return;

    const targetUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${apiUrl(`/apply?level=${encodeURIComponent(selectedLevel)}&code=${encodeURIComponent(selectedCode)}`)}`
        : `https://service.npc.ac.th/npc_admission/apply?level=${encodeURIComponent(selectedLevel)}&code=${encodeURIComponent(selectedCode)}`;

    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [isOpen, selectedLevel, selectedCode]);

  if (!isOpen) return null;

  // Track share count in backend
  const recordShareAction = async () => {
    if (!logId) return;
    try {
      await fetch(apiUrl("/api/guidance/share"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
    } catch (e) {
      console.warn("Could not log share event:", e);
    }
  };

  // High-Resolution PNG Download
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      setShareSuccess(null);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#FEF08A",
      });

      const link = document.createElement("a");
      link.download = `npc-career-${selectedCode}-${aspectMode}.png`;
      link.href = dataUrl;
      link.click();

      setShareSuccess("ดาวน์โหลดภาพการ์ดความละเอียดสูงเรียบร้อยแล้ว!");
      recordShareAction();
    } catch (err) {
      console.error("Export PNG failed:", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  // Web Share API
  const handleQuickShare = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#FEF08A",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `npc-career-${selectedCode}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ผลการค้นพบสายอาชีพที่ใช่ - ${programName}`,
          text: `ฉันค้นพบสาขาที่ใช่แล้ว! "${programName}" วิทยาลัยสารพัดช่างน่าน`,
          files: [file],
        });
        recordShareAction();
        setShareSuccess("แชร์รูปภาพสำเร็จ!");
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                สร้างการ์ดผลลัพธ์ธีม Pop Festival / Wonderland (สไตล์ภาพที่ 2)
              </h3>
              <p className="text-[11px] text-slate-600">
                ดีไซน์สีสันสดใส ตัวหนังสือ 3D นูน มาสคอตเด่น และกราฟใยแมงมุมแสดงเฉพาะชื่อสาขาวิชา
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls (Left) + Canvas Preview (Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Mode Switcher */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                เลือกสัดส่วนภาพสำหรับแชร์โซเชียล:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAspectMode("story")}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    aspectMode === "story"
                      ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black border-amber-500 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-black">สัดส่วน 9:16 (สตอรี่)</div>
                  <div className="text-[10px] opacity-90 font-mono">IG, TikTok, FB Story</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectMode("feed")}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    aspectMode === "feed"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black border-cyan-500 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-black">สัดส่วน 1:1 (โพสต์ฟีด)</div>
                  <div className="text-[10px] opacity-90 font-mono">Square / LINE / Post</div>
                </button>
              </div>
            </div>

            {/* Custom Student Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                ชื่อที่ต้องการให้แสดงบนการ์ด:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="เช่น น้องบาส, นายสมชาย"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Wonderland Theme Highlights */}
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 space-y-2 text-xs">
              <div className="font-black text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>ธีม Pop Festival (ตามสไตล์ภาพที่ 2):</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">★</span>
                  <span>หัวเรื่อง 3D Bubble สีสดใส สไตล์เทศกาลเฉลิมฉลอง</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">★</span>
                  <span>ตัวการ์ตูนมาสคอต 3D โดดเด่น เป็นพระเอกกลางโปสเตอร์</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">★</span>
                  <span>กราฟใยแมงมุมตัดตัวเลขคำตอบออก แสดงเฉพาะชื่อสาขาวิชาชัดเจน</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">★</span>
                  <span>แถบเหลืองท้ายการ์ดพร้อม QR Code พอดีกรอบ ไม่ถูกตัดแน่นอน</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Download className="w-4 h-4 text-slate-950" />
                )}
                <span>ดาวน์โหลดภาพการ์ดความละเอียดสูง (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleQuickShare}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>แชร์ลงโซเชียล / ส่งทาง LINE</span>
              </button>
            </div>

            {shareSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareSuccess}</span>
              </div>
            )}
          </div>

          {/* Canvas Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-inner">
            <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>
                พรีวิวภาพจริงที่ได้ (ขนาด {aspectMode === "story" ? "9:16 สตอรี่" : "1:1 โพสต์ฟีด"})
              </span>
            </div>

            {/* ===================== WONDERLAND THEME RENDER CANVAS ===================== */}
            <div className="overflow-auto max-h-[78vh] w-full flex justify-center py-1">
              <div
                ref={cardRef}
                style={{
                  width: aspectMode === "story" ? "420px" : "480px",
                  height: aspectMode === "story" ? "746px" : "480px",
                  boxSizing: "border-box",
                }}
                className="relative bg-gradient-to-b from-amber-300 via-sky-300 to-cyan-500 text-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden select-none rounded-3xl border-4 border-white"
              >
                {/* Festive Sparkle Elements & Sunburst Background (Like Image 2) */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:18px_18px] pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-200/50 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-1/3 -left-12 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />

                {/* Hanging Festive Light Bulbs (Like Image 2!) */}
                <div className="absolute top-1 left-0 right-0 flex justify-around px-8 pointer-events-none z-20">
                  <span className="w-2.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <span className="w-2.5 h-3.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />
                  <span className="w-2.5 h-3.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
                  <span className="w-2.5 h-3.5 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" />
                  <span className="w-2.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </div>

                {/* 1. TOP HEADER: 3D BUBBLE TYPOGRAPHY & EMBLEM (LIKE IMAGE 2) */}
                <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-white p-0.5 border-2 border-amber-400 shadow-md flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl("/npc-logo.jpg")}
                        alt="NPC Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black tracking-widest text-blue-950 uppercase leading-none">
                        NAN POLYTECHNIC COLLEGE
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                        วิทยาลัยสารพัดช่างน่าน
                      </h4>
                    </div>
                  </div>

                  {/* 3D Bubble Title Tag */}
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-white text-blue-900 text-[10px] font-black border-2 border-blue-900 shadow-[0_2px_0_#1e3a8a]">
                      CAREER DISCOVERY
                    </span>
                    <div className="text-[9px] font-black text-blue-950 mt-0.5 drop-shadow-xs">
                      ปีการศึกษา 2570
                    </div>
                  </div>
                </div>

                {/* 2. 3D BANNER CALLOUT (WONDERLAND / IMAGE 2 HERO CALLOUT STYLE) */}
                <div className="relative z-10 px-4 pt-1">
                  <div className="flex items-center justify-between bg-white/90 backdrop-blur-xs p-1.5 px-3 rounded-2xl border-2 border-white shadow-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                      <span className="text-[11px] font-black text-slate-900 truncate">
                        ค้นพบตัวตน: <span className="text-blue-900 font-black">{studentName}</span>
                      </span>
                    </div>

                    <div className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs shrink-0 flex items-center gap-1">
                      <span>ตรงใจ</span>
                      <span className="text-emerald-100">{result.sortedDepartments[0]?.percentage || 100}%</span>
                    </div>
                  </div>
                </div>

                {/* 3. HERO PROGRAM BANNER (RED/CRIMSON & GOLD 3D RIBBON - LIKE "รับฟรี" IN IMAGE 2) */}
                <div className="relative z-10 px-4 pt-2">
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-2.5 px-4 shadow-[0_4px_12px_rgba(220,38,38,0.4)] border-2 border-yellow-300 relative text-center">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-400 text-red-950 text-[9px] font-black mb-1 shadow-xs uppercase">
                      {selectedCode === "20143" ? "⚡ นวัตกรรมยานยนต์ไฟฟ้า EV" : "★ สาขาที่ตรงกับศักยภาพของคุณ"}
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] tracking-tight">
                      {programName}
                    </h2>
                  </div>
                </div>

                {/* 4. CENTER SHOWCASE: 3D MASCOT + RADAR CHART WITHOUT NUMBERS */}
                <div className="relative z-10 px-4 py-1 flex-1 flex flex-col justify-center">
                  {aspectMode === "feed" ? (
                    /* 1:1 SQUARE FEED LAYOUT */
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Left: Mascot Showcase Standing on Cloud (5 cols) */}
                      <div className="col-span-5 flex flex-col items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(`/images/mascots/${mascotType}.png`)}
                          alt="3D Mascot Hero"
                          className="w-36 h-36 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] transform hover:scale-105 transition-transform"
                        />
                        <div className="w-28 h-3.5 bg-black/15 rounded-full blur-xs -mt-1" />
                      </div>

                      {/* Right: Radar Chart WITHOUT NUMBERS (7 cols) */}
                      <div className="col-span-7 bg-white/95 p-2.5 rounded-2xl border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-full scale-[0.92] -my-3">
                          <RadarChart
                            scores={result.scores}
                            maxScore={15}
                            theme="light"
                            hideScores={true}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 9:16 STORY LAYOUT */
                    <div className="space-y-2 flex flex-col items-center">
                      {/* 3D Mascot Character (Hero Position like Minions in Image 2) */}
                      <div className="flex flex-col items-center -my-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(`/images/mascots/${mascotType}.png`)}
                          alt="3D Mascot Hero"
                          className="w-36 h-36 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-transform"
                        />
                        <div className="w-28 h-3.5 bg-black/15 rounded-full blur-xs -mt-1" />
                      </div>

                      {/* Radar Chart (Clean, White card, ONLY DEPT NAMES, NO NUMBERS) */}
                      <div className="w-full bg-white/95 p-2 rounded-2xl border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-full scale-[0.88] -my-4">
                          <RadarChart
                            scores={result.scores}
                            maxScore={15}
                            theme="light"
                            hideScores={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. VIBRANT YELLOW FOOTER BANNER (LIKE IMAGE 2 BOTTOM BANNER) */}
                <div className="relative z-10 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 text-slate-950 p-2.5 px-4 flex items-center justify-between gap-2.5 border-t-2 border-yellow-200 shadow-md">
                  <div className="space-y-0.5 leading-tight flex-1">
                    <div className="font-black text-[11px] text-blue-950 flex items-center gap-1">
                      <span>วิทยาลัยสารพัดช่างน่าน</span>
                      <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black">
                        สมัครเรียน
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-800">
                      &quot;เรียนดี มีความสุข มีรายได้ระหว่างเรียน พร้อมสู่อนาคต&quot;
                    </div>
                    <div className="flex items-center gap-2 text-slate-900 text-[8px] font-black pt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5 text-blue-950" /> 054-710-259
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5 text-blue-950" /> service.npc.ac.th
                      </span>
                    </div>
                  </div>

                  {/* Clean Dynamic QR Code Box */}
                  <div className="bg-white p-1 rounded-xl shadow-md flex flex-col items-center shrink-0 border-2 border-slate-900">
                    {qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeUrl}
                        alt="QR Code รับสมัคร"
                        className="w-11 h-11 object-contain"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[7px] text-slate-950 font-black tracking-tighter mt-0.5">
                      สแกนสมัครเรียน
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
