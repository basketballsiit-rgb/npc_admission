"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Save,
  Sparkles,
  GraduationCap,
  Briefcase,
  Layers,
} from "lucide-react";

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
}

export default function AdminExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [allYears, setAllYears] = useState<AcademicYear[]>([]);

  // Simple numbers per level
  const [pvcAmount, setPvcAmount] = useState<number>(0);
  const [pvsAmount, setPvsAmount] = useState<number>(3500);
  const [pvsDualAmount, setPvsDualAmount] = useState<number>(2500);

  // Optional notes
  const [pvcNote, setPvcNote] = useState<string>("เรียนฟรี 15 ปีตามนโยบายรัฐบาล (ค่าเล่าเรียน 0 บาท)");
  const [pvsNote, setPvsNote] = useState<string>("กู้ยืม กยศ. ได้เต็มจำนวน และผ่อนชำระได้");
  const [pvsDualNote, setPvsDualNote] = useState<string>("ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้ระหว่างเรียน");

  const fetchExpenses = async (yearId?: string) => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const url = yearId
        ? apiUrl(`/api/admin/expenses?academicYearId=${yearId}`)
        : apiUrl("/api/admin/expenses");
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setCurrentYear(data.currentYear);
        setAllYears(data.allYears || []);
        if (data.expenses) {
          setPvcAmount(data.expenses.pvc ?? 0);
          setPvsAmount(data.expenses.pvs ?? 3500);
          setPvsDualAmount(data.expenses.pvsDual ?? 2500);
          if (data.expenses.pvcNote) setPvcNote(data.expenses.pvcNote);
          if (data.expenses.pvsNote) setPvsNote(data.expenses.pvsNote);
          if (data.expenses.pvsDualNote) setPvsDualNote(data.expenses.pvsDualNote);
        }
      } else {
        setErrorMsg(data.message || "ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSaveExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentYear) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(apiUrl("/api/admin/expenses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearId: currentYear.id,
          pvc: Number(pvcAmount) || 0,
          pvs: Number(pvsAmount) || 0,
          pvsDual: Number(pvsDualAmount) || 0,
          pvcNote,
          pvsNote,
          pvsDualNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("บันทึกค่าใช้จ่ายแรกเข้าเรียบร้อยแล้ว");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">
          กำลังโหลดข้อมูลการตั้งค่าค่าใช้จ่ายแรกเข้า...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>ระบบกำหนดค่าใช้จ่ายแรกเข้า (Initial Admission Fee)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            กำหนดค่าใช้จ่ายแรกเข้า
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดตัวเลขค่าใช้จ่ายแรกเข้าสำหรับแต่ละระดับการศึกษา เพื่อแสดงในระบบรับสมัครและระบบแนะแนว
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-[#1E3A8A]" />
            <select
              value={currentYear?.id || ""}
              onChange={(e) => {
                const y = allYears.find((yr) => yr.id === e.target.value);
                if (y) {
                  setCurrentYear(y);
                  fetchExpenses(y.id);
                }
              }}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {allYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  ปีการศึกษา {yr.year} {yr.isActive ? "(ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchExpenses(currentYear?.id)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-[#1E3A8A]" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Simple Form */}
      <form onSubmit={handleSaveExpenses} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: ระดับ ปวช. */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                ระดับ ปวช. (ม.3)
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                ค่าใช้จ่ายแรกเข้า
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                นโยบายเรียนฟรี 15 ปีของรัฐบาล
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                จำนวนเงิน (บาท):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pvcAmount}
                  onChange={(e) => setPvcAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-hidden font-mono font-black text-lg text-slate-900"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">
                * ระบุ 0 บาท หากไม่มีการเรียกเก็บแรกเข้า
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">
                หมายเหตุประกอบ:
              </label>
              <input
                type="text"
                value={pvcNote}
                onChange={(e) => setPvcNote(e.target.value)}
                placeholder="เช่น เรียนฟรี 15 ปีตามนโยบายรัฐบาล"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Card 2: ระดับ ปวส. (ปกติ) */}
          <div className="bg-white p-6 rounded-3xl border-2 border-blue-300 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                ระดับ ปวส. (ปกติ)
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                ค่าใช้จ่ายแรกเข้า
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ผู้จบ ม.6 หรือ ปวช.3
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                จำนวนเงิน (บาท):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pvsAmount}
                  onChange={(e) => setPvsAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-hidden font-mono font-black text-lg text-slate-900"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">
                หมายเหตุประกอบ:
              </label>
              <input
                type="text"
                value={pvsNote}
                onChange={(e) => setPvsNote(e.target.value)}
                placeholder="เช่น กู้ยืม กยศ. ได้เต็มจำนวน"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Card 3: ระดับ ปวส. (ทวิภาคี) */}
          <div className="bg-white p-6 rounded-3xl border-2 border-purple-300 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                ระดับ ปวส. (ทวิภาคี)
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                ค่าใช้จ่ายแรกเข้า
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ฝึกงานสถานประกอบการ มีรายได้
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                จำนวนเงิน (บาท):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pvsDualAmount}
                  onChange={(e) => setPvsDualAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:outline-hidden font-mono font-black text-lg text-slate-900"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">
                หมายเหตุประกอบ:
              </label>
              <input
                type="text"
                value={pvsDualNote}
                onChange={(e) => setPvsDualNote(e.target.value)}
                placeholder="เช่น ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยง"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>บันทึกค่าใช้จ่ายแรกเข้า</span>
          </button>
        </div>
      </form>
    </div>
  );
}
