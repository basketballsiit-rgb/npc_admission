"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  ListChecks,
  Coins,
} from "lucide-react";

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
}

interface ProgramItem {
  id: string;
  code: string;
  level: string;
  name: string;
  isOpen: boolean;
}

interface RegularExpenseRecord {
  id: string;
  level: string;
  programCode: string | null;
  itemName: string;
  amount: number;
  note: string | null;
  sortOrder: number;
}

interface DraftLineItem {
  localId: string;
  itemName: string;
  amount: string;
  note: string;
}

function makeProgramKey(level: string, code: string) {
  return `${level}::${code}`;
}

export default function AdminExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allYears, setAllYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [programs, setPrograms] = useState<ProgramItem[]>([]);

  // Active round tab: QUOTA (lump-sum) vs REGULAR (per-program itemized)
  const [roundTab, setRoundTab] = useState<"QUOTA" | "REGULAR">("QUOTA");

  // --- QUOTA (Lump-sum per level) ---
  const [pvc, setPvc] = useState<string>("0");
  const [pvs, setPvs] = useState<string>("0");
  const [pvsDual, setPvsDual] = useState<string>("0");
  const [pvcNote, setPvcNote] = useState<string>("เรียนฟรี 15 ปีตามนโยบายรัฐบาล");
  const [pvsNote, setPvsNote] = useState<string>("กู้ยืม กยศ. ได้เต็มจำนวน");
  const [pvsDualNote, setPvsDualNote] = useState<string>(
    "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้"
  );

  // --- REGULAR (Per-program itemized list) ---
  const [regularLevelTab, setRegularLevelTab] = useState<"ปวช." | "ปวส.">("ปวช.");
  const [selectedProgramKey, setSelectedProgramKey] = useState<string>("");
  const [regularMap, setRegularMap] = useState<Record<string, DraftLineItem[]>>({});
  const [confirmCopyAll, setConfirmCopyAll] = useState(false);

  // Feedback alerts
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchExpenses = useCallback(async (yearId?: string) => {
    try {
      setLoading(true);
      setMessage(null);
      const url = yearId
        ? apiUrl(`/api/admin/expenses?academicYearId=${yearId}`)
        : apiUrl("/api/admin/expenses");
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setAllYears(data.allYears || []);
        const progList: ProgramItem[] = data.programs || [];
        setPrograms(progList);

        if (data.currentYear) {
          setSelectedYearId(data.currentYear.id);
        }

        if (data.expenses) {
          setPvc(String(data.expenses.pvc ?? 0));
          setPvs(String(data.expenses.pvs ?? 0));
          setPvsDual(String(data.expenses.pvsDual ?? 0));
          setPvcNote(data.expenses.pvcNote || "เรียนฟรี 15 ปีตามนโยบายรัฐบาล");
          setPvsNote(data.expenses.pvsNote || "กู้ยืม กยศ. ได้เต็มจำนวน");
          setPvsDualNote(
            data.expenses.pvsDualNote ||
              "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้"
          );
        }

        // Group regular items by level::programCode
        const grouped: Record<string, DraftLineItem[]> = {};
        const regItems: RegularExpenseRecord[] = data.regularItems || [];
        for (const it of regItems) {
          if (!it.programCode) continue;
          const key = makeProgramKey(it.level, it.programCode);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            localId: it.id,
            itemName: it.itemName,
            amount: String(it.amount),
            note: it.note || "",
          });
        }
        setRegularMap(grouped);

        // Select first program of active level if none selected
        setSelectedProgramKey((prev) => {
          const exists = progList.some(
            (p) => makeProgramKey(p.level, p.code) === prev
          );
          if (exists) return prev;
          const firstPvc = progList.find((p) => p.level === "ปวช.") || progList[0];
          return firstPvc ? makeProgramKey(firstPvc.level, firstPvc.code) : "";
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "ไม่สามารถโหลดข้อมูลได้",
        });
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
      setMessage({
        type: "error",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedYearId(newId);
    fetchExpenses(newId);
  };

  // Filtered programs for REGULAR level tab
  const levelPrograms = programs.filter((p) =>
    regularLevelTab === "ปวส." ? p.level.includes("ปวส") : p.level === "ปวช."
  );

  // Ensure selectedProgramKey always belongs to current regularLevelTab
  const activeProgram =
    levelPrograms.find(
      (p) => makeProgramKey(p.level, p.code) === selectedProgramKey
    ) || levelPrograms[0];

  const activeKey = activeProgram
    ? makeProgramKey(activeProgram.level, activeProgram.code)
    : "";
  const activeDraftItems: DraftLineItem[] = activeKey
    ? regularMap[activeKey] || []
    : [];

  const activeTotal = activeDraftItems.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );

  const getProgramSummary = (p: ProgramItem) => {
    const list = regularMap[makeProgramKey(p.level, p.code)] || [];
    const total = list.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    return { count: list.length, total };
  };

  // --- Draft item mutators ---
  const handleAddRow = () => {
    if (!activeKey) return;
    setConfirmCopyAll(false);
    setRegularMap((prev) => ({
      ...prev,
      [activeKey]: [
        ...(prev[activeKey] || []),
        {
          localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemName: "",
          amount: "0",
          note: "",
        },
      ],
    }));
  };

  const handleLoadStarterRows = () => {
    if (!activeKey) return;
    setConfirmCopyAll(false);
    const starter: DraftLineItem[] =
      regularLevelTab === "ปวช."
        ? [
            {
              localId: `st-1-${Date.now()}`,
              itemName: "ค่าประกันอุบัติเหตุ",
              amount: "160",
              note: "คุ้มครองตลอดปีการศึกษา",
            },
            {
              localId: `st-2-${Date.now()}`,
              itemName: "ค่าทำบัตรประจำตัวนักเรียน / ตรวจสุขภาพ",
              amount: "150",
              note: "",
            },
            {
              localId: `st-3-${Date.now()}`,
              itemName: "ค่าชุดฝึกปฏิบัติการประจำแผนก",
              amount: "450",
              note: "",
            },
          ]
        : [
            {
              localId: `st-1-${Date.now()}`,
              itemName: "ค่าลงทะเบียนและบำรุงการศึกษา",
              amount: "1500",
              note: "สามารถกู้ยืม กยศ. ได้",
            },
            {
              localId: `st-2-${Date.now()}`,
              itemName: "ค่าประกันอุบัติเหตุและบัตรนักศึกษา",
              amount: "300",
              note: "",
            },
            {
              localId: `st-3-${Date.now()}`,
              itemName: "ค่าชุดฝึกปฏิบัติการประจำแผนก",
              amount: "700",
              note: "",
            },
          ];

    setRegularMap((prev) => ({
      ...prev,
      [activeKey]: starter,
    }));
  };

  const handleUpdateRow = (
    localId: string,
    field: "itemName" | "amount" | "note",
    value: string
  ) => {
    if (!activeKey) return;
    setRegularMap((prev) => ({
      ...prev,
      [activeKey]: (prev[activeKey] || []).map((row) =>
        row.localId === localId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleRemoveRow = (localId: string) => {
    if (!activeKey) return;
    setRegularMap((prev) => ({
      ...prev,
      [activeKey]: (prev[activeKey] || []).filter((row) => row.localId !== localId),
    }));
  };

  // --- Save QUOTA (lump-sum) ---
  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) return;

    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch(apiUrl("/api/admin/expenses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "QUOTA",
          academicYearId: selectedYearId,
          pvc: Number(pvc) || 0,
          pvs: Number(pvs) || 0,
          pvsDual: Number(pvsDual) || 0,
          pvcNote,
          pvsNote,
          pvsDualNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: data.message || "บันทึกค่าใช้จ่ายรอบโควตาพิเศษเรียบร้อยแล้ว",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "ไม่สามารถบันทึกข้อมูลได้",
        });
      }
    } catch (error) {
      console.error("Save quota expenses error:", error);
      setMessage({
        type: "error",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกข้อมูล",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Save REGULAR (itemized per program, or copy to all programs in level) ---
  const handleSaveRegular = async (applyToAllInLevel = false) => {
    if (!selectedYearId || !activeProgram) return;

    const validItems = activeDraftItems
      .map((it) => ({
        itemName: it.itemName.trim(),
        amount: Math.max(0, Number(it.amount) || 0),
        note: it.note.trim(),
      }))
      .filter((it) => it.itemName.length > 0);

    try {
      setSaving(true);
      setMessage(null);
      setConfirmCopyAll(false);

      const res = await fetch(apiUrl("/api/admin/expenses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "REGULAR",
          academicYearId: selectedYearId,
          level: applyToAllInLevel ? regularLevelTab : activeProgram.level,
          programCode: activeProgram.code,
          items: validItems,
          applyToAllInLevel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: data.message || "บันทึกรายการค่าใช้จ่ายรอบปกติเรียบร้อยแล้ว",
        });
        // Refresh from DB so all programs reflect saved state accurately
        await fetchExpenses(selectedYearId);
      } else {
        setMessage({
          type: "error",
          text: data.message || "ไม่สามารถบันทึกรายการได้",
        });
      }
    } catch (error) {
      console.error("Save regular expenses error:", error);
      setMessage({
        type: "error",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกข้อมูล",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            จัดการค่าใช้จ่ายแรกเข้า
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            แยกรอบโควตาพิเศษ (ระบุเป็นยอดรวม) และรอบปกติ (แยกรายการพร้อมยอดรวมรายสาขาวิชา ทั้ง ปวช. และ ปวส.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <select
              value={selectedYearId}
              onChange={handleYearChange}
              aria-label="เลือกปีการศึกษา"
              className="text-sm font-medium text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {allYears.map((y) => (
                <option key={y.id} value={y.id}>
                  ปีการศึกษา {y.year} {y.isActive ? "(ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchExpenses(selectedYearId)}
            disabled={loading}
            title="โหลดข้อมูลใหม่"
            aria-label="โหลดข้อมูลใหม่"
            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {/* Round Switcher Tabs */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setRoundTab("QUOTA");
            setMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            roundTab === "QUOTA"
              ? "bg-white text-[#162C63] shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Coins className="w-4 h-4" strokeWidth={1.75} />
          <span>รอบโควตาพิเศษ (ยอดรวม)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRoundTab("REGULAR");
            setMessage(null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            roundTab === "REGULAR"
              ? "bg-white text-[#162C63] shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListChecks className="w-4 h-4" strokeWidth={1.75} />
          <span>รอบปกติ (แยกรายสาขาและรายการ)</span>
        </button>
      </div>

      {/* Alert Feedback */}
      {message && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#162C63] mx-auto" />
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูลค่าใช้จ่ายแรกเข้า...</p>
        </div>
      ) : roundTab === "QUOTA" ? (
        /* ==================== TAB 1: QUOTA (LUMP-SUM TOTALS) ==================== */
        <form onSubmit={handleSaveQuota} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 grid grid-cols-1 lg:grid-cols-3">
            {/* 1. ปวช. */}
            <div className="p-6 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  ระดับ ปวช. (ม.3)
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-2">
                  ยอดรวมค่าใช้จ่ายแรกเข้า
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สำหรับผู้สมัครรอบโควตาพิเศษ ระดับ ปวช. ทุกสาขา
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    จำนวนเงินรวม (บาท)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={pvc}
                      onChange={(e) => setPvc(e.target.value)}
                      className="w-full pl-3.5 pr-12 py-2.5 text-xl font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63] focus:bg-white font-mono tabular-nums"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                      บาท
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ระบุ 0 หากไม่มีค่าใช้จ่ายแรกเข้า
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หมายเหตุประกอบ
                  </label>
                  <input
                    type="text"
                    value={pvcNote}
                    onChange={(e) => setPvcNote(e.target.value)}
                    placeholder="เช่น ฟรีตามนโยบายเรียนฟรี 15 ปี"
                    className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63]"
                  />
                </div>
              </div>
            </div>

            {/* 2. ปวส. ปกติ */}
            <div className="p-6 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                  ระดับ ปวส. (ปกติ)
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-2">
                  ยอดรวมค่าใช้จ่ายแรกเข้า
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สำหรับผู้สมัครรอบโควตาพิเศษ ผู้จบ ม.6 หรือ ปวช.3
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    จำนวนเงินรวม (บาท)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={pvs}
                      onChange={(e) => setPvs(e.target.value)}
                      className="w-full pl-3.5 pr-12 py-2.5 text-xl font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63] focus:bg-white font-mono tabular-nums"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                      บาท
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หมายเหตุประกอบ
                  </label>
                  <input
                    type="text"
                    value={pvsNote}
                    onChange={(e) => setPvsNote(e.target.value)}
                    placeholder="เช่น กู้ยืม กยศ. ได้เต็มจำนวน"
                    className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63]"
                  />
                </div>
              </div>
            </div>

            {/* 3. ปวส. ทวิภาคี */}
            <div className="p-6 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-[#162C63] border border-blue-200">
                  ระดับ ปวส. (ทวิภาคี)
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-2">
                  ยอดรวมค่าใช้จ่ายแรกเข้า
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สำหรับผู้สมัครรอบโควตาพิเศษ ระบบทวิภาคี
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    จำนวนเงินรวม (บาท)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={pvsDual}
                      onChange={(e) => setPvsDual(e.target.value)}
                      className="w-full pl-3.5 pr-12 py-2.5 text-xl font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63] focus:bg-white font-mono tabular-nums"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                      บาท
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หมายเหตุประกอบ
                  </label>
                  <input
                    type="text"
                    value={pvsDualNote}
                    onChange={(e) => setPvsDualNote(e.target.value)}
                    placeholder="เช่น มีเบี้ยเลี้ยงระหว่างฝึกงาน"
                    className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#162C63] hover:bg-[#1E3A8A] text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" strokeWidth={1.75} />
              )}
              <span>บันทึกค่าใช้จ่ายรอบโควตาพิเศษ</span>
            </button>
          </div>
        </form>
      ) : (
        /* ==================== TAB 2: REGULAR (PER-PROGRAM ITEMIZED) ==================== */
        <div className="space-y-4">
          {/* Level Selector Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-white rounded-lg border border-slate-200 self-start">
              {(["ปวช.", "ปวส."] as const).map((lvl) => {
                const count = programs.filter((p) =>
                  lvl === "ปวส." ? p.level.includes("ปวส") : p.level === "ปวช."
                ).length;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setRegularLevelTab(lvl);
                      setConfirmCopyAll(false);
                      setMessage(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      regularLevelTab === lvl
                        ? "bg-[#162C63] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ระดับ {lvl} ({count} สาขา)
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500">
              เลือกสาขาวิชาด้านซ้ายเพื่อเพิ่ม แก้ไข หรือลบรายการค่าใช้จ่ายแยกแต่ละสาขา
            </p>
          </div>

          {levelPrograms.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลสาขาวิชาในระดับ {regularLevelTab} สำหรับปีการศึกษานี้
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Master List: Programs in Selected Level (4 cols) */}
              <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>สาขาวิชา ({regularLevelTab})</span>
                  <span>ยอดรวมรอบปกติ</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {levelPrograms.map((prog) => {
                    const key = makeProgramKey(prog.level, prog.code);
                    const isSelected = key === activeKey;
                    const stat = getProgramSummary(prog);

                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => {
                          setSelectedProgramKey(key);
                          setConfirmCopyAll(false);
                          setMessage(null);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 border-l-2 border-l-[#162C63]"
                            : "hover:bg-slate-50 border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500 tabular-nums">
                              {prog.code}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {stat.count} รายการ
                            </span>
                          </div>
                          <p
                            className={`text-sm truncate mt-0.5 ${
                              isSelected
                                ? "font-semibold text-[#162C63]"
                                : "font-medium text-slate-800"
                            }`}
                          >
                            {prog.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <span
                            className={`text-sm font-semibold ${
                              stat.total > 0 ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {stat.total.toLocaleString("th-TH")}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">฿</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Detail Editor: Itemized Expenses for Selected Program (8 cols) */}
              {activeProgram && (
                <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Editor Header */}
                  <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">
                          รหัส {activeProgram.code}
                        </span>
                        <span>·</span>
                        <span>ระดับ {activeProgram.level}</span>
                        <span>·</span>
                        <span>รอบปกติ</span>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                        {activeProgram.name}
                      </h2>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-right tabular-nums shrink-0">
                      <p className="text-xs text-slate-500">ยอดรวมค่าใช้จ่ายแรกเข้า</p>
                      <p className="text-xl font-semibold text-[#162C63] leading-tight mt-0.5">
                        {activeTotal.toLocaleString("th-TH")}{" "}
                        <span className="text-xs font-normal text-slate-600">บาท</span>
                      </p>
                    </div>
                  </div>

                  {/* Line Items Table / Form */}
                  <div className="p-5 space-y-4">
                    {activeDraftItems.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
                        <p className="text-sm font-medium text-slate-700">
                          ยังไม่มีรายการค่าใช้จ่ายรอบปกติสำหรับสาขานี้
                        </p>
                        <p className="text-xs text-slate-500">
                          กดปุ่มเพิ่มรายการด้านล่างเพื่อระบุรายละเอียดค่าใช้จ่ายทีละรายการพร้อมยอดเงิน
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มรายการแรก</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLoadStarterRows}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <span>ใส่ชุดรายการมาตรฐาน ({regularLevelTab})</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Column Headers (Desktop) */}
                        <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-2 text-xs font-medium text-slate-500">
                          <div className="col-span-5">ชื่อรายการค่าใช้จ่าย</div>
                          <div className="col-span-3 text-right">จำนวนเงิน (บาท)</div>
                          <div className="col-span-3">หมายเหตุ (ถ้ามี)</div>
                          <div className="col-span-1 text-right">ลบ</div>
                        </div>

                        {activeDraftItems.map((row, idx) => (
                          <div
                            key={row.localId}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 sm:p-2 rounded-lg bg-slate-50/70 border border-slate-200/80"
                          >
                            <div className="sm:col-span-5 flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0 tabular-nums">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                value={row.itemName}
                                onChange={(e) =>
                                  handleUpdateRow(row.localId, "itemName", e.target.value)
                                }
                                placeholder="เช่น ค่าบำรุงการศึกษา, ค่าชุดฝึกปฏิบัติการ"
                                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63]"
                              />
                            </div>

                            <div className="sm:col-span-3 relative">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={row.amount}
                                onChange={(e) =>
                                  handleUpdateRow(row.localId, "amount", e.target.value)
                                }
                                placeholder="0"
                                className="w-full pl-3 pr-9 py-2 text-sm font-mono font-semibold text-right text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63] tabular-nums"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                ฿
                              </span>
                            </div>

                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                value={row.note}
                                onChange={(e) =>
                                  handleUpdateRow(row.localId, "note", e.target.value)
                                }
                                placeholder="หมายเหตุย่อย"
                                className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#162C63]"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.localId)}
                                title="ลบรายการนี้"
                                aria-label="ลบรายการนี้"
                                className="p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add Row Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#162C63] bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มรายการค่าใช้จ่าย</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Summary Footer Row */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm text-slate-700 tabular-nums">
                        รวม{" "}
                        <span className="font-semibold text-slate-900">
                          {activeDraftItems.filter((i) => i.itemName.trim()).length}
                        </span>{" "}
                        รายการ · ยอดรวมสุทธิ{" "}
                        <span className="font-semibold text-[#162C63] text-base">
                          {activeTotal.toLocaleString("th-TH")} บาท
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!confirmCopyAll ? (
                          <button
                            type="button"
                            disabled={saving || activeDraftItems.length === 0}
                            onClick={() => setConfirmCopyAll(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>ใช้รายการนี้กับทุกสาขา ({regularLevelTab})</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs">
                            <span className="text-amber-900 font-medium">
                              ยืนยันคัดลอกทับทุกสาขา {regularLevelTab}?
                            </span>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleSaveRegular(true)}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer"
                            >
                              ยืนยัน
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCopyAll(false)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveRegular(false)}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" strokeWidth={1.75} />
                          )}
                          <span>บันทึกรายการสาขานี้</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
