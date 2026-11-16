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
  Star,
  MapPin,
  Briefcase,
  Target,
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

  // Resolve active program name and personalized strengths/careers
  let programName = selectedLevel === "ปวช." ? topDept.pvc.name : topDept.pvs.name;
  let programStrengths =
    selectedLevel === "ปวช."
      ? topDept.pvc.strengths || topDept.strengths
      : topDept.strengths;
  let programCareers =
    selectedLevel === "ปวช."
      ? topDept.pvc.futureCareers || topDept.futureCareers
      : topDept.futureCareers;

  if (selectedLevel === "ปวช." && selectedCode === "20143") {
    programName = "สาขาวิชายานยนต์ไฟฟ้า";
    if (topDept.alternativePvc && topDept.alternativePvc[0]) {
      programStrengths = topDept.alternativePvc[0].strengths || programStrengths;
      programCareers = topDept.alternativePvc[0].futureCareers || programCareers;
    }
  }

  const topScore = result.scores[result.top1] || 0;
  const topScorePct = Math.round((topScore / 15) * 100);

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
        pixelRatio: 2,
        backgroundColor: "#0c2411",
      });

      const link = document.createElement("a");
      link.download = `npc-career-card-${selectedCode}.png`;
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
        pixelRatio: 2,
        backgroundColor: "#0c2411",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `npc-career-card-${selectedCode}.png`, {
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
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                การ์ดผลลัพธ์แนะแนว (พร้อมกดแชร์ได้ทันที)
              </h3>
              <p className="text-[11px] text-slate-600">
                ขนาดมาตรฐานสากล โลโก้คมชัด ข้อมูลด้านล่างและ QR Code แสดงครบถ้วน 100%
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
            {/* Custom Student Name Input */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleQuickShare}
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-950" />
                <span>แชร์รูปภาพทันที (LINE / โซเชียล)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:brightness-105 text-white font-bold text-xs shadow-xs hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>ดาวน์โหลดรูปภาพ (.PNG)</span>
              </button>
            </div>

            {shareSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareSuccess}</span>
              </div>
            )}

            {/* Personalized Assessment Result & Insights */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border-2 border-amber-300/80 space-y-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-amber-950 text-xs">
                    ทำไมคุณจึงเหมาะกับสาขาวิชานี้?
                  </h4>
                  <p className="text-[10px] text-amber-800/80 font-medium">
                    วิเคราะห์เจาะลึกจากผลการทำแบบทดสอบค้นหาตัวตนของคุณ
                  </p>
                </div>
              </div>

              {/* Top Score & Match */}
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px]">
                    ความถนัดเด่นอันดับ 1:
                  </span>
                  <span className="font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full text-[10px]">
                    ตรงใจ {topScorePct}%
                  </span>
                </div>
                <div className="text-blue-950 font-black text-xs">
                  {topDept.name} ({topScore}/15 คะแนน)
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  สไตล์การเรียนรู้: <span className="font-bold text-amber-900">{result.trackTitle}</span> — คำตอบของคุณสะท้อนความสนใจในภาคปฏิบัติและทักษะเฉพาะทางที่สอดคล้องกับสาขานี้โดยตรง
                </p>
              </div>

              {/* Key Strengths */}
              <div className="space-y-1.5">
                <div className="font-black text-slate-800 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>จุดเด่นและศักยภาพที่คุณจะได้รับการพัฒนา:</span>
                </div>
                <ul className="space-y-1 pl-1">
                  {programStrengths.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                      <span className="text-emerald-600 font-black shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Future Careers */}
              <div className="space-y-1.5 pt-1 border-t border-amber-200/60">
                <div className="font-black text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>เส้นทางอาชีพและโอกาสในอนาคต:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {programCareers.slice(0, 3).map((career, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-[10px] border border-blue-200/70"
                    >
                      • {career}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/90 p-3 sm:p-5 rounded-3xl border border-slate-700 shadow-inner overflow-hidden">
            <div className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                พรีวิวภาพการ์ดตามสไตล์แบบที่ 1 (ขนาด 9:16 พร้อมกดแชร์และดาวน์โหลด)
              </span>
            </div>

            {/* ===================== CAREER POSTER 9:16 CANVAS ===================== */}
            <div className="overflow-y-auto max-h-[76vh] w-full flex justify-center py-2">
              <div className="transform scale-[0.62] sm:scale-[0.70] md:scale-[0.78] origin-top my-[-180px] sm:my-[-140px] md:my-[-90px]">
                <div
                  ref={cardRef}
                  style={{
                    width: "576px",
                    height: "1024px",
                    boxSizing: "border-box",
                  }}
                  className="relative text-white shadow-2xl overflow-hidden select-none rounded-3xl bg-[#0c2411] border-4 border-emerald-400/30 shrink-0"
                >
                  {/* 1. Base Poster Template Image (Clean Backdrop WITHOUT old boy/hands/dummy QR) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl("/images/card-elements/career-poster-clean-bg.jpg")}
                    alt="Career Poster Template"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                  />

                  {/* 2. PROMINENT 3D TITLE: 'น้องสู่เส้นทางอนาคต' (Original 3D Graphic Typography) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "144px",
                      left: "0",
                      width: "576px",
                      height: "56px",
                    }}
                    className="z-30 pointer-events-none flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl("/images/card-elements/future_path_title_3d.png")}
                      alt="น้องสู่เส้นทางอนาคต"
                      className="h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] filter"
                    />
                  </div>

                  {/* 3. DYNAMIC GOLDEN CAPSULE: Major / Program Name */}
                  <div
                    style={{
                      position: "absolute",
                      top: "200px",
                      left: "24px",
                      width: "528px",
                      height: "64px",
                    }}
                    className="z-30 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 border-2 border-yellow-100 shadow-[0_0_24px_rgba(250,204,21,0.95)] flex flex-col items-center justify-center px-4 leading-none">
                      {studentName && studentName !== "น้องผู้สมัคร" && (
                        <span className="text-[10px] font-black text-blue-950/80 mb-0.5 tracking-wider">
                          ผลลัพธ์ของ: {studentName}
                        </span>
                      )}
                      <h2 className="text-[#1e1b4b] font-black text-xl sm:text-2xl tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] text-center truncate">
                        ด้วย {programName}
                      </h2>
                    </div>
                  </div>

                  {/* 4. DYNAMIC 3D MASCOT HERO (Replaces original character, transparent PNG, gesturing toward screen) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "240px",
                      left: "-4px",
                      width: "275px",
                      height: "415px",
                    }}
                    className="z-22 pointer-events-none flex flex-col items-center justify-end"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(`/images/mascots/${mascotType}_transparent.png`)}
                      alt={`Mascot ${topDept.name}`}
                      className="w-full h-full object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)] filter"
                    />
                    {/* Mascot Department Badge */}
                    <div className="absolute bottom-2 left-6 bg-slate-950/90 backdrop-blur-xs py-1 px-3 rounded-full border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                      <span className="text-[10px] font-black text-cyan-300 tracking-wider">
                        ★ ตัวแทน {topDept.shortName}
                      </span>
                    </div>
                  </div>

                  {/* 5. FUTURISTIC CYBER TABLET SCREEN (Containing Radar Chart as Native Display) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "265px",
                      left: "232px",
                      width: "328px",
                      height: "385px",
                    }}
                    className="z-20 rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a1e3f]/95 via-[#071329]/95 to-[#040b18]/95 border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.45)] backdrop-blur-md flex flex-col justify-between p-2.5"
                  >
                    {/* Cyber Tablet Top Bar */}
                    <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-cyan-500/30">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                        <span className="text-[9px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                          CAREER RADAR ANALYTICS
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
                        MATCH {topScorePct}%
                      </span>
                    </div>

                    {/* Cyber Tablet Screen: Native Radar Chart */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden py-1">
                      {/* Cyber screen grid and corner accents */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      <div className="absolute top-1 left-1 text-cyan-400/60 font-mono text-[9px] pointer-events-none">┌</div>
                      <div className="absolute top-1 right-1 text-cyan-400/60 font-mono text-[9px] pointer-events-none">┐</div>
                      <div className="absolute bottom-1 left-1 text-cyan-400/60 font-mono text-[9px] pointer-events-none">└</div>
                      <div className="absolute bottom-1 right-1 text-cyan-400/60 font-mono text-[9px] pointer-events-none">┘</div>

                      <RadarChart
                        scores={result.scores}
                        maxScore={15}
                        theme="cyber"
                        hideScores={true}
                        hideHint={true}
                        containerClassName="w-full h-full"
                      />
                    </div>

                    {/* Cyber Tablet Bottom Bar */}
                    <div className="px-2 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-xl flex items-center justify-between text-[9px]">
                      <span className="text-cyan-200 font-bold truncate">
                        อันดับ 1: {topDept.shortName}
                      </span>
                      <span className="text-amber-300 font-mono font-bold shrink-0 ml-1">
                        {topScore}/15 คะแนน
                      </span>
                    </div>
                  </div>

                  {/* 6. DYNAMIC QR CODE CARD OVERLAY (Real official admission link, old dummy QR completely gone) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "828px",
                      left: "426px",
                      width: "134px",
                      height: "148px",
                    }}
                    className="z-30 rounded-2xl bg-white border-2 border-amber-400 shadow-xl flex flex-col items-center justify-between p-1.5 overflow-hidden"
                  >
                    <div className="w-full bg-[#1e3a8a] text-amber-300 font-black text-[9px] py-0.5 rounded-lg text-center tracking-wide shadow-xs">
                      สแกนสมัครทันที
                    </div>
                    <div className="w-[100px] h-[100px] bg-white flex items-center justify-center p-0.5">
                      {qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeUrl}
                          alt="QR Code รับสมัครเรียน วิทยาลัยสารพัดช่างน่าน"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                      )}
                    </div>
                    <span className="text-[#0f172a] font-black text-[8px] text-center tracking-tight">
                      วิทยาลัยสารพัดช่างน่าน
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
