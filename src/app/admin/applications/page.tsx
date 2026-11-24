"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/basepath";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  FileSpreadsheet,
  X,
  Phone,
  Building,
  MapPin,
  Calendar,
  Check,
  ShieldAlert,
} from "lucide-react";

interface Application {
  id: string;
  applicationNo: string;
  applicantName: string;
  prefix: string;
  firstName: string;
  lastName: string;
  cidMasked: string;
  birthDate: string;
  phone: string;
  previousSchool: string;
  schoolProvince: string;
  previousEducation: string;
  gpax: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  programId: string;
  program: {
    id: string;
    code: string;
    name: string;
    level: string;
  };
  roundId: string;
  round: {
    id: string;
    name: string;
    roundType: string;
    announceAt: string;
  };
  addressInfo: Record<string, any>;
  appliedAt: string;
  updatedAt: string;
}

interface Round {
  id: string;
  name: string;
  roundType: string;
}

interface Program {
  id: string;
  code: string;
  name: string;
  level: string;
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const initialProgramId = searchParams.get("programId") || "";

  const [applications, setApplications] = useState<Application[]>([]);
  const [allYears, setAllYears] = useState<Array<{ id: string; year: string; isActive: boolean }>>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>(initialProgramId);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"gpax" | "createdAt" | "name">("gpax");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Detail Modal
  const [viewApp, setViewApp] = useState<Application | null>(null);

  // Fetch Programs & Rounds for Filter Dropdowns (scoped by Academic Year)
  const fetchFilterOptions = async (yearId?: string) => {
    try {
      const qs = yearId ? `?academicYearId=${encodeURIComponent(yearId)}` : "";
      const [roundRes, progRes] = await Promise.all([
        fetch(apiUrl(`/api/rounds${qs}`)),
        fetch(apiUrl(`/api/programs${qs}`)),
      ]);
      if (roundRes.ok) {
        const roundData = await roundRes.json();
        const rList = roundData.data || roundData.rounds || [];
        setRounds(rList);
      }
      if (progRes.ok) {
        const progData = await progRes.json();
        const pList = progData.data || progData.programs || [];
        setPrograms(pList);
      }
    } catch (e) {
      console.error("Filter options fetch error:", e);
    }
  };

  // Fetch Applications with current filters
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      if (selectedRound) params.set("roundId", selectedRound);
      if (selectedLevel) params.set("level", selectedLevel);
      if (selectedProgram) params.set("programId", selectedProgram);
      if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(apiUrl(`/api/admin/applications?${params.toString()}`));
      if (!res.ok) throw new Error("ไม่สามารถโหลดรายชื่อผู้สมัครได้");
      const json = await res.json();
      if (json.success) {
        setApplications(json.data);
        if (json.allYears) setAllYears(json.allYears);
        if (!selectedYearId && json.currentYear?.id) {
          setSelectedYearId(json.currentYear.id);
        }
      } else {
        throw new Error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions(selectedYearId || undefined);
  }, [selectedYearId]);

  useEffect(() => {
    fetchApplications();
    setSelectedIds([]); // Reset selection when filters change
  }, [selectedYearId, selectedRound, selectedLevel, selectedProgram, selectedStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  // Select all or toggle single
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(applications.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Update Status (Single or Bulk)
  const handleUpdateStatus = async (ids: string[], newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    const statusLabel = newStatus === "APPROVED" ? "อนุมัติ" : newStatus === "REJECTED" ? "ไม่อนุมัติ" : "เปลี่ยนเป็นรอตรวจสอบ";
    if (!confirm(`ยืนยันการ${statusLabel} ผู้สมัครจำนวน ${ids.length} รายการ?`)) {
      return;
    }

    try {
      setIsUpdating(true);
      setActionSuccessMsg(null);
      const res = await fetch(apiUrl("/api/admin/applications"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: ids,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(json.message);
        setSelectedIds([]);
        if (viewApp && ids.includes(viewApp.id)) {
          setViewApp({ ...viewApp, status: newStatus });
        }
        await fetchApplications();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการปรับสถานะ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              จัดการรายชื่อผู้สมัคร
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E3A8A] text-white">
              {applications.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ค้นหา ตรวจสอบคุณสมบัติ จัดเรียงคะแนน GPAX และอนุมัติผลการรับสมัคร (รองรับการอนุมัติยกล็อต)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApplications}
            title="รีเฟรชข้อมูล"
            className="p-2 text-slate-600 hover:text-[#1E3A8A] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600 hover:text-emerald-900" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, สกุล, เลขที่ใบสมัคร, หรือเบอร์โทร..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>ค้นหา</span>
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Academic Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ปีการศึกษา</label>
            <select
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setSelectedRound("");
                setSelectedProgram("");
              }}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A] bg-white font-semibold text-[#162C63]"
            >
              {allYears.map((y) => (
                <option key={y.id} value={y.id}>
                  ปีการศึกษา {y.year} {y.isActive ? "(ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Round Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">รอบรับสมัคร</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="">ทุกรอบรับสมัคร</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ระดับชั้น</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="">ทุกระดับชั้น</option>
              <option value="ปวช.">ปวช. (ประกาศนียบัตรวิชาชีพ)</option>
              <option value="ปวส.">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</option>
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">สาขาวิชา</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A] bg-white font-medium truncate"
            >
              <option value="">ทุกสาขาวิชา</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.level} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานะ</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PENDING">รอตรวจสอบคุณสมบัติ (PENDING)</option>
              <option value="APPROVED">ผ่านการคัดเลือก (APPROVED)</option>
              <option value="REJECTED">ไม่ผ่านการคัดเลือก (REJECTED)</option>
              <option value="CANCELLED">ยกเลิก / สละสิทธิ์ (CANCELLED)</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> จัดเรียงตาม:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-bold">
              <button
                onClick={() => {
                  setSortBy("gpax");
                  setSortOrder("desc");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  sortBy === "gpax" ? "bg-white text-[#1E3A8A] shadow-xs" : "text-slate-600"
                }`}
              >
                เกรดเฉลี่ย (GPAX มากไปน้อย) ★
              </button>
              <button
                onClick={() => {
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  sortBy === "createdAt" ? "bg-white text-[#1E3A8A] shadow-xs" : "text-slate-600"
                }`}
              >
                วันที่สมัครล่าสุด
              </button>
              <button
                onClick={() => {
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  sortBy === "name" ? "bg-white text-[#1E3A8A] shadow-xs" : "text-slate-600"
                }`}
              >
                ชื่อ ก-ฮ
              </button>
            </div>
          </div>

          {(selectedRound || selectedLevel || selectedProgram || selectedStatus !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRound("");
                setSelectedLevel("");
                setSelectedProgram("");
                setSelectedStatus("ALL");
                setSearchQuery("");
                setSortBy("gpax");
                setSortOrder("desc");
              }}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1E3A8A] text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B] text-slate-900 flex items-center justify-center font-black text-xs">
              {selectedIds.length}
            </div>
            <span className="text-xs font-bold">
              เลือกใบสมัครไว้ทั้งหมด {selectedIds.length} รายการ
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleUpdateStatus(selectedIds, "APPROVED")}
              disabled={isUpdating}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>อนุมัติยกล็อต (Bulk Approve)</span>
            </button>
            <button
              onClick={() => handleUpdateStatus(selectedIds, "REJECTED")}
              disabled={isUpdating}
              className="flex-1 sm:flex-none px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>ไม่อนุมัติ</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      applications.length > 0 && selectedIds.length === applications.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">เลขที่ใบสมัคร</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-3">บัตรประชาชน</th>
                <th className="py-3 px-4">สาขาวิชาที่เลือก</th>
                <th className="py-3 px-3 text-center">GPAX</th>
                <th className="py-3 px-3">โรงเรียนเดิม</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    กำลังโหลดข้อมูลผู้สมัคร...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 text-sm">ไม่พบข้อมูลผู้สมัคร</p>
                        <p className="text-xs text-slate-400">
                          ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือกไว้
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRound("");
                          setSelectedLevel("");
                          setSelectedProgram("");
                          setSelectedStatus("ALL");
                          setSearchQuery("");
                          setSortBy("gpax");
                          setSortOrder("desc");
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ล้างตัวกรองเพื่อดูทั้งหมด</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const isSelected = selectedIds.includes(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(app.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1E3A8A]">
                        {app.applicationNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{app.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{app.cidMasked}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{app.program.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {app.program.level} • {app.round.name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg text-xs">
                          {app.gpax.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                        {app.previousSchool || "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : app.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status === "APPROVED"
                            ? "ผ่านการคัดเลือก"
                            : app.status === "REJECTED"
                            ? "ไม่ผ่าน"
                            : app.status === "CANCELLED"
                            ? "ยกเลิก"
                            : "รอตรวจสอบ"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewApp(app)}
                            title="ดูรายละเอียดฉบับเต็ม"
                            className="p-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {app.status !== "APPROVED" && (
                            <button
                              onClick={() => handleUpdateStatus([app.id], "APPROVED")}
                              title="อนุมัติ"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {app.status !== "REJECTED" && (
                            <button
                              onClick={() => handleUpdateStatus([app.id], "REJECTED")}
                              title="ไม่อนุมัติ"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Application Detail Modal */}
      {viewApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold">
                  NPC
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    ใบสมัครเลขที่ {viewApp.applicationNo}
                  </h3>
                  <p className="text-[11px] text-slate-500">{viewApp.round.name}</p>
                </div>
              </div>
              <button
                onClick={() => setViewApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-slate-600">สถานะปัจจุบัน:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold ${
                    viewApp.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : viewApp.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {viewApp.status === "APPROVED"
                    ? "ผ่านการคัดเลือก (อนุมัติแล้ว)"
                    : viewApp.status === "REJECTED"
                    ? "ไม่ผ่านการคัดเลือก"
                    : "รอตรวจสอบคุณสมบัติ"}
                </span>
              </div>

              {/* Personal Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-[#1E3A8A]">
                  <Users className="w-3.5 h-3.5" /> ข้อมูลส่วนตัวผู้สมัคร
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ชื่อ-สกุล</span>
                    <span className="font-bold text-slate-800">{viewApp.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เลขบัตรประชาชน</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {viewApp.cidMasked}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">วันเดือนปีเกิด</span>
                    <span className="font-medium text-slate-700">{viewApp.birthDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เบอร์โทรศัพท์</span>
                    <span className="font-mono font-medium text-slate-700">{viewApp.phone}</span>
                  </div>
                </div>
              </div>

              {/* Education & Applied Program */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-[#1E3A8A]">
                  <GraduationCap className="w-3.5 h-3.5" /> การศึกษาและสาขาที่สมัคร
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">สาขาวิชาที่เลือก</span>
                    <span className="font-bold text-indigo-950">
                      {viewApp.program.level} {viewApp.program.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      รหัส ศธ.02: {viewApp.program.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เกรดเฉลี่ยสะสม (GPAX)</span>
                    <span className="text-base font-black text-[#1E3A8A]">
                      {viewApp.gpax.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">โรงเรียนเดิม</span>
                    <span className="font-medium text-slate-700">
                      {viewApp.previousSchool || "-"} ({viewApp.schoolProvince || "-"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">วุฒิการศึกษาเดิม</span>
                    <span className="font-medium text-slate-700">
                      {viewApp.previousEducation || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Family & Guardian */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-[#1E3A8A]">
                  <Building className="w-3.5 h-3.5" /> ข้อมูลครอบครัวและผู้ปกครอง
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ชื่อบิดา</span>
                    <span className="font-medium text-slate-800">
                      {viewApp.addressInfo?.fatherName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ชื่อมารดา</span>
                    <span className="font-medium text-slate-800">
                      {viewApp.addressInfo?.motherName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ชื่อผู้ปกครอง</span>
                    <span className="font-medium text-slate-800">
                      {viewApp.addressInfo?.guardianName || "-"} (
                      {viewApp.addressInfo?.guardianRelation || "-"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เบอร์โทรผู้ปกครอง</span>
                    <span className="font-mono font-medium text-slate-800">
                      {viewApp.addressInfo?.guardianPhone || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-[#1E3A8A]">
                  <MapPin className="w-3.5 h-3.5" /> ข้อมูลที่อยู่
                </h4>
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {viewApp.addressInfo?.houseNo
                      ? `บ้านเลขที่ ${viewApp.addressInfo.houseNo} หมู่ ${viewApp.addressInfo.moo || "-"} ตำบล${viewApp.addressInfo.subdistrict || "-"} อำเภอ${viewApp.addressInfo.district || "-"} จังหวัด${viewApp.addressInfo.province || "-"} ${viewApp.addressInfo.postalCode || ""}`
                      : viewApp.addressInfo?.address || "ยังไม่ได้กรอกข้อมูลที่อยู่ละเอียด"}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ยื่นสมัครเมื่อ {new Date(viewApp.appliedAt).toLocaleDateString("th-TH")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus([viewApp.id], "APPROVED")}
                    disabled={isUpdating || viewApp.status === "APPROVED"}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>อนุมัติ (ผ่านคัดเลือก)</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus([viewApp.id], "REJECTED")}
                    disabled={isUpdating || viewApp.status === "REJECTED"}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ไม่อนุมัติ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-medium">
          กำลังเตรียมข้อมูลระบบจัดการผู้สมัคร...
        </div>
      }
    >
      <ApplicationsContent />
    </Suspense>
  );
}