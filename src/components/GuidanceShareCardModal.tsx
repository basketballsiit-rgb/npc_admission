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

      // Render at pixelRatio 2.5 for crisp social media resolution
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#090D16",
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
        backgroundColor: "#090D16",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `npc-career-${selectedCode}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ผลการประเมินค้นหาตัวตน - ${programName}`,
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
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                การ์ดแชร์ผลลัพธ์ภาพพื้นหลัง 3D สำหรับโซเชียลมีเดีย
              </h3>
              <p className="text-[11px] text-slate-500">
                สัดส่วนมาตรฐาน พร้อมตัวการ์ตูน 3D คมชัด และ Dynamic QR Code สำหรับแชร์ Story / Feed
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
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                เลือกสัดส่วนภาพสำหรับโซเชียล:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAspectMode("story")}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    aspectMode === "story"
                      ? "bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-transparent shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-black">โหมดสตอรี่ / Reels</div>
                  <div className="text-[10px] opacity-90 font-mono">9:16 (IG, TikTok, Story)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectMode("feed")}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    aspectMode === "feed"
                      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-black">โหมดโพสต์ฟีด</div>
                  <div className="text-[10px] opacity-90 font-mono">1:1 (Square / LINE / Feed)</div>
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

            {/* Features Highlight */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2 text-xs">
              <div className="font-black text-[#1E3A8A] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>การ์ดผลลัพธ์ได้รับการปรับปรุงใหม่:</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ใช้ภาพการ์ตูน 3D คาแรกเตอร์ขนาดใหญ่เป็นพื้นหลัง</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ชื่อสาขาวิชาตัวใหญ่ ชัดเจน อ่านง่าย ไม่แสดงรหัสสาขาและระดับชั้น</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>เอารายการค่าใช้จ่ายออก เพื่อให้ภาพสะอาด เหมาะสำหรับแชร์โซเชียล</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ตัวหนังสือบนกราฟใยแมงมุมสว่าง คมชัด ไม่กลืนกับพื้นหลัง</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>พื้นที่ด้านล่างและ QR Code มีระยะขอบปลอดภัย ไม่ถูกตัดแน่นอน</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-blue-800 hover:from-blue-900 hover:to-indigo-900 text-white font-black text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>บันทึกรูปภาพความละเอียดสูง (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleQuickShare}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>แชร์ลงโซเชียล / ส่ง LINE ด่วน</span>
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
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/95 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-inner">
            <div className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                พรีวิวการ์ดจริงที่จะถูกบันทึก (ขนาด {aspectMode === "story" ? "9:16 สตอรี่" : "1:1 โพสต์ฟีด"})
              </span>
            </div>

            {/* ===================== RENDER CANVAS CONTAINER ===================== */}
            <div className="overflow-auto max-h-[75vh] w-full flex justify-center py-2">
              <div
                ref={cardRef}
                style={{
                  width: aspectMode === "story" ? "380px" : "420px",
                  height: aspectMode === "story" ? "675px" : "420px",
                  boxSizing: "border-box",
                }}
                className="relative text-white p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden select-none rounded-3xl bg-slate-950 border border-white/20"
              >
                {/* 1. CARTOON MASCOT 3D BACKGROUND */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
                  style={{
                    backgroundImage: `url(${assetUrl(`/images/mascots/${mascotType}.png`)})`,
                    filter: "brightness(0.55) contrast(1.15) saturate(1.2)",
                  }}
                />

                {/* 2. GRADIENT OVERLAYS (FOR CRYSTAL CLEAR TEXT CONTRAST) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* 3. HEADER: COLLEGE BRANDING */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white p-0.5 border-2 border-amber-400 shadow-md overflow-hidden flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl("/npc-logo.jpg")}
                        alt="NPC Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest leading-none drop-shadow-sm">
                        NAN POLYTECHNIC COLLEGE
                      </div>
                      <h4 className="text-sm font-black text-white leading-tight mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        วิทยาลัยสารพัดช่างน่าน
                      </h4>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/25 text-amber-300 text-[9px] font-black border border-amber-400/40 backdrop-blur-xs">
                      CAREER DISCOVERY
                    </span>
                    <div className="text-[9px] text-slate-300 font-medium mt-0.5">
                      ปีการศึกษา 2570
                    </div>
                  </div>
                </div>

                {/* 4. CANDIDATE PROFILE & PROGRAM HIGHLIGHT */}
                <div className="relative z-10 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        ผลการค้นพบสายอาชีพที่ใช่ของ:
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-amber-400 leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                        {studentName}
                      </h3>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[11px] font-black text-emerald-300 shadow-xs">
                      ความสอดคล้อง {result.sortedDepartments[0]?.percentage || 100}%
                    </div>
                  </div>

                  {/* PROGRAM CARD (NO CODE, NO LEVEL, ULTRA-CLEAR BIG TYPOGRAPHY) */}
                  <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 shadow-lg space-y-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] shadow-xs">
                      {selectedCode === "20143" ? (
                        <>
                          <span>⚡</span>
                          <span>สาขาวิชาเด่นแห่งอนาคต / EV Tech</span>
                        </>
                      ) : (
                        <>
                          <span>★</span>
                          <span>สาขาวิชาที่ตรงกับศักยภาพของคุณ</span>
                        </>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                      {programName}
                    </h2>
                  </div>
                </div>

                {/* 5. CENTER: RADAR CHART (HIGH-CONTRAST DARK THEME) */}
                <div className="relative z-10 py-1 flex items-center justify-center">
                  <div
                    className={
                      aspectMode === "story"
                        ? "scale-[0.88] -my-4 w-full flex justify-center"
                        : "scale-[0.78] -my-7 w-full flex justify-center"
                    }
                  >
                    <RadarChart scores={result.scores} maxScore={15} theme="dark" />
                  </div>
                </div>

                {/* 6. CAREER PATHWAYS (IN STORY MODE) */}
                {aspectMode === "story" && (
                  <div className="relative z-10 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[10px] space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      <span>เส้นทางอาชีพและโอกาสในอนาคต:</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium line-clamp-2">
                      {topDept.futureCareers.slice(0, 3).join(" • ")}
                    </p>
                  </div>
                )}

                {/* 7. SAFE-MARGIN FOOTER (PR & DYNAMIC QR CODE - NEVER CUT OFF!) */}
                <div className="relative z-10 pt-2.5 pb-1 border-t border-white/20 flex items-center justify-between gap-3 text-[9px] text-slate-200">
                  <div className="space-y-0.5 leading-tight flex-1">
                    <div className="text-amber-300 font-bold text-[10px] drop-shadow-sm">
                      &quot;เรียนดี มีทักษะ มีงานทำ พร้อมสู่อนาคต&quot;
                    </div>
                    <div className="text-slate-300 font-medium">
                      วิทยาลัยสารพัดช่างน่าน จ.น่าน
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[8px]">
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5 text-slate-400" /> 054-710-259
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5 text-slate-400" /> service.npc.ac.th
                      </span>
                    </div>
                  </div>

                  {/* Dynamic QR Code Badge */}
                  <div className="bg-white p-1 rounded-xl shadow-lg flex flex-col items-center shrink-0 border border-white">
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
                    <span className="text-[7px] text-slate-900 font-black tracking-tight mt-0.5">
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
