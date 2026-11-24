"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/basepath";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import {
  Users,
  FileSpreadsheet,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  Calendar,
} from "lucide-react";

interface DashboardData {
  academicYear: string;
  academicYearId: string;
  allYears?: Array<{ id: string; year: string; isActive: boolean }>;
  summary: {
    totalApplications: number;
    quotaApplications: number;
    regularApplications: number;
    pvocApplications: number;
    pvsApplications: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
  rounds: Array<{
    id: string;
    name: string;
    roundType: string;
    startAt: string;
    endAt: string;
    announceAt: string;
    isActive: boolean;
    status: "UPCOMING" | "OPEN" | "CLOSED";
  }>;
  programsComparison: Array<{
    id: string;
    code: string;
    level: string;
    name: string;
    isOpen: boolean;
    quotaSeats: number;
    regularSeats: number;
    rolloverSeats: number;
    totalSeats: number;
    targetSeats: number;
    totalApplicants: number;
    approvedCount: number;
    pendingCount: number;
    remainingSeats: number;
    percentFilled: number;
  }>;
  recentApplications: Array<{
    id: string;
    applicationNo: string;
    applicantName: string;
    cidMasked: string;
    program: string;
    roundName: string;
    gpax: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    appliedAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "ปวช." | "ปวส.">("ALL");
  const [sortBy, setSortBy] = useState<"code" | "targetSeats" | "totalApplicants" | "remainingSeats" | "percentFilled">("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchDashboard = async (yearId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const targetId = yearId !== undefined ? yearId : selectedYearId;
      const endpoint = targetId
        ? apiUrl(`/api/admin/dashboard?academicYearId=${encodeURIComponent(targetId)}`)
        : apiUrl("/api/admin/dashboard");
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสถิติได้");
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (!targetId && json.data?.academicYearId) {
          setSelectedYearId(json.data.academicYearId);
        }
        setLastUpdated(
          new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
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
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-bold text-rose-900 text-lg">โหลดข้อมูลแดชบอร์ดไม่สำเร็จ</h3>
        <p className="text-sm text-rose-700">{error || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์"}</p>
        <button
          type="button"
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const { summary, rounds, programsComparison, recentApplications } = data;

  const filteredPrograms = programsComparison
    .filter((p) => {
      if (levelFilter === "ALL") return true;
      if (levelFilter === "ปวส.") return p.level.includes("ปวส");
      return p.level === levelFilter;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "code") return a.code.localeCompare(b.code) * mul;
      return ((a[sortBy] as number) - (b[sortBy] as number)) * mul;
    });

  const handleSort = (
    col: "code" | "targetSeats" | "totalApplicants" | "remainingSeats" | "percentFilled"
  ) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "code" ? "asc" : "desc");
    }
  };

  const activeRound = rounds.find((r) => r.status === "OPEN") || rounds[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            ภาพรวมสถิติการรับสมัคร
          </h1>
          <p className="text-sm text-slate-600 mt-1 tabular-nums">
            ปีการศึกษา {data.academicYear} · ระบบบริหารการรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.allYears && data.allYears.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
              <select
                value={selectedYearId || data.academicYearId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedYearId(nextId);
                  fetchDashboard(nextId);
                }}
                aria-label="เลือกปีการศึกษา"
                className="text-sm font-medium text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {data.allYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    ปีการศึกษา {y.year} {y.isActive ? "(ปัจจุบัน)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => fetchDashboard()}
            title="รีเฟรชข้อมูล"
            aria-label="รีเฟรชข้อมูล"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>ส่งออก ศธ.02 / RMS</span>
          </Link>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>จัดการผู้สมัคร</span>
          </Link>
        </div>
      </div>

      {/* BAND 1, 2 & 3: Interactive Inline SVG Analytics Charts */}
      <AdminDashboardCharts
        summary={summary}
        programs={filteredPrograms}
        activeRound={activeRound}
        levelFilter={levelFilter}
      />

      {/* BAND 4: Program Quota Comparison Table (Sortable) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              สถิติยอดผู้สมัครเทียบจำนวนรับรายสาขาวิชา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบจำนวนผู้สมัครกับโควตารับจริง และยอดคงเหลือ (คลิกหัวคอลัมน์เพื่อเรียงลำดับ)
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-medium self-start sm:self-auto">
            {(["ALL", "ปวช.", "ปวส."] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setLevelFilter(tab)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  levelFilter === tab
                    ? "bg-white text-[#162C63] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "ทั้งหมด" : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <caption className="sr-only">
              ตารางสถิติยอดผู้สมัครเทียบจำนวนรับรายสาขาวิชา ปีการศึกษา {data.academicYear}
            </caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                <th
                  scope="col"
                  aria-sort={sortBy === "code" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="py-3 px-4 whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("code")}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>รหัส</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap">ระดับ</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">ชื่อสาขาวิชา</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden md:table-cell">โควตา</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden md:table-cell">รอบปกติ</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden lg:table-cell">ทบยอด</th>
                <th
                  scope="col"
                  aria-sort={sortBy === "targetSeats" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="py-3 px-3 text-right whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("targetSeats")}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>เป้าหมาย</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={sortBy === "totalApplicants" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="py-3 px-3 text-right whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("totalApplicants")}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>สมัคร</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden sm:table-cell">อนุมัติ</th>
                <th
                  scope="col"
                  aria-sort={sortBy === "remainingSeats" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="py-3 px-3 text-right whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("remainingSeats")}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>คงเหลือ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={sortBy === "percentFilled" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="py-3 px-4 whitespace-nowrap w-36 hidden sm:table-cell"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("percentFilled")}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>ความคืบหน้า</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredPrograms.map((p) => {
                const isOver = p.totalApplicants > p.targetSeats;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.code}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-medium text-xs border ${
                          p.level === "ปวช."
                            ? "bg-slate-50 text-slate-700 border-slate-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        {p.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {!p.isOpen && (
                          <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                            ปิดรับ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums hidden md:table-cell">{p.quotaSeats}</td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums hidden md:table-cell">{p.regularSeats}</td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums hidden lg:table-cell ${
                        p.rolloverSeats > 0 ? "font-medium text-amber-700" : "text-slate-400"
                      }`}
                    >
                      {p.rolloverSeats > 0 ? `+${p.rolloverSeats}` : "0"}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 bg-slate-50/60 tabular-nums">
                      {p.targetSeats}
                    </td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums ${
                        p.totalApplicants > 0 ? "font-semibold text-[#162C63]" : "text-slate-500"
                      }`}
                    >
                      {p.totalApplicants}
                    </td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums hidden sm:table-cell ${
                        p.approvedCount > 0 ? "font-semibold text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {p.approvedCount}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span
                        className={`font-medium ${
                          p.remainingSeats === 0 ? "text-rose-700" : "text-slate-800"
                        }`}
                      >
                        {p.remainingSeats}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                          <span>{p.percentFilled}%</span>
                          {isOver && <span className="text-amber-700 font-medium">เกินเป้า</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.percentFilled >= 100
                                ? "bg-emerald-600"
                                : p.percentFilled >= 70
                                ? "bg-amber-500"
                                : "bg-[#162C63]"
                            }`}
                            style={{ width: `${Math.min(100, p.percentFilled)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/applications?programId=${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#162C63] hover:underline whitespace-nowrap"
                      >
                        <span>ดูรายชื่อ</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">ใบสมัครล่าสุดในระบบ</h3>
            <p className="text-xs text-slate-500 mt-0.5">ผู้สมัครที่ลงทะเบียนเข้ามาล่าสุด 5 รายการ</p>
          </div>
          <Link
            href="/admin/applications"
            className="text-xs font-medium text-[#162C63] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <caption className="sr-only">รายการใบสมัครล่าสุด 5 รายการ</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                <th scope="col" className="py-3 px-4 whitespace-nowrap">เลขที่ใบสมัคร</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">ชื่อ-สกุล</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap hidden md:table-cell">บัตรประชาชน</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">สาขาวิชาที่เลือก</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap hidden lg:table-cell">รอบ</th>
                <th scope="col" className="py-3 px-4 text-right whitespace-nowrap hidden sm:table-cell">GPAX</th>
                <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-sm text-slate-500">
                    ยังไม่มีรายการใบสมัครในรอบการรับสมัครปัจจุบัน
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-[#162C63] tabular-nums whitespace-nowrap">
                      {app.applicationNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {app.applicantName}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap hidden md:table-cell">
                      {app.cidMasked}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{app.program}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap hidden lg:table-cell">{app.roundName}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums hidden sm:table-cell">
                      {app.gpax.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${
                          app.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : app.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {app.status === "APPROVED"
                          ? "ผ่านการคัดเลือก"
                          : app.status === "REJECTED"
                          ? "ไม่ผ่าน"
                          : "รอตรวจสอบ"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BAND 5: Purposeful Cadence Footer Line */}
      <footer className="pt-2 pb-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
        <span>ระบบบริหารการรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน</span>
        <span>{lastUpdated ? `อัปเดตข้อมูลล่าสุดเวลา ${lastUpdated} น.` : "ข้อมูลเรียลไทม์จากฐานข้อมูลระบบ"}</span>
      </footer>
    </div>
  );
}