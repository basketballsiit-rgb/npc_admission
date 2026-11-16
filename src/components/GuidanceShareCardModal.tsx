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

            {/* Checklist */}
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-1.5 text-xs">
              <div className="font-black text-amber-950">จุดเด่นของการ์ดรูปภาพนี้:</div>
              <ul className="text-slate-700 space-y-1 text-[11px] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ดีไซน์โปสเตอร์ระดับพรีเมียม สไตล์ 3D Career Quiz ตามแบบตัวอย่าง</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ตัวการ์ตูนมาสคอต 3D ปรับเปลี่ยนอัตโนมัติตามสาขาวิชาที่แนะนำ</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>จอแท็บเล็ตไซเบอร์แสดงผลกราฟใยแมงมุม 6 แผนกวิชาตามคะแนนจริง</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>ฝัง Dynamic QR Code เชื่อมตรงเข้าสู่หน้ารับสมัครสาขาวิชานี้ทันที</span>
                </li>
              </ul>
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
                  {/* 1. Base Poster Template Image (High-Res 576x1024 Backdrop) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl("/images/card-elements/career-poster-template.jpg")}
                    alt="Career Poster Template"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                  />

                  {/* 2. DYNAMIC GOLDEN CAPSULE: Major / Program Name */}
                  <div
                    style={{
                      position: "absolute",
                      top: "201px",
                      left: "32px",
                      width: "512px",
                      height: "68px",
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

                  {/* 3. DYNAMIC 3D MASCOT HERO (Prepared for each major) */}
                  {mascotType !== "tron" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "260px",
                        left: "6px",
                        width: "258px",
                        height: "385px",
                      }}
                      className="z-20 rounded-3xl overflow-hidden border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.65)] bg-slate-950/90 flex flex-col items-center justify-end"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl(`/images/mascots/${mascotType}.png`)}
                        alt={`Mascot ${topDept.name}`}
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Mascot Department Badge */}
                      <div className="absolute bottom-2 inset-x-2 bg-slate-950/90 backdrop-blur-xs py-1 px-2 rounded-xl border border-cyan-400/50 text-center shadow-lg">
                        <span className="text-[11px] font-black text-cyan-300 tracking-wide">
                          ★ ตัวแทน {topDept.shortName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 4. DYNAMIC CYBER RADAR CHART (Covering the tablet screen with candidate's REAL scores) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "434px",
                      left: "246px",
                      width: "282px",
                      height: "220px",
                    }}
                    className="z-25 rounded-2xl overflow-hidden bg-[#071329] border border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.5)] p-0.5 flex items-center justify-center"
                  >
                    <RadarChart
                      scores={result.scores}
                      maxScore={15}
                      theme="cyber"
                      hideScores={true}
                      hideHint={true}
                      containerClassName="w-full h-full"
                    />
                  </div>

                  {/* 5. DYNAMIC QR CODE OVERLAY (Direct link to online admission for this program) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "846px",
                      left: "442px",
                      width: "104px",
                      height: "104px",
                    }}
                    className="z-30 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-md"
                  >
                    {qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeUrl}
                        alt="QR Code รับสมัคร"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                    )}
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
