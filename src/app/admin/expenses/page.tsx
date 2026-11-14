"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  Coins,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  X,
  Save,
} from "lucide-react";

interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
}

interface ProgramOption {
  code: string;
  name: string;
  level: string;
}

interface ExpenseItem {
  id: string;
  academicYearId: string;
  level: string;
  programCode: string | null;
  itemName: string;
  amount: number;
  note: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [allYears, setAllYears] = useState<AcademicYear[]>([]);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  // Filter
  const [activeLevelFilter, setActiveLevelFilter] = useState<string>("ALL");

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // Form Fields
  const [formLevel, setFormLevel] = useState<string>("ปวช.");
  const [formProgramCode, setFormProgramCode] = useState<string>("");
  const [formItemName, setFormItemName] = useState<string>("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formNote, setFormNote] = useState<string>("");
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

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
        setItems(data.items || []);
        setPrograms(data.programs || []);
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

  const openCreateModal = () => {
    setEditingItem(null);
    setFormLevel(activeLevelFilter === "ALL" ? "ปวช." : activeLevelFilter);
    setFormProgramCode("");
    setFormItemName("");
    setFormAmount(0);
    setFormNote("");
    setFormSortOrder(items.length + 1);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setEditingItem(item);
    setFormLevel(item.level);
    setFormProgramCode(item.programCode || "");
    setFormItemName(item.itemName);
    setFormAmount(item.amount);
    setFormNote(item.note || "");
    setFormSortOrder(item.sortOrder);
    setFormIsActive(item.isActive);
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentYear) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (editingItem) {
        // Update
        const res = await fetch(apiUrl("/api/admin/expenses"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            level: formLevel,
            programCode: formProgramCode || null,
            itemName: formItemName,
            amount: formAmount,
            note: formNote || null,
            sortOrder: formSortOrder,
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("บันทึกการแก้ไขรายการค่าใช้จ่ายเรียบร้อย");
          setModalOpen(false);
          fetchExpenses(currentYear.id);
        } else {
          setErrorMsg(data.message || "ไม่สามารถบันทึกได้");
        }
      } else {
        // Create
        const res = await fetch(apiUrl("/api/admin/expenses"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            academicYearId: currentYear.id,
            level: formLevel,
            programCode: formProgramCode || null,
            itemName: formItemName,
            amount: formAmount,
            note: formNote || null,
            sortOrder: formSortOrder,
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("เพิ่มรายการค่าใช้จ่ายใหม่เรียบร้อย");
          setModalOpen(false);
          fetchExpenses(currentYear.id);
        } else {
          setErrorMsg(data.message || "ไม่สามารถเพิ่มรายการได้");
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ExpenseItem) => {
    try {
      const res = await fetch(apiUrl("/api/admin/expenses"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (item: ExpenseItem) => {
    if (!confirm(`คุณต้องการลบรายการ "${item.itemName}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/expenses?id=${item.id}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`ลบรายการ "${item.itemName}" เรียบร้อย`);
        setItems(items.filter((i) => i.id !== item.id));
      } else {
        setErrorMsg(data.message || "ไม่สามารถลบรายการได้");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("เกิดข้อผิดพลาดในการลบรายการ");
    }
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">
          กำลังโหลดข้อมูลรายการค่าใช้จ่ายแรกเข้า...
        </p>
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    if (activeLevelFilter === "ALL") return true;
    return item.level === activeLevelFilter;
  });

  // Calculate totals per level
  const totalPvc = items
    .filter((i) => i.level === "ปวช." && i.isActive && !i.programCode)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPvs = items
    .filter((i) => i.level === "ปวส." && i.isActive && !i.programCode)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPvsDual = items
    .filter((i) => i.level === "ปวส.ทวิภาคี" && i.isActive && !i.programCode)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>ระบบจัดการค่าใช้จ่ายเบื้องต้นแรกเข้า (Configurable Initial Expenses)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            จัดการรายการค่าใช้จ่ายแรกเข้า วิทยาลัยสารพัดช่างน่าน
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดและปรับแก้รายการค่าใช้จ่ายเบื้องต้นแยกตามระดับชั้น (ปวช., ปวส., ปวส.ทวิภาคี) หรือเฉพาะสาขาวิชา เช่น สาขาวิชายานยนต์ไฟฟ้า (20143)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {allYears.length > 1 && (
            <select
              value={currentYear?.id || ""}
              onChange={(e) => fetchExpenses(e.target.value)}
              className="py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold bg-white"
            >
              {allYears.map((y) => (
                <option key={y.id} value={y.id}>
                  ปีการศึกษา {y.year} {y.isActive ? "(ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchExpenses(currentYear?.id)}
            disabled={refreshing}
            className="p-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#1E3A8A]" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>ระดับ ปวช. (ประมาณการแรกเข้า)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              เรียนฟรี 15 ปี
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalPvc.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ค่าเล่าเรียนฟรีตามนโยบายรัฐ มีเฉพาะค่าชุดฝึกและอุปกรณ์
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>ระดับ ปวส. (ระบบปกติ)</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              กู้ กยศ. ได้
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E3A8A]">
            {totalPvs.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ค่าลงทะเบียนและบำรุงห้องปฏิบัติการเทคโนโลยี
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>ระดับ ปวส.ทวิภาคี</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
              มีรายได้ระหว่างเรียน
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {totalPvsDual.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400">
            เรียนร่วมสถานประกอบการ มีเบี้ยเลี้ยงฝึกปฏิบัติการ
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-6">
        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {["ALL", "ปวช.", "ปวส.", "ปวส.ทวิภาคี"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeLevelFilter === lvl
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lvl === "ALL" ? "ทั้งหมด" : `ระดับ ${lvl}`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            แสดง {filteredItems.length} รายการ
          </span>
        </div>

        {/* Expense Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/70">
                <th className="py-3 px-3 text-center">ลำดับ</th>
                <th className="py-3 px-3">ระดับชั้น</th>
                <th className="py-3 px-4">ชื่อรายการค่าใช้จ่าย</th>
                <th className="py-3 px-3">ขอบเขตสาขาวิชา</th>
                <th className="py-3 px-3 text-right">จำนวนเงิน (บาท)</th>
                <th className="py-3 px-4">หมายเหตุ</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบรายการค่าใช้จ่ายในระดับชั้นที่เลือก
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const programObj = programs.find((p) => p.code === item.programCode);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {item.sortOrder}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.level === "ปวช."
                              ? "bg-amber-100 text-amber-800"
                              : item.level === "ปวส."
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.itemName}
                      </td>
                      <td className="py-3 px-3">
                        {item.programCode ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            <span>รหัส {item.programCode}</span>
                            {programObj && (
                              <span className="text-slate-500 font-sans truncate max-w-[120px]">
                                ({programObj.name})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">ทุกสาขาวิชา</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                        {item.amount === 0 ? (
                          <span className="text-emerald-600 font-bold">0 (ฟรี)</span>
                        ) : (
                          <span className="text-slate-900">{item.amount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {item.note || "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                              <span>เปิดใช้</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                              <span>ปิด</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition"
                            title="แก้ไขรายการ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Item */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "แก้ไขรายการค่าใช้จ่ายแรกเข้า" : "เพิ่มรายการค่าใช้จ่ายแรกเข้าใหม่"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ระดับชั้น <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="ปวช.">ปวช. (ประกาศนียบัตรวิชาชีพ)</option>
                    <option value="ปวส.">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</option>
                    <option value="ปวส.ทวิภาคี">ปวส.ทวิภาคี (เรียนร่วมสถานประกอบการ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ระบุเฉพาะสาขาวิชา (ไม่บังคับ)
                  </label>
                  <select
                    value={formProgramCode}
                    onChange={(e) => setFormProgramCode(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="">ใช้กับทุกสาขาวิชาในระดับนี้</option>
                    {programs
                      .filter((p) => p.level === formLevel)
                      .map((p) => (
                        <option key={p.code} value={p.code}>
                          รหัส {p.code}: {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ชื่อรายการค่าใช้จ่าย <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ค่าบำรุงการศึกษา, ค่าชุดฝึกปฏิบัติการวิชาชีพ"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-right font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">* กรอก 0 หากเป็นรายการฟรี</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ลำดับการแสดงผล (Sort Order)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  หมายเหตุสำหรับผู้ปกครอง / นักเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ฟรีตามนโยบายเรียนฟรี 15 ปี, ชำระวันมอบตัว, กู้ กยศ. ได้"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E3A8A]"
                  />
                  <span>เปิดใช้งานรายการนี้ทันที (แสดงบนหน้าเว็บและบัตรแชร์)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingItem ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
