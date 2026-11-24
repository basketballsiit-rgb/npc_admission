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
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [studentName, setStudentName] = useState("น้องผู้สมัคร");

  // QR Code Data URL
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Fluid responsive scale for 576x1024 poster preview (eliminates CSS scale/negative-margin clipping)
  const [previewScale, setPreviewScale] = useState(0.62);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [uploadedShareUrl, setUploadedShareUrl] = useState<string | null>(null);

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

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fluid responsive scale measurement for 9:16 poster preview
  useEffect(() => {
    if (!isOpen || !previewContainerRef.current) return;
    const el = previewContainerRef.current;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth > 0) {
        const targetWidth = Math.min(availableWidth, 410);
        setPreviewScale(targetWidth / 576);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

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
      setExportError(null);

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
      setExportError("ไม่สามารถสร้างไฟล์รูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  const shareApplyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${apiUrl(`/apply?level=${encodeURIComponent(selectedLevel)}&code=${encodeURIComponent(selectedCode)}`)}`
      : `https://service.npc.ac.th/npc_admission/apply?level=${encodeURIComponent(selectedLevel)}&code=${encodeURIComponent(selectedCode)}`;

  const lineShareText = `ผลแนะแนวของ ${studentName}: เหมาะกับ "${programName}" วิทยาลัยสารพัดช่างน่าน (ตรงใจ ${topScorePct}%)`;
  const effectiveLineShareTarget = uploadedShareUrl || shareApplyUrl;
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(effectiveLineShareTarget)}&text=${encodeURIComponent(lineShareText)}`;

  // Web Share API (Mobile Native) + Server OG Card Upload + Clipboard/LINE Share (Desktop)
  const handleQuickShare = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      setShareSuccess(null);
      setExportError(null);

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

      // Only invoke navigator.share with files on mobile devices; Windows desktop Chrome/Edge
      // frequently opens an empty Windows Share Sheet that silently resolves without sharing.
      const isMobileDevice =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (
        isMobileDevice &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `ผลการค้นพบสายอาชีพที่ใช่ - ${programName}`,
          text: lineShareText,
          files: [file],
        });
        recordShareAction();
        setShareSuccess("แชร์รูปภาพสำเร็จ!");
        return;
      }

      // Desktop path:
      // 1) Upload generated PNG to server so LINE crawler displays the actual card image via og:image
      let hostedShareUrl: string | null = null;
      try {
        const uploadRes = await fetch(apiUrl("/api/guidance/card-image"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl: dataUrl,
            studentName,
            programName,
            topScorePct,
            selectedLevel,
            selectedCode,
          }),
        });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.success && uploadJson.sharePath) {
          const origin =
            typeof window !== "undefined"
              ? window.location.origin
              : "https://service.npc.ac.th";
          hostedShareUrl = `${origin}${apiUrl(uploadJson.sharePath)}`;
          setUploadedShareUrl(hostedShareUrl);
        }
      } catch (uploadErr) {
        console.warn("Could not upload card for OG preview:", uploadErr);
      }

      // 2) Copy PNG image to clipboard so user can also Ctrl+V directly into LINE PC chat
      let copiedToClipboard = false;
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof ClipboardItem !== "undefined"
      ) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          copiedToClipboard = true;
        } catch (clipErr) {
          console.warn("Clipboard image copy unavailable:", clipErr);
        }
      }

      // 3) Save PNG file as backup
      const link = document.createElement("a");
      link.download = `npc-career-card-${selectedCode}.png`;
      link.href = dataUrl;
      link.click();

      recordShareAction();
      setShareSuccess(
        hostedShareUrl
          ? copiedToClipboard
            ? "สร้างลิงก์แชร์พร้อมรูปการ์ดแล้ว! กดปุ่มสีเขียวด้านล่างเพื่อแชร์เข้า LINE หรือกด Ctrl + V วางรูปในแชท LINE PC ได้ทันที"
            : "สร้างลิงก์แชร์พร้อมรูปการ์ดและบันทึกไฟล์ .PNG แล้ว! กดปุ่มสีเขียวด้านล่างเพื่อแชร์การ์ดภาพเข้า LINE ได้ทันที"
          : copiedToClipboard
          ? "คัดลอกรูปการ์ดและบันทึกไฟล์ .PNG แล้ว — กด Ctrl + V เพื่อวางส่งในแชท LINE PC ได้ทันที"
          : "บันทึกไฟล์รูปการ์ด .PNG เรียบร้อยแล้ว — สามารถลากไฟล์ส่งเข้าแชท LINE ได้ทันที"
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Share failed:", err);
        setExportError("ไม่สามารถแชร์รูปภาพได้ กรุณากดปุ่มดาวน์โหลดรูปภาพ (.PNG) แทน");
      }
    } finally {
      setExporting(false);
    }
  };

  const scaledWidth = Math.round(576 * previewScale);
  const scaledHeight = Math.round(1024 * previewScale);
  const isLongProgramName = programName.length > 26;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 id="share-card-modal-title" className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                การ์ดผลลัพธ์แนะแนว (พร้อมกดแชร์ได้ทันที)
              </h3>
              <p className="text-xs text-slate-600 leading-snug">
                ขนาดมาตรฐานสากล โลโก้คมชัด ข้อมูลด้านล่างและ QR Code แสดงครบถ้วน 100%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition cursor-pointer"
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
              <label htmlFor="share-card-student-name" className="block text-xs font-bold text-slate-700">
                ชื่อที่ต้องการให้แสดงบนการ์ด:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  id="share-card-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setUploadedShareUrl(null);
                  }}
                  placeholder="เช่น น้องบาส, นายสมชาย"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 bg-white"
                />
              </div>
            </div>

            {/* Action Buttons: Clear Primary vs Secondary Hierarchy */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleQuickShare}
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#1E3A8A] hover:bg-[#172e6e] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Share2 className="w-4 h-4 text-amber-300" />
                )}
                <span>แชร์รูปภาพทันที (LINE / โซเชียล)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-[#1E3A8A] border-2 border-[#1E3A8A]/25 hover:border-[#1E3A8A]/50 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-[#1E3A8A]" />
                <span>ดาวน์โหลดรูปภาพ (.PNG)</span>
              </button>
            </div>

            {shareSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{shareSuccess}</span>
                </div>
                <a
                  href={lineShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>แชร์การ์ดภาพนี้เข้า LINE</span>
                </a>
              </div>
            )}

            {exportError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium rounded-xl flex items-center gap-2 animate-fadeIn">
                <span className="font-bold text-rose-600 shrink-0">!</span>
                <span>{exportError}</span>
              </div>
            )}

            {/* Personalized Assessment Result & Insights */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 border-b border-amber-200/80 pb-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#1E3A8A] text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    ทำไมคุณจึงเหมาะกับสาขาวิชานี้?
                  </h4>
                  <p className="text-xs text-slate-600 leading-snug">
                    วิเคราะห์เจาะลึกจากผลการทำแบบทดสอบค้นหาตัวตนของคุณ
                  </p>
                </div>
              </div>

              {/* Top Score & Match */}
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700 text-xs">
                    ความถนัดเด่นอันดับ 1:
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs shrink-0 tabular-nums">
                    ตรงใจ {topScorePct}%
                  </span>
                </div>
                <div className="text-[#1E3A8A] font-bold text-sm leading-snug">
                  {topDept.name} ({topScore}/15 คะแนน)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  สไตล์การเรียนรู้: <span className="font-bold text-slate-900">{result.trackTitle}</span> — คำตอบของคุณสะท้อนความสนใจในภาคปฏิบัติและทักษะเฉพาะทางที่สอดคล้องกับสาขานี้โดยตรง
                </p>
              </div>

              {/* Key Strengths */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>จุดเด่นและศักยภาพที่คุณจะได้รับการพัฒนา:</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {programStrengths.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Future Careers */}
              <div className="space-y-1.5 pt-2 border-t border-amber-200/70">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                  <span>เส้นทางอาชีพและโอกาสในอนาคต:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {programCareers.slice(0, 3).map((career, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E3A8A] font-semibold text-xs border border-blue-200/80 leading-snug"
                    >
                      • {career}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 p-3 sm:p-5 rounded-3xl border border-slate-700 shadow-inner overflow-hidden">
            <div className="text-xs font-semibold text-amber-300 mb-3 flex items-center gap-2 text-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>
                พรีวิวภาพการ์ดขนาด 9:16 (พร้อมกดแชร์และดาวน์โหลดความละเอียดสูง)
              </span>
            </div>

            {/* ===================== FLUID RESPONSIVE 9:16 POSTER WRAPPER ===================== */}
            <div
              ref={previewContainerRef}
              className="w-full flex justify-center overflow-hidden"
            >
              <div
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  position: "relative",
                }}
                className="shrink-0 overflow-hidden rounded-2xl shadow-2xl"
              >
                <div
                  style={{
                    width: "576px",
                    height: "1024px",
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    ref={cardRef}
                    style={{
                      width: "576px",
                      height: "1024px",
                      boxSizing: "border-box",
                    }}
                    className="relative text-white overflow-hidden select-none rounded-3xl bg-[#0c2411] border-4 border-amber-300/35 shrink-0"
                  >
                    {/* 1. Base Poster Template Image (Clean Backdrop WITH original crystal-clear 3D 'น้องสู่เส้นทางอนาคต', NO old boy/hands/dummy QR) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl("/images/card-elements/career-poster-clean-bg.jpg")}
                      alt="Career Poster Template"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                    />

                    {/* 2. DYNAMIC GOLDEN CAPSULE: Major / Program Name (Adaptive wrapping, never truncated) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "214px",
                        left: "24px",
                        width: "528px",
                        minHeight: "64px",
                      }}
                      className="z-30 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-full min-h-[64px] py-2 px-5 rounded-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 border-2 border-amber-100 shadow-[0_6px_18px_rgba(120,53,15,0.35)] flex flex-col items-center justify-center">
                        {studentName && studentName !== "น้องผู้สมัคร" && (
                          <span className="text-xs font-bold text-[#1E3A8A] mb-0.5 tracking-normal leading-tight">
                            ผลลัพธ์ของ: {studentName}
                          </span>
                        )}
                        <h2
                          className={`text-[#1e1b4b] font-extrabold tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] text-center leading-tight break-words ${
                            isLongProgramName ? "text-lg" : "text-xl sm:text-2xl"
                          }`}
                        >
                          ด้วย {programName}
                        </h2>
                      </div>
                    </div>

                    {/* 3. DYNAMIC 3D MASCOT HERO (Replaces original character, transparent PNG, gesturing toward screen) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "255px",
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
                        className="w-full h-full object-contain object-bottom drop-shadow-[0_14px_22px_rgba(0,0,0,0.75)] filter"
                      />
                      {/* Mascot Department Badge */}
                      <div className="absolute bottom-2 left-5 bg-[#0f172a]/92 py-1 px-3 rounded-full border border-amber-300/75 shadow-md">
                        <span className="text-xs font-bold text-amber-200 tracking-normal leading-none">
                          ★ ตัวแทน {topDept.shortName}
                        </span>
                      </div>
                    </div>

                    {/* 4. COLLEGE ANALYTICS TABLET SCREEN (Dignified Navy & Gold Institutional Palette) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "278px",
                        left: "232px",
                        width: "328px",
                        height: "380px",
                      }}
                      className="z-20 rounded-3xl overflow-hidden bg-gradient-to-b from-[#0f2557]/96 via-[#0b1b3d]/96 to-[#08132b]/96 border-2 border-amber-300/75 shadow-[0_12px_28px_rgba(0,0,0,0.45)] flex flex-col justify-between p-2.5"
                    >
                      {/* Tablet Top Bar */}
                      <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-amber-300/25">
                        <span className="text-[11px] font-bold text-amber-200 tracking-tight">
                          ผลวิเคราะห์ความถนัด 6 แผนก
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-400/40 px-2 py-0.5 rounded-full tabular-nums">
                          ตรงใจ {topScorePct}%
                        </span>
                      </div>

                      {/* Tablet Screen: Native Radar Chart */}
                      <div className="relative flex-1 flex items-center justify-center overflow-hidden py-1">
                        <RadarChart
                          scores={result.scores}
                          maxScore={15}
                          theme="cyber"
                          hideScores={true}
                          hideHint={true}
                          containerClassName="w-full h-full"
                        />
                      </div>

                      {/* Tablet Bottom Bar */}
                      <div className="px-2.5 py-1.5 bg-[#0f2557]/85 border border-amber-300/30 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="text-white font-bold truncate">
                          อันดับ 1: {topDept.shortName}
                        </span>
                        <span className="text-amber-300 font-mono font-bold shrink-0 ml-1.5 tabular-nums">
                          {topScore}/15 คะแนน
                        </span>
                      </div>
                    </div>

                    {/* 5. DYNAMIC QR CODE OVERLAY (Fits and overlays the original card with pixel-perfect precision) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "864px",
                        left: "450px",
                        width: "109px",
                        height: "131px",
                        borderRadius: "14px",
                      }}
                      className="z-30 bg-white border-2 border-slate-900 rounded-[14px] shadow-sm flex flex-col items-center justify-between p-1.5 pointer-events-none select-none overflow-hidden"
                    >
                      <div className="w-[96px] h-[96px] bg-white flex items-center justify-center">
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
                      <span className="text-[#0f172a] font-bold text-[9px] text-center tracking-tight leading-none pb-0.5">
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
    </div>
  );
}
