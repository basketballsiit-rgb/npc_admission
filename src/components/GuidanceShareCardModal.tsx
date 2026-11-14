"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  X,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Coins,
  QrCode,
  MapPin,
  Phone,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  User,
  GraduationCap,
} from "lucide-react";
import { apiUrl, assetUrl } from "@/lib/basepath";
import { AssessmentResult } from "@/lib/guidance-questions";
import { DEPARTMENTS, DepartmentKey, EducationLevelType } from "@/lib/guidance-config";
import MascotAvatar, { MascotType } from "./MascotAvatar";
import RadarChart from "./RadarChart";

interface CustomExpenseItem {
  id: string;
  name: string;
  amount: number;
  note: string;
}

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

  // Mode: 'parent' (4:5) | 'story' (9:16)
  const [aspectMode, setAspectMode] = useState<"parent" | "story">("parent");
  const [studentName, setStudentName] = useState("น้องผู้สมัคร");
  const [showStoryExpenses, setShowStoryExpenses] = useState(false);

  // Expenses from API
  const [apiExpenses, setApiExpenses] = useState<
    { id: string; itemName: string; amount: number; note: string | null }[]
  >([]);
  const [scholarshipNote, setScholarshipNote] = useState<string>("");
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Custom User-Simulated Expenses
  const [customExpenses, setCustomExpenses] = useState<CustomExpenseItem[]>([]);
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState<number>(0);
  const [newExpNote, setNewExpNote] = useState("");
  const [showAddCustomExp, setShowAddCustomExp] = useState(false);

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

  // Resolve active program details
  let activeProg = selectedLevel === "ปวช." ? topDept.pvc : topDept.pvs;
  if (selectedLevel === "ปวช." && selectedCode === "20143") {
    const ev = topDept.alternativePvc?.find((p) => p.code === "20143");
    if (ev) activeProg = ev;
  }

  // Load Expenses from API
  useEffect(() => {
    if (!isOpen) return;

    async function loadExpenses() {
      try {
        setExpensesLoading(true);
        const res = await fetch(
          apiUrl(`/api/expenses?level=${encodeURIComponent(selectedLevel)}&code=${encodeURIComponent(selectedCode)}`)
        );
        const data = await res.json();
        if (data.success) {
          setApiExpenses(data.items || []);
          setScholarshipNote(data.noteScholarship || "");
        }
      } catch (err) {
        console.error("Failed to load expenses:", err);
      } finally {
        setExpensesLoading(false);
      }
    }

    loadExpenses();
  }, [isOpen, selectedLevel, selectedCode]);

  // Generate QR Code
  useEffect(() => {
    if (!isOpen) return;

    const guidanceTargetUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${assetUrl("/guidance")}`
        : "https://service.npc.ac.th/npc_admission/guidance";

    QRCode.toDataURL(guidanceTargetUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: "#1E3A8A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  // Add custom expense
  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim() || newExpAmount < 0) return;

    const newItem: CustomExpenseItem = {
      id: "custom-" + Date.now(),
      name: newExpName.trim(),
      amount: newExpAmount,
      note: newExpNote.trim() || "รายการระบุเพิ่มเติม",
    };
    setCustomExpenses([...customExpenses, newItem]);
    setNewExpName("");
    setNewExpAmount(0);
    setNewExpNote("");
    setShowAddCustomExp(false);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setCustomExpenses(customExpenses.filter((item) => item.id !== id));
  };

  // Calculate Net Totals
  const apiTotal = apiExpenses.reduce((sum, item) => sum + item.amount, 0);
  const customTotal = customExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netTotal = apiTotal + customTotal;

  // Track share in backend
  const trackShare = async () => {
    if (logId) {
      try {
        await fetch(apiUrl("/api/guidance/share"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId }),
        });
      } catch (e) {
        console.error("Failed to track share count:", e);
      }
    }
  };

  // Download High-Res PNG
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setShareSuccess(null);

    try {
      await trackShare();
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });

      const link = document.createElement("a");
      const safeName = studentName.trim() || "student";
      link.download = `NPC-Career-Card-${selectedCode}-${safeName}-${aspectMode}.png`;
      link.href = dataUrl;
      link.click();
      setShareSuccess("ดาวน์โหลดรูปภาพความละเอียดสูงสำเร็จเรียบร้อย!");
    } catch (err) {
      console.error("Failed to download image:", err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  // Web Share API
  const handleQuickShare = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setShareSuccess(null);

    try {
      await trackShare();
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `NPC-Career-Card-${selectedCode}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ผลการประเมินค้นหาสายเรียนและสาขาที่ใช่: ${activeProg.name} (รหัส ${selectedCode})`,
          text: `ยินดีด้วย! ${studentName} เหมาะสมกับ ${activeProg.name} วิทยาลัยสารพัดช่างน่าน`,
          files: [file],
        });
        setShareSuccess("แชร์รูปภาพสำเร็จ!");
      } else {
        // Fallback to direct download
        handleDownloadImage();
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                สร้างการ์ดรูปภาพผลลัพธ์สไตล์ 3D Template & PR วิทยาลัย
              </h3>
              <p className="text-[11px] text-slate-500">
                เลือกรูปแบบภาพ ปรับแต่งชื่อและประมาณการค่าใช้จ่าย พร้อมดาวน์โหลดภาพความละเอียดสูง (.PNG)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls (Left/Top) + Canvas Preview (Right/Bottom) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Mode Switcher */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                เลือกรูปแบบสัดส่วนภาพ:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAspectMode("parent")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    aspectMode === "parent"
                      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div>โหมดส่งผู้ปกครอง</div>
                  <div className="text-[10px] opacity-80 font-mono">4:5 (ครบถ้วนทุกรายละเอียด)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectMode("story")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    aspectMode === "story"
                      ? "bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-transparent shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div>โหมดแชร์สตอรี่</div>
                  <div className="text-[10px] opacity-80 font-mono">9:16 (เน้นตัวละคร & กราฟ)</div>
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
                  placeholder="เช่น น้องบาส, นายสมชาย ใจดี"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Story Toggle Expenses */}
            {aspectMode === "story" && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">แสดงกล่องค่าใช้จ่ายในสตอรี่</span>
                <button
                  type="button"
                  onClick={() => setShowStoryExpenses(!showStoryExpenses)}
                  className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 transition ${
                    showStoryExpenses
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {showStoryExpenses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showStoryExpenses ? "แสดง" : "ซ่อน"}</span>
                </button>
              </div>
            )}

            {/* Simulated Custom Expenses Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>ประมาณการค่าใช้จ่ายจำลอง</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomExp(!showAddCustomExp)}
                  className="text-[11px] font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการจำลอง</span>
                </button>
              </div>

              {/* Add Custom Item Form */}
              {showAddCustomExp && (
                <form
                  onSubmit={handleAddCustomExpense}
                  className="p-3 bg-white rounded-xl border border-amber-300 shadow-xs space-y-2 text-xs animate-fadeIn"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      ชื่อรายการเพิ่มเติม:
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ค่าเดินทาง/หอพัก, ค่าอุปกรณ์เสริม"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      required
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        จำนวนเงิน (บาท):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs text-right font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        หมายเหตุ:
                      </label>
                      <input
                        type="text"
                        placeholder="โดยประมาณ"
                        value={newExpNote}
                        onChange={(e) => setNewExpNote(e.target.value)}
                        className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomExp(false)}
                      className="px-2.5 py-1 text-slate-500 text-[11px] font-bold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg"
                    >
                      เพิ่มลงในการ์ด
                    </button>
                  </div>
                </form>
              )}

              {/* List of Custom Added Items */}
              {customExpenses.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    รายการที่ผู้ใช้กรอกเพิ่มเอง:
                  </div>
                  {customExpenses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        {c.note && (
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({c.note})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          +{c.amount.toLocaleString()} ฿
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomExpense(c.id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>ยอดรวมประมาณการสุทธิ:</span>
                <span className="font-mono text-base text-[#1E3A8A]">
                  {netTotal.toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={exporting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-blue-800 hover:from-blue-900 hover:to-indigo-900 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>แชร์รูปภาพด่วน (LINE / โซเชียล)</span>
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
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/80 p-4 rounded-3xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 mb-2">
              * พรีวิวการ์ดรูปภาพจริงที่จะถูกบันทึก (ขนาด {aspectMode === "parent" ? "4:5" : "9:16"})
            </div>

            {/* ===================== RENDER CANVAS CONTAINER ===================== */}
            <div className="overflow-auto max-h-[70vh] w-full flex justify-center">
              <div
                ref={cardRef}
                style={{
                  width: aspectMode === "parent" ? "480px" : "400px",
                  minHeight: aspectMode === "parent" ? "600px" : "711px",
                }}
                className={`bg-gradient-to-b from-slate-900 via-[#1E3A8A] to-slate-950 text-white p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none ${
                  aspectMode === "parent" ? "rounded-3xl" : "rounded-3xl"
                }`}
              >
                {/* Background Cyber & Star Details */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* 1. Header: College Branding */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-amber-300 shadow-md overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl("/npc-logo.jpg")}
                        alt="NPC Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1">
                        <span>NAN POLYTECHNIC COLLEGE</span>
                      </div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        วิทยาลัยสารพัดช่างน่าน
                      </h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black border border-amber-400/30">
                      CAREER DISCOVERY
                    </span>
                    <div className="text-[9px] text-slate-300 mt-0.5">
                      ปีการศึกษา 2570
                    </div>
                  </div>
                </div>

                {/* 2. Candidate Highlight & 3D Avatar */}
                <div className="relative z-10 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-300">
                        ผลการประเมินค้นพบตัวตนของ:
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                        {studentName}
                      </h2>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-black text-emerald-300">
                      ความสอดคล้อง {result.sortedDepartments[0]?.percentage || 100}%
                    </div>
                  </div>

                  {/* 3D Mascot Character Badge */}
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
                    <MascotAvatar
                      type={mascotType}
                      size={aspectMode === "parent" ? "md" : "lg"}
                      showBadge={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] mb-1 shadow-xs">
                        {selectedCode === "20143"
                          ? "⚡ นวัตกรรมยานยนต์ไฟฟ้า EV"
                          : "★ อันดับ 1 สาขาที่ใช่สำหรับคุณ"}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                        {activeProg.name}
                      </h3>
                      <div className="text-[11px] text-slate-200 mt-0.5 flex items-center gap-2">
                        <span>ระดับ {selectedLevel}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-300 font-bold">
                          รหัส ศธ.02: {selectedCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Center Section: Radar Chart or Core Strengths */}
                <div className="relative z-10 py-1 space-y-2">
                  {aspectMode === "parent" ? (
                    <div className="grid grid-cols-2 gap-3 items-center bg-black/20 p-3 rounded-2xl border border-white/10">
                      {/* Mini Radar Chart */}
                      <div className="flex justify-center scale-90 -my-4">
                        <RadarChart scores={result.scores} maxScore={15} />
                      </div>

                      {/* Careers summary */}
                      <div className="space-y-1.5 text-[10px]">
                        <div className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>เส้นทางอาชีพในอนาคต:</span>
                        </div>
                        <ul className="space-y-1 text-slate-200 leading-snug">
                          {(activeProg.futureCareers || topDept.futureCareers)
                            .slice(0, 3)
                            .map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* Story Mode Spider Chart */
                    <div className="flex flex-col items-center bg-black/25 p-3 rounded-2xl border border-white/10">
                      <div className="scale-95 -my-3">
                        <RadarChart scores={result.scores} maxScore={15} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Estimated Initial Expenses Box (Always in Parent, Optional in Story) */}
                {(aspectMode === "parent" || showStoryExpenses) && (
                  <div className="relative z-10 bg-white/95 text-slate-900 rounded-2xl p-3 shadow-lg border border-amber-300 space-y-2 text-[10px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <div className="font-black text-[#1E3A8A] flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>ประมาณการค่าใช้จ่ายแรกเข้า (ระดับ {selectedLevel})</span>
                      </div>
                      <span className="font-mono font-black text-amber-700 text-xs">
                        รวม: {netTotal.toLocaleString()} บาท
                      </span>
                    </div>

                    <div className="space-y-1 max-h-24 overflow-hidden">
                      {apiExpenses.slice(0, 3).map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between text-slate-700">
                          <span className="truncate max-w-[240px] font-medium">
                            • {exp.itemName}
                          </span>
                          <span className="font-mono font-bold shrink-0">
                            {exp.amount === 0 ? "0 (ฟรี)" : `${exp.amount.toLocaleString()} ฿`}
                          </span>
                        </div>
                      ))}

                      {customExpenses.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-blue-900 font-bold">
                          <span className="truncate max-w-[240px]">
                            • {c.name}
                          </span>
                          <span className="font-mono shrink-0">
                            +{c.amount.toLocaleString()} ฿
                          </span>
                        </div>
                      ))}
                    </div>

                    {scholarshipNote && (
                      <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
                        * {scholarshipNote}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PR & Dynamic QR Code Footer */}
                <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-3 text-[9px] text-slate-300">
                  <div className="space-y-0.5 leading-tight flex-1">
                    <div className="text-amber-300 font-bold text-[10px]">
                      &quot;เรียนดี มีทักษะวิชาชีพ มีรายได้ระหว่างเรียน พร้อมสู่อนาคต&quot;
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>150 ถ.สุมนเทวราช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>054-710367, 054-772520 | เว็บไซต์: www.npc.ac.th</span>
                    </div>
                  </div>

                  {/* Dynamic QR Code Badge */}
                  <div className="bg-white p-1 rounded-xl shadow-md flex flex-col items-center shrink-0">
                    {qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeUrl}
                        alt="QR Code ค้นหาสายเรียน"
                        className="w-13 h-13 object-contain"
                      />
                    ) : (
                      <div className="w-13 h-13 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[7px] text-slate-800 font-black tracking-tighter mt-0.5">
                      สแกนค้นหาสาขา
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
