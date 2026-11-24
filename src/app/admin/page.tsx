"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/basepath";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  TrendingUp,
  Building2,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  academicYear: string;
  academicYearId: string;
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
  const [levelFilter, setLevelFilter] = useState<"ALL" | "ปวช." | "ปวส.">("ALL");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl("/api/admin/dashboard"));
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสถิติได้");
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
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
          onClick={fetchDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const { summary, rounds, programsComparison, recentApplications } = data;

  const filteredPrograms = programsComparison.filter((p) => {
    if (levelFilter === "ALL") return true;
    if (levelFilter === "ปวส.") return p.level.includes("ปวส");
    return p.level === levelFilter;
  });

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboard}
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

      {/* Unified 4-Column Metric Bar (No decorative icon tiles) */}
      <div className="bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {/* Metric 1: Total */}
        <div className="p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">ยอดผู้สมัครทั้งหมด</span>
          <div className="text-3xl font-semibold text-slate-900 tabular-nums leading-none">
            {summary.totalApplications}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 tabular-nums">
            <span>โควตา {summary.quotaApplications}</span>
            <span>รอบปกติ {summary.regularApplications}</span>
          </div>
        </div>

        {/* Metric 2: Levels */}
        <div className="p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">แยกตามระดับชั้น</span>
          <div className="text-3xl font-semibold text-slate-900 tabular-nums leading-none">
            {summary.pvocApplications + summary.pvsApplications}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 tabular-nums">
            <span>ปวช. {summary.pvocApplications}</span>
            <span>ปวส. {summary.pvsApplications}</span>
          </div>
        </div>

        {/* Metric 3: Selection Status */}
        <div className="p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">ผ่านการคัดเลือก</span>
          <div className="text-3xl font-semibold text-slate-900 tabular-nums leading-none">
            {summary.approvedCount}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 tabular-nums">
            <span className="text-amber-700">รอตรวจ {summary.pendingCount}</span>
            <span className="text-slate-600">ไม่ผ่าน {summary.rejectedCount}</span>
          </div>
        </div>

        {/* Metric 4: Active Round Status */}
        <div className="p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">รอบรับสมัครปัจจุบัน</span>
          <div className="text-lg font-semibold text-slate-900 truncate leading-snug">
            {activeRound?.name || "ไม่มีรอบเปิดรับสมัคร"}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                activeRound?.status === "OPEN"
                  ? "text-emerald-700"
                  : activeRound?.status === "UPCOMING"
                  ? "text-amber-700"
                  : "text-slate-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeRound?.status === "OPEN"
                    ? "bg-emerald-500"
                    : activeRound?.status === "UPCOMING"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
              />
              {activeRound?.status === "OPEN"
                ? "กำลังเปิดรับสมัคร"
                : activeRound?.status === "UPCOMING"
                ? "เตรียมเปิดรับ"
                : "ปิดรับสมัครแล้ว"}
            </span>
            <Link href="/admin/settings" className="text-[#162C63] font-medium hover:underline">
              ตั้งค่า
            </Link>
          </div>
        </div>
      </div>

      {/* Program Quota Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              สถิติยอดผู้สมัครเทียบจำนวนรับรายสาขาวิชา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบจำนวนผู้สมัครกับโควตารับจริง และยอดคงเหลือที่ยังรับได้
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                <th className="py-3 px-4 whitespace-nowrap">รหัส</th>
                <th className="py-3 px-3 whitespace-nowrap">ระดับ</th>
                <th className="py-3 px-4 whitespace-nowrap">ชื่อสาขาวิชา</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">โควตา</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">รอบปกติ</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">ทบยอด</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">เป้าหมาย</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">สมัคร</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">อนุมัติ</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">คงเหลือ</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">ความคืบหน้า</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">จัดการ</th>
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
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums">{p.quotaSeats}</td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums">{p.regularSeats}</td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums ${
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
                      className={`py-3 px-3 text-right tabular-nums ${
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
                    <td className="py-3 px-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                <th className="py-3 px-4 whitespace-nowrap">เลขที่ใบสมัคร</th>
                <th className="py-3 px-4 whitespace-nowrap">ชื่อ-สกุล</th>
                <th className="py-3 px-4 whitespace-nowrap">บัตรประชาชน</th>
                <th className="py-3 px-4 whitespace-nowrap">สาขาวิชาที่เลือก</th>
                <th className="py-3 px-4 whitespace-nowrap">รอบ</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">GPAX</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">สถานะ</th>
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
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {app.cidMasked}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{app.program}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{app.roundName}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums">
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
    </div>
  );
}