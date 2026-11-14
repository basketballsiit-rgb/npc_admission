"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  Settings,
  Calendar,
  Layers,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  ArrowRight,
  Calculator,
  Save,
  Edit2,
  X,
  Loader2,
  Trash2,
  BookOpen,
} from "lucide-react";

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
}

interface AdmissionRound {
  id: string;
  academicYearId: string;
  name: string;
  roundType: string;
  startAt: string;
  endAt: string;
  announceAt: string;
  isActive: boolean;
}

interface ProgramQuota {
  id: string;
  code: string;
  level: string;
  name: string;
  quotaSeats: number;
  regularSeats: number;
  rolloverSeats: number;
  isOpen: boolean;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"rounds" | "programs" | "rollover" | "years">("rounds");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [allYears, setAllYears] = useState<AcademicYear[]>([]);
  const [rounds, setRounds] = useState<AdmissionRound[]>([]);
  const [programs, setPrograms] = useState<ProgramQuota[]>([]);

  // Editing Round Modal
  const [editRound, setEditRound] = useState<AdmissionRound | null>(null);

  // New Year Form
  const [newYearInput, setNewYearInput] = useState("");
  const [newYearMakeActive, setNewYearMakeActive] = useState(false);

  // Rollover Preview State
  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [rolloverPreview, setRolloverPreview] = useState<any | null>(null);

  // New Program Modal State
  const [newProgramModalOpen, setNewProgramModalOpen] = useState(false);
  const [newProgCode, setNewProgCode] = useState("");
  const [newProgLevel, setNewProgLevel] = useState<"ปวช." | "ปวส.">("ปวช.");
  const [newProgName, setNewProgName] = useState("");
  const [newProgQuotaSeats, setNewProgQuotaSeats] = useState(20);
  const [newProgRegularSeats, setNewProgRegularSeats] = useState(20);
  const [newProgIsOpen, setNewProgIsOpen] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(apiUrl("/api/admin/settings"));
      if (!res.ok) throw new Error("ไม่สามารถโหลดการตั้งค่าได้");
      const json = await res.json();
      if (json.success) {
        setActiveYear(json.activeYear);
        setAllYears(json.allYears || []);
        setRounds(json.rounds || []);
        setPrograms(json.programs || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Switch Active Year
  const handleSwitchYear = async (yearId: string) => {
    try {
      setSaving(true);
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_ACTIVE_YEAR", yearId }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message);
        await fetchSettings();
      } else {
        alert(json.error || "ไม่สามารถเปลี่ยนปีการศึกษาได้");
      }
    } finally {
      setSaving(false);
    }
  };

  // Create Year
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_YEAR",
          year: newYearInput.trim(),
          makeActive: newYearMakeActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message);
        setNewYearInput("");
        setNewYearMakeActive(false);
        await fetchSettings();
      } else {
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setSaving(false);
    }
  };

  // Toggle Program isOpen
  const handleToggleProgram = async (program: ProgramQuota) => {
    try {
      const updatedStatus = !program.isOpen;
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_PROGRAM",
          id: program.id,
          isOpen: updatedStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPrograms(programs.map((p) => (p.id === program.id ? { ...p, isOpen: updatedStatus } : p)));
        showNotification(`อัปเดตสถานะสาขาวิชา "${program.name}" เรียบร้อย`);
      } else {
        alert(json.error);
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการปรับสถานะ");
    }
  };

  // Save Program Seats
  const handleUpdateSeats = async (
    id: string,
    quotaSeats: number,
    regularSeats: number,
    name: string
  ) => {
    try {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_PROGRAM",
          id,
          quotaSeats,
          regularSeats,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(`อัปเดตจำนวนที่นั่ง "${name}" เรียบร้อย`);
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึกที่นั่ง");
    }
  };

  // Save Round Edit
  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRound) return;
    try {
      setSaving(true);
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_ROUND",
          id: editRound.id,
          academicYearId: editRound.academicYearId,
          name: editRound.name,
          roundType: editRound.roundType,
          startAt: editRound.startAt,
          endAt: editRound.endAt,
          announceAt: editRound.announceAt,
          isActive: editRound.isActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message);
        setEditRound(null);
        await fetchSettings();
      } else {
        alert(json.error);
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึกรอบรับสมัคร");
    } finally {
      setSaving(false);
    }
  };

  // Create New Program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear) {
      alert("กรุณาเลือกปีการศึกษาที่เปิดใช้งานก่อน");
      return;
    }
    if (!newProgCode.trim()) {
      alert("กรุณากรอกรหัสสาขาวิชา (เช่น 20101, 30101 ตาม ศธ.02)");
      return;
    }
    if (!newProgName.trim()) {
      alert("กรุณากรอกชื่อสาขาวิชา");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PROGRAM",
          academicYearId: activeYear.id,
          code: newProgCode.trim(),
          level: newProgLevel,
          name: newProgName.trim(),
          quotaSeats: Math.max(0, Number(newProgQuotaSeats) || 0),
          regularSeats: Math.max(0, Number(newProgRegularSeats) || 0),
          isOpen: newProgIsOpen,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "เกิดข้อผิดพลาดในการเพิ่มสาขาวิชา");
        return;
      }

      showNotification(json.message || "เพิ่มสาขาวิชาใหม่สำเร็จ");
      setNewProgramModalOpen(false);
      setNewProgCode("");
      setNewProgName("");
      setNewProgQuotaSeats(20);
      setNewProgRegularSeats(20);
      setNewProgIsOpen(true);
      await fetchSettings();
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  // Delete Program
  const handleDeleteProgram = async (id: string, name: string, level: string) => {
    if (!confirm(`คุณต้องการลบสาขาวิชา "${name} (${level})" ออกจากแผนรับหรือไม่?`)) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_PROGRAM",
          id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "ไม่สามารถลบสาขาวิชาได้");
        return;
      }

      showNotification(json.message || "ลบสาขาวิชาเรียบร้อยแล้ว");
      await fetchSettings();
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  // Preview Rollover
  const handlePreviewRollover = async () => {
    try {
      setRolloverLoading(true);
      const res = await fetch(apiUrl("/api/admin/rollover"));
      const json = await res.json();
      if (json.success) {
        setRolloverPreview(json);
      } else {
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setRolloverLoading(false);
    }
  };

  // Execute Rollover
  const handleExecuteRollover = async () => {
    if (
      !confirm(
        "ยืนยันการประมวลผลทบยอดที่นั่งคงเหลือจากรอบโควตาเข้ารอบปกติจริง? (ระบบจะนำที่นั่งคงเหลือไปบวกเพิ่มเป็น rolloverSeats ให้ทุกสาขาวิชา)"
      )
    ) {
      return;
    }

    try {
      setRolloverLoading(true);
      const res = await fetch(apiUrl("/api/admin/rollover"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearId: activeYear?.id,
          force: true, // อนุญาตให้รันเพื่อทดสอบ/ปฏิบัติงานจริง
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message);
        await fetchSettings();
        await handlePreviewRollover();
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการประมวลผล");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setRolloverLoading(false);
    }
  };

  // Format ISO to datetime-local input string
  const toInputDate = (isoStr: string) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-2" />
        กำลังโหลดการตั้งค่าระบบ...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ตั้งค่ารอบและแผนรับ
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E3A8A] text-white">
              ปีการศึกษา {activeYear?.year || "-"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดวัน-เวลาเปิดปิดรับสมัคร ประกาศผล จัดการโควตารายสาขา และประมวลผลทบยอดที่นั่ง
          </p>
        </div>

        <button
          onClick={fetchSettings}
          title="รีเฟรช"
          className="p-2 text-slate-600 hover:text-[#1E3A8A] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("rounds")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "rounds"
              ? "border-[#1E3A8A] text-[#1E3A8A]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>รอบการรับสมัคร</span>
        </button>
        <button
          onClick={() => setActiveTab("programs")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "programs"
              ? "border-[#1E3A8A] text-[#1E3A8A]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>แผนรับ & เปิด/ปิดสาขาวิชา</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("rollover");
            if (!rolloverPreview) handlePreviewRollover();
          }}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "rollover"
              ? "border-[#F59E0B] text-amber-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calculator className="w-4 h-4 text-[#F59E0B]" />
          <span>ระบบทบยอดที่นั่งอัตโนมัติ (Rollover)</span>
        </button>
        <button
          onClick={() => setActiveTab("years")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "years"
              ? "border-[#1E3A8A] text-[#1E3A8A]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ปีการศึกษา ({allYears.length})</span>
        </button>
      </div>

      {/* TAB 1: ROUNDS */}
      {activeTab === "rounds" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">รอบการรับสมัครประจำปี {activeYear?.year}</h2>
              <p className="text-xs text-slate-500">
                ระบบจะตรวจสอบวันเวลาจริงจาก Server (startAt ถึง endAt) ในระดับนาที
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.map((round) => {
              const now = new Date();
              const start = new Date(round.startAt);
              const end = new Date(round.endAt);
              const isOpen = round.isActive && now >= start && now <= end;

              return (
                <div
                  key={round.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOpen
                      ? "border-emerald-300 bg-emerald-50/20 shadow-xs"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{round.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {round.roundType}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOpen
                          ? "bg-emerald-100 text-emerald-800"
                          : now < start
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isOpen ? "● เปิดรับสมัครอยู่" : now < start ? "ยังไม่ถึงกำหนด" : "ปิดรับสมัครแล้ว"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">วันเปิดรับสมัคร:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(round.startAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">วันปิดรับสมัคร:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(round.endAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">วันประกาศผล:</span>
                      <span className="font-semibold text-indigo-900">
                        {new Date(round.announceAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setEditRound(round)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>แก้ไขวัน-เวลา</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAMS & QUOTAS */}
      {activeTab === "programs" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                แผนรับและสวิตช์เปิด/ปิดรับสมัครรายสาขา
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                สามารถเปิดหรือปิดรับสมัครแต่ละสาขาได้ทันที และปรับแก้โควตารับรอบโควตาและรอบปกติ
              </p>
            </div>
            <button
              onClick={() => setNewProgramModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสาขาวิชาใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-bold">
                  <th className="py-3 px-4">รหัส (ศธ.02)</th>
                  <th className="py-3 px-3">ระดับ</th>
                  <th className="py-3 px-4">ชื่อสาขาวิชา</th>
                  <th className="py-3 px-3 text-center">โควตา</th>
                  <th className="py-3 px-3 text-center">รอบปกติ</th>
                  <th className="py-3 px-3 text-center text-amber-700">ทบยอด</th>
                  <th className="py-3 px-3 text-center">รวมรับ</th>
                  <th className="py-3 px-4 text-center">สถานะเปิดรับ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{p.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-700">{p.level}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.quotaSeats}
                        id={`quota-${p.id}`}
                        className="w-16 py-1 px-2 border border-slate-300 rounded-lg text-center text-xs font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.regularSeats}
                        id={`regular-${p.id}`}
                        className="w-16 py-1 px-2 border border-slate-300 rounded-lg text-center text-xs font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      +{p.rolloverSeats}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-slate-800">
                      {p.regularSeats + p.rolloverSeats}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleProgram(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] transition ${
                          p.isOpen
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                      >
                        {p.isOpen ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>เปิดรับสมัคร</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-rose-600" />
                            <span>ปิดรับสมัคร</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const qInput = document.getElementById(
                              `quota-${p.id}`
                            ) as HTMLInputElement;
                            const rInput = document.getElementById(
                              `regular-${p.id}`
                            ) as HTMLInputElement;
                            if (qInput && rInput) {
                              handleUpdateSeats(
                                p.id,
                                Number(qInput.value),
                                Number(rInput.value),
                                p.name
                              );
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition"
                          title="บันทึกจำนวนที่นั่ง"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(p.id, p.name, p.level)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="ลบสาขาวิชา"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUOTA ROLLOVER */}
      {activeTab === "rollover" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-200">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-amber-950">
                  ระบบทบยอดที่นั่งอัตโนมัติ (Quota Rollover System)
                </h2>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                กติกาวิทยาลัย: เมื่อสิ้นสุดรอบโควตา ที่นั่งที่เหลือ (โควตาตั้งต้น - ยอดอนุมัติแล้ว)
                จะถูกยกยอดไปบวกเพิ่มเข้ารอบปกติทันที เพื่อไม่ให้เสียสิทธิ์ที่นั่งของแต่ละสาขา
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handlePreviewRollover}
                disabled={rolloverLoading}
                className="px-3.5 py-2 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rolloverLoading ? "animate-spin" : ""}`} />
                <span>คำนวณใหม่</span>
              </button>
              <button
                onClick={handleExecuteRollover}
                disabled={rolloverLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันประมวลผลทบยอดจริง</span>
              </button>
            </div>
          </div>

          {rolloverLoading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
              กำลังคำนวณยอดที่นั่งคงเหลือ...
            </div>
          ) : rolloverPreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>
                  ยอดที่นั่งทบรวมทั้งหมด:{" "}
                  <strong className="text-amber-600 text-sm">
                    {rolloverPreview.summary?.totalRolloverSeats} ที่นั่ง
                  </strong>
                </span>
                <span className="text-slate-500">
                  สถานะรอบโควตา:{" "}
                  <strong className={rolloverPreview.isQuotaEnded ? "text-emerald-600" : "text-amber-600"}>
                    {rolloverPreview.isQuotaEnded ? "สิ้นสุดรอบแล้ว" : "ยังไม่ปิดรอบ"}
                  </strong>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">รหัส</th>
                      <th className="py-2.5 px-3">สาขาวิชา</th>
                      <th className="py-2.5 px-3 text-center">โควตาตั้งต้น</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">อนุมัติแล้ว</th>
                      <th className="py-2.5 px-3 text-center text-amber-700 font-black">
                        ที่นั่งทบเข้ารอบปกติ
                      </th>
                      <th className="py-2.5 px-3 text-center">รอบปกติตั้งต้น</th>
                      <th className="py-2.5 px-3 text-center font-black">รอบปกติหลังทบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rolloverPreview.summary?.programs.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{item.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.level} {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{item.quotaSeats}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                          {item.approvedCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-amber-600">
                          +{item.rolloverSeats}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.regularSeats}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-[#1E3A8A]">
                          {item.newRegularTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: ACADEMIC YEARS */}
      {activeTab === "years" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900">จัดการปีการศึกษา</h2>
            <p className="text-xs text-slate-500">
              สร้างปีการศึกษาใหม่ หรือสลับปีที่เปิดใช้งานปัจจุบัน
            </p>
          </div>

          {/* Form to add year */}
          <form
            onSubmit={handleCreateYear}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs"
          >
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                สร้างปีการศึกษาใหม่ (เช่น 2571)
              </label>
              <input
                type="text"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                placeholder="2571"
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 self-start sm:self-end sm:mb-2">
              <input
                type="checkbox"
                checked={newYearMakeActive}
                onChange={(e) => setNewYearMakeActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
              <span>ตั้งเป็นปีการศึกษาปัจจุบันทันที</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 bg-[#1E3A8A] text-white font-bold rounded-xl hover:bg-indigo-900 transition flex items-center justify-center gap-1 self-end"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มปีการศึกษา</span>
            </button>
          </form>

          {/* List of Years */}
          <div className="space-y-2">
            {allYears.map((y) => (
              <div
                key={y.id}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900 text-sm">ปีการศึกษา {y.year}</span>
                  {y.isActive && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ● ปีปัจจุบัน (Active)
                    </span>
                  )}
                </div>

                {!y.isActive && (
                  <button
                    onClick={() => handleSwitchYear(y.id)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-[#1E3A8A] hover:text-white rounded-lg text-slate-700 font-bold text-[11px] transition"
                  >
                    สลับมาใช้ปีนี้
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Round Modal */}
      {editRound && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">แก้ไขวัน-เวลารอบรับสมัคร</h3>
              <button
                onClick={() => setEditRound(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRound} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อรอบ</label>
                <input
                  type="text"
                  value={editRound.name}
                  onChange={(e) => setEditRound({ ...editRound, name: e.target.value })}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  วัน-เวลาเปิดรับสมัคร (Start At)
                </label>
                <input
                  type="datetime-local"
                  value={toInputDate(editRound.startAt)}
                  onChange={(e) => setEditRound({ ...editRound, startAt: e.target.value })}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  วัน-เวลาปิดรับสมัคร (End At)
                </label>
                <input
                  type="datetime-local"
                  value={toInputDate(editRound.endAt)}
                  onChange={(e) => setEditRound({ ...editRound, endAt: e.target.value })}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  วัน-เวลาประกาศผลการคัดเลือก (Announce At)
                </label>
                <input
                  type="datetime-local"
                  value={toInputDate(editRound.announceAt)}
                  onChange={(e) => setEditRound({ ...editRound, announceAt: e.target.value })}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={editRound.isActive}
                  onChange={(e) => setEditRound({ ...editRound, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1E3A8A]"
                />
                <span>เปิดใช้งานรอบนี้ (isActive)</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditRound(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Program Modal */}
      {newProgramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold text-slate-900 text-sm">เพิ่มสาขาวิชาที่เปิดรับสมัครใหม่</h3>
              </div>
              <button
                onClick={() => setNewProgramModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    รหัสสาขาวิชา (ศธ.02) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 20101, 30101"
                    value={newProgCode}
                    onChange={(e) => setNewProgCode(e.target.value)}
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ระดับการศึกษา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newProgLevel}
                    onChange={(e) => setNewProgLevel(e.target.value as "ปวช." | "ปวส.")}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="ปวช.">ปวช. (ประกาศนียบัตรวิชาชีพ)</option>
                    <option value="ปวส.">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ชื่อสาขาวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น สาขาวิชาช่างยนต์ (ยานยนต์), สาขาวิชาการบัญชี"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    จำนวนรับรอบโควตา (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProgQuotaSeats}
                    onChange={(e) => setNewProgQuotaSeats(Number(e.target.value))}
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    จำนวนรับรอบปกติ (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProgRegularSeats}
                    onChange={(e) => setNewProgRegularSeats(Number(e.target.value))}
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newProgIsOpen}
                    onChange={(e) => setNewProgIsOpen(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E3A8A]"
                  />
                  <span>เปิดรับสมัครทันทีในระบบ (ผู้สมัครสามารถเลือกสาขานี้ได้)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewProgramModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>บันทึกและเปิดสาขา</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}