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
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ภาพรวมสถิติการรับสมัคร
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E3A8A] text-white">
              ปีการศึกษา {data.academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบบบริหารการรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            title="รีเฟรชข้อมูล"
            className="p-2 text-slate-600 hover:text-[#1E3A8A] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก ศธ.02 / RMS</span>
          </Link>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Users className="w-4 h-4" />
            <span>จัดการผู้สมัคร</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">ยอดผู้สมัครทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{summary.totalApplications}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>โควตา: <strong className="text-slate-800">{summary.quotaApplications}</strong></span>
              <span>•</span>
              <span>รอบปกติ: <strong className="text-slate-800">{summary.regularApplications}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Levels */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">แยกตามระดับชั้น</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {summary.pvocApplications + summary.pvsApplications}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>ปวช.: <strong className="text-slate-800">{summary.pvocApplications}</strong></span>
              <span>•</span>
              <span>ปวส.: <strong className="text-slate-800">{summary.pvsApplications}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 3: Selection Status */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">สถานะการคัดเลือก</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600">{summary.approvedCount}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-amber-600">รอตรวจ: <strong>{summary.pendingCount}</strong></span>
              <span>•</span>
              <span className="text-rose-600">ไม่ผ่าน: <strong>{summary.rejectedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Round Status */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">รอบรับสมัครปัจจุบัน</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#1E3A8A] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-black text-slate-900 truncate">
              {activeRound?.name || "ไม่มีรอบเปิดรับสมัคร"}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  activeRound?.status === "OPEN"
                    ? "bg-emerald-100 text-emerald-800"
                    : activeRound?.status === "UPCOMING"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {activeRound?.status === "OPEN"
                  ? "● กำลังเปิดรับสมัคร"
                  : activeRound?.status === "UPCOMING"
                  ? "เตรียมเปิดรับ"
                  : "ปิดรับสมัครแล้ว"}
              </span>
              <Link href="/admin/settings" className="text-[#1E3A8A] font-bold hover:underline">
                ตั้งค่า
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Program Quota Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              สถิติยอดผู้สมัครเทียบจำนวนรับรายสาขาวิชา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบจำนวนผู้สมัครกับโควตารับจริง และยอดคงเหลือที่ยังรับได้
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
            {(["ALL", "ปวช.", "ปวส."] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLevelFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  levelFilter === tab
                    ? "bg-white text-[#1E3A8A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "ทั้งหมด" : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-bold">
                <th className="py-3 px-4">รหัสสาขา (ศธ.02)</th>
                <th className="py-3 px-3">ระดับ</th>
                <th className="py-3 px-4">ชื่อสาขาวิชา</th>
                <th className="py-3 px-3 text-center">โควตา</th>
                <th className="py-3 px-3 text-center">รอบปกติ</th>
                <th className="py-3 px-3 text-center text-amber-700">ทบยอด</th>
                <th className="py-3 px-3 text-center font-black">เป้าหมายรับ</th>
                <th className="py-3 px-3 text-center">ผู้สมัคร</th>
                <th className="py-3 px-3 text-center text-emerald-700">อนุมัติแล้ว</th>
                <th className="py-3 px-3 text-center">คงเหลือ</th>
                <th className="py-3 px-4 text-center w-36">ความคืบหน้า</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrograms.map((p) => {
                const isOver = p.totalApplicants > p.targetSeats;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{p.code}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          p.level === "ปวช."
                            ? "bg-sky-50 text-sky-800 border border-sky-200/50"
                            : "bg-indigo-50 text-indigo-800 border border-indigo-200/50"
                        }`}
                      >
                        {p.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {!p.isOpen && (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            ปิดรับ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">{p.quotaSeats}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{p.regularSeats}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      {p.rolloverSeats > 0 ? `+${p.rolloverSeats}` : "0"}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-slate-900 bg-slate-50/50">
                      {p.targetSeats}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#1E3A8A]">
                      {p.totalApplicants}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {p.approvedCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-bold ${
                          p.remainingSeats === 0 ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        {p.remainingSeats}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>{p.percentFilled}%</span>
                          {isOver && <span className="text-amber-600 font-bold">เกินเป้า</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.percentFilled >= 100
                                ? "bg-emerald-500"
                                : p.percentFilled >= 70
                                ? "bg-[#1E3A8A]"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(100, p.percentFilled)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/applications?programId=${p.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:text-indigo-900 hover:underline"
                      >
                        <span>ดูรายชื่อ</span>
                        <ArrowRight className="w-3 h-3" />
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">ใบสมัครล่าสุดในระบบ</h3>
            <p className="text-xs text-slate-500">ผู้สมัครที่ลงทะเบียนเข้ามาล่าสุด 5 รายการ</p>
          </div>
          <Link
            href="/admin/applications"
            className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 font-bold">
                <th className="py-2.5 px-3">เลขที่ใบสมัคร</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                <th className="py-2.5 px-3">บัตรประชาชน</th>
                <th className="py-2.5 px-3">สาขาวิชาที่เลือก</th>
                <th className="py-2.5 px-3">รอบ</th>
                <th className="py-2.5 px-3 text-center">GPAX</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-mono font-bold text-[#1E3A8A]">{app.applicationNo}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{app.applicantName}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{app.cidMasked}</td>
                  <td className="py-3 px-3 text-slate-700">{app.program}</td>
                  <td className="py-3 px-3 text-slate-500">{app.roundName}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">{app.gpax.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}