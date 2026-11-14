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
  GraduationCap,
  Award,
  Briefcase,
  Check,
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
        backgroundColor: "#F8FAFC",
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
        backgroundColor: "#F8FAFC",
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
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                สร้างการ์ดผลลัพธ์สไตล์ Infographic โปสเตอร์ประชาสัมพันธ์
              </h3>
              <p className="text-[11px] text-slate-500">
                ดีไซน์สว่าง คมชัด มาตรฐานสัดส่วน 1:1 และ 9:16 พร้อมมาสคอต 3D และ Dynamic QR Code
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
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-sm"
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
                      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm"
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Infographic Theme Highlights */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <div className="font-black text-emerald-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>การจัดวางในธีมโปสเตอร์ Infographic สดใส:</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>หัวเรื่องสไตล์โปสเตอร์ 3D นูน สีสด พร้อมมาสคอตยืนทักทาย</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ชื่อสาขาวิชาตัวใหญ่ ชัดเจน อ่านง่ายมาก ไม่ระบุรหัสและระดับชั้น</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>กราฟใยแมงมุมพื้นหลังขาวสะอาด ตัวหนังสือสีเข้ม คมชัด 100%</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>พื้นที่ท้ายการ์ดและ Dynamic QR Code พอดีกรอบ ไม่ถูกตัดขาด</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-[#1E3A8A] hover:brightness-110 text-white font-black text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>ดาวน์โหลดภาพการ์ดความละเอียดสูง (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleQuickShare}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-200/70 p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-inner">
            <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                พรีวิวภาพจริงที่ได้ (ขนาด {aspectMode === "story" ? "9:16 สตอรี่" : "1:1 โพสต์ฟีด"})
              </span>
            </div>

            {/* ===================== INFOGRAPHIC RENDER CANVAS CONTAINER ===================== */}
            <div className="overflow-auto max-h-[78vh] w-full flex justify-center py-1">
              <div
                ref={cardRef}
                style={{
                  width: aspectMode === "story" ? "420px" : "480px",
                  height: aspectMode === "story" ? "746px" : "480px",
                  boxSizing: "border-box",
                }}
                className="relative bg-gradient-to-b from-sky-50 via-white to-amber-50/30 text-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden select-none rounded-3xl border-4 border-white ring-1 ring-slate-200"
              >
                {/* 1. TOP HEADER BANNER (THEME: BRIGHT THAI INFOGRAPHIC POSTER) */}
                <div className="relative z-10 bg-gradient-to-r from-emerald-600 via-teal-700 to-[#1E3A8A] text-white p-3.5 px-4 shadow-md flex items-center justify-between overflow-hidden">
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
                  
                  <div className="relative z-10 flex items-center gap-2.5">
                    {/* Official NPC Emblem with Golden Ring */}
                    <div className="w-11 h-11 rounded-full bg-white p-0.5 border-2 border-amber-300 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl("/npc-logo.jpg")}
                        alt="NPC Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[9px] font-black tracking-widest text-amber-300 uppercase">
                        NAN POLYTECHNIC COLLEGE
                      </div>
                      <h1 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                        วิทยาลัยสารพัดช่างน่าน
                      </h1>
                      <div className="text-[10px] text-emerald-100 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                          CAREER QUIZ
                        </span>
                        <span>ค้นพบสาขาที่ใช่สู่อนาคต ปี 2570</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Mascot Character Greeting at Top Right (Like Image 2!) */}
                  <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(`/images/mascots/${mascotType}.png`)}
                      alt="Mascot Avatar"
                      className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] -my-2 transform hover:scale-105 transition-transform"
                    />
                  </div>
                </div>

                {/* 2. CANDIDATE PROFILE & MATCH PILL */}
                <div className="relative z-10 px-4 pt-2.5">
                  <div className="bg-white/95 rounded-2xl p-2 px-3 shadow-xs border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <div className="truncate">
                        <div className="text-[10px] text-slate-500 font-medium">ผลการค้นพบสายอาชีพของ:</div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {studentName}
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black shadow-xs shrink-0 flex items-center gap-1">
                      <span>ตรงกับความถนัด</span>
                      <span className="text-amber-100">{result.sortedDepartments[0]?.percentage || 100}%</span>
                    </div>
                  </div>
                </div>

                {/* 3. HERO RECOMMENDATION CARD (BIG BOLD PROGRAM TITLE, NO CODE, NO LEVEL) */}
                <div className="relative z-10 px-4 pt-2">
                  <div className="bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-950 text-white rounded-2xl p-3 px-4 shadow-md border-2 border-amber-300 relative overflow-hidden">
                    {/* Decorative shimmer */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-xs">
                        {selectedCode === "20143" ? "⚡ นวัตกรรมยานยนต์ไฟฟ้า EV" : "★ สาขาที่ตรงกับศักยภาพของคุณ"}
                      </span>
                      <span className="text-[10px] text-amber-200 font-bold">
                        แนะนำอันดับ 1
                      </span>
                    </div>

                    <h2 className="relative z-10 text-lg sm:text-xl font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] tracking-tight">
                      {programName}
                    </h2>
                  </div>
                </div>

                {/* 4. CENTER CONTENT (RADAR CHART & DETAIL CARDS) */}
                <div className="relative z-10 px-4 py-1 flex-1 flex flex-col justify-center">
                  {aspectMode === "feed" ? (
                    /* 1:1 SQUARE FEED LAYOUT: SIDE-BY-SIDE OR COMPACT INFOGRAPHIC */
                    <div className="grid grid-cols-12 gap-2.5 items-center">
                      {/* Left: Radar Chart (7 cols) */}
                      <div className="col-span-7 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
                        <div className="w-full scale-[0.88] -my-3">
                          <RadarChart scores={result.scores} maxScore={15} theme="light" />
                        </div>
                      </div>

                      {/* Right: Infographic Career & Strengths (5 cols) */}
                      <div className="col-span-5 space-y-1.5">
                        <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl text-[10px] space-y-1">
                          <div className="font-black text-emerald-900 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-emerald-700" />
                            <span>เส้นทางอาชีพ:</span>
                          </div>
                          <ul className="text-slate-700 space-y-0.5 font-medium leading-tight">
                            {topDept.futureCareers.slice(0, 2).map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span className="truncate">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50/90 border border-amber-200 p-2.5 rounded-xl text-[10px] space-y-1">
                          <div className="font-black text-amber-900 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-amber-700" />
                            <span>จุดเด่นสาขา:</span>
                          </div>
                          <p className="text-slate-700 leading-tight font-medium text-[9px]">
                            เรียนรู้ปฏิบัติจริง 100% พร้อมอุปกรณ์มาตรฐานสากล
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 9:16 STORY LAYOUT: STACKED INFOGRAPHIC POSTER (LIKE IMAGE 2) */
                    <div className="space-y-2">
                      {/* Radar Chart Card */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                        <div className="w-full scale-[0.92] -my-3">
                          <RadarChart scores={result.scores} maxScore={15} theme="light" />
                        </div>
                      </div>

                      {/* 2 Infographic Cards (Like 01-05 in Image 2) */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Card 1: Careers */}
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-xs space-y-1 text-[10px]">
                          <div className="font-black text-emerald-800 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                              01
                            </span>
                            <span>เส้นทางอาชีพในอนาคต</span>
                          </div>
                          <ul className="text-slate-700 space-y-0.5 text-[9px] leading-tight font-medium">
                            {topDept.futureCareers.slice(0, 3).map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span className="truncate">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Card 2: Strengths */}
                        <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-xs space-y-1 text-[10px]">
                          <div className="font-black text-blue-800 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                              02
                            </span>
                            <span>จุดเด่นที่คุณจะได้รับ</span>
                          </div>
                          <ul className="text-slate-700 space-y-0.5 text-[9px] leading-tight font-medium">
                            {topDept.strengths.slice(0, 3).map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-600 font-bold">✓</span>
                                <span className="truncate">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. INFOGRAPHIC FOOTER BAR (PROPORTION SAFE & NEVER CUT OFF!) */}
                <div className="relative z-10 bg-slate-900 text-white p-3 px-4 flex items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-0.5 leading-tight flex-1">
                    <div className="text-amber-300 font-black text-[10px] flex items-center gap-1">
                      <span>&quot;เรียนดี มีความสุข มีรายได้ระหว่างเรียน&quot;</span>
                    </div>
                    <div className="text-slate-300 text-[9px] font-medium">
                      วิทยาลัยสารพัดช่างน่าน • 150 ถ.สุมนเทวราช อ.เมือง จ.น่าน
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[8px] pt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5 text-amber-400" /> 054-710-259
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5 text-amber-400" /> service.npc.ac.th
                      </span>
                    </div>
                  </div>

                  {/* Clean Dynamic QR Code Box */}
                  <div className="bg-white p-1 rounded-xl shadow-md flex flex-col items-center shrink-0 border border-slate-200">
                    {qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeUrl}
                        alt="QR Code รับสมัคร"
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[7px] text-slate-900 font-black tracking-tighter mt-0.5">
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
