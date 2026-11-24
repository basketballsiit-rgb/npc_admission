"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { apiUrl } from "@/lib/basepath";
import {
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Plus,
  BarChart3,
} from "lucide-react";

interface YearMeta {
  id: string;
  year: string;
  isActive: boolean;
}

interface YearlySummaryItem {
  academicYearId: string;
  year: string;
  isActive: boolean;
  programCount: number;
  totalTargetSeats: number;
  totalQuotaSeats: number;
  totalRegularSeats: number;
  totalApplications: number;
  quotaApplications: number;
  regularApplications: number;
  pvocApplications: number;
  pvsApplications: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  fillRatePct: number;
  approvalRatePct: number;
  guidanceAssessmentsCount: number;
}

interface YearlyProgramStats {
  targetSeats: number;
  quotaSeats: number;
  regularSeats: number;
  totalApplicants: number;
  quotaApplicants: number;
  regularApplicants: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  fillRatePct: number;
  avgGpax: number;
}

interface ProgramMatrixRow {
  key: string;
  code: string;
  level: string;
  name: string;
  byYear: Record<string, YearlyProgramStats>;
  allYearsTotalTarget: number;
  allYearsTotalApplicants: number;
  allYearsTotalApproved: number;
}

interface AnalyticsPayload {
  years: YearMeta[];
  yearlySummary: YearlySummaryItem[];
  programMatrix: ProgramMatrixRow[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [levelFilter, setLevelFilter] = useState<"ALL" | "ปวช." | "ปวส.">("ALL");
  const [selectedProgramKey, setSelectedProgramKey] = useState<string>("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl("/api/admin/analytics"));
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "ไม่สามารถโหลดข้อมูลสถิติรายปีได้");
      }
      setData(json.data);
      setSelectedProgramKey((prev) => {
        if (prev && json.data.programMatrix.some((p: ProgramMatrixRow) => p.key === prev)) {
          return prev;
        }
        return json.data.programMatrix[0]?.key || "";
      });
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: สรุปรายปีการศึกษา
    const yearlyRows = data.yearlySummary.map((y) => ({
      ปีการศึกษา: y.year,
      สถานะ: y.isActive ? "ปีการศึกษาปัจจุบัน" : "ปีการศึกษาที่ผ่านมา",
      จำนวนสาขาที่เปิดรับ: y.programCount,
      เป้าหมายรับรวม: y.totalTargetSeats,
      ผู้สมัครรวม: y.totalApplications,
      รอบโควตาพิเศษ: y.quotaApplications,
      รอบปกติ: y.regularApplications,
      "ระดับ ปวช.": y.pvocApplications,
      "ระดับ ปวส.": y.pvsApplications,
      ผ่านการคัดเลือก: y.approvedCount,
      รอตรวจสอบ: y.pendingCount,
      ไม่ผ่าน: y.rejectedCount,
      "อัตราเติมเต็ม (%)": y.fillRatePct,
      ยอดทำแบบประเมินแนะแนว: y.guidanceAssessmentsCount,
    }));
    const wsYearly = XLSX.utils.json_to_sheet(yearlyRows);
    XLSX.utils.book_append_sheet(wb, wsYearly, "สรุปรายปีการศึกษา");

    // Sheet 2: สถิติแยกตามสาขาวิชารายปี
    const programRows = data.programMatrix.map((p) => {
      const row: Record<string, string | number> = {
        รหัสสาขา: p.code,
        ระดับ: p.level,
        ชื่อสาขาวิชา: p.name,
      };
      for (const yr of data.years) {
        const s = p.byYear[yr.year];
        row[`ปี ${yr.year} - เป้าหมาย`] = s ? s.targetSeats : 0;
        row[`ปี ${yr.year} - สมัคร`] = s ? s.totalApplicants : 0;
        row[`ปี ${yr.year} - อนุมัติ`] = s ? s.approvedCount : 0;
        row[`ปี ${yr.year} - GPAX เฉลี่ย`] = s ? s.avgGpax : 0;
      }
      row["รวมทุกปี - เป้าหมาย"] = p.allYearsTotalTarget;
      row["รวมทุกปี - สมัคร"] = p.allYearsTotalApplicants;
      row["รวมทุกปี - อนุมัติ"] = p.allYearsTotalApproved;
      return row;
    });
    const wsPrograms = XLSX.utils.json_to_sheet(programRows);
    XLSX.utils.book_append_sheet(wb, wsPrograms, "สถิติแยกตามสาขาวิชา");

    const fileName = `npc-admission-yearly-stats-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-[#162C63] mx-auto" />
        <p className="text-sm text-slate-500">กำลังประมวลผลสถิติรายปีการศึกษาและรายสาขาวิชา...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <AlertCircle className="w-9 h-9 text-rose-600 mx-auto" />
        <h2 className="font-semibold text-rose-900">โหลดข้อมูลสถิติรายปีไม่สำเร็จ</h2>
        <p className="text-sm text-rose-700">{error}</p>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const { years, yearlySummary, programMatrix } = data;

  const filteredMatrix = programMatrix.filter((p) => {
    if (levelFilter === "ALL") return true;
    if (levelFilter === "ปวส.") return p.level.includes("ปวส");
    return p.level === levelFilter;
  });

  const activeProgram =
    programMatrix.find((p) => p.key === selectedProgramKey) ||
    filteredMatrix[0] ||
    programMatrix[0];

  // --- SVG Chart 1: Multi-Year Grouped Columns ---
  const maxYearVal = Math.max(
    20,
    ...yearlySummary.map((y) => Math.max(y.totalTargetSeats, y.totalApplications))
  );
  const yearYCeil = Math.ceil(maxYearVal / 50) * 50;
  const yearYTicks = [0, Math.round(yearYCeil / 2), yearYCeil];
  const yChartW = 540;
  const yChartH = 220;
  const yPadL = 42;
  const yPadR = 16;
  const yPadT = 20;
  const yPadB = 38;
  const yPlotW = yChartW - yPadL - yPadR;
  const yPlotH = yChartH - yPadT - yPadB;
  const ySlotW = yPlotW / Math.max(1, yearlySummary.length);
  const yBarW = Math.min(30, Math.max(14, ySlotW * 0.2));

  // --- SVG Chart 2: Selected Program Multi-Year Trend ---
  const progMaxVal = activeProgram
    ? Math.max(
        10,
        ...years.map((yr) => {
          const s = activeProgram.byYear[yr.year];
          return s ? Math.max(s.targetSeats, s.totalApplicants) : 0;
        })
      )
    : 20;
  const progYCeil = Math.ceil(progMaxVal / 10) * 10;
  const progYTicks = [0, Math.round(progYCeil / 2), progYCeil];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            สถิติการรับสมัครรายปีการศึกษาและรายสาขาวิชา
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            เก็บประวัติและเปรียบเทียบแนวโน้มการรับสมัครข้ามปีการศึกษา แยกตามสาขาวิชาและระดับชั้น
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            title="รีเฟรชข้อมูล"
            aria-label="รีเฟรชข้อมูล"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>จัดการปีการศึกษา</span>
          </Link>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
            <span>ส่งออกรายงาน Excel</span>
          </button>
        </div>
      </div>

      {/* BAND 1: Multi-Year Comparison Chart (7 cols) + Yearly Summary Table (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                กราฟเปรียบเทียบยอดรับสมัครรวมแต่ละปีการศึกษา
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รองรับการเปรียบเทียบอัตโนมัติเมื่อเปิดปีการศึกษาใหม่ในอนาคต
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 border border-slate-300" />
                เป้าหมายรับ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#162C63]" />
                ผู้สมัคร
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                อนุมัติแล้ว
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              role="img"
              aria-label={`กราฟเปรียบเทียบยอดรับสมัครรวม ${yearlySummary.length} ปีการศึกษา`}
              viewBox={`0 0 ${yChartW} ${yChartH}`}
              className="w-full min-w-[420px] h-auto block select-none"
            >
              {yearYTicks.map((tick) => {
                const y = yPadT + yPlotH - (tick / yearYCeil) * yPlotH;
                return (
                  <g key={tick}>
                    <line
                      x1={yPadL}
                      y1={y}
                      x2={yChartW - yPadR}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth={1}
                      strokeDasharray={tick === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={yPadL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize={10}
                      className="font-mono"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {yearlySummary.map((yr, idx) => {
                const cx = yPadL + ySlotW * idx + ySlotW / 2;
                const gap = 4;
                const groupW = yBarW * 3 + gap * 2;
                const startX = cx - groupW / 2;

                const tH = (yr.totalTargetSeats / yearYCeil) * yPlotH;
                const aH = (yr.totalApplications / yearYCeil) * yPlotH;
                const pH = (yr.approvedCount / yearYCeil) * yPlotH;

                return (
                  <g key={yr.academicYearId}>
                    {/* Target bar */}
                    <rect
                      x={startX}
                      y={yPadT + yPlotH - tH}
                      width={yBarW}
                      height={Math.max(2, tH)}
                      rx={3}
                      fill="#E2E8F0"
                    />
                    <text
                      x={startX + yBarW / 2}
                      y={yPadT + yPlotH - tH - 4}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize={9.5}
                      className="font-mono"
                    >
                      {yr.totalTargetSeats}
                    </text>

                    {/* Applications bar */}
                    <rect
                      x={startX + yBarW + gap}
                      y={yPadT + yPlotH - aH}
                      width={yBarW}
                      height={Math.max(2, aH)}
                      rx={3}
                      fill="#162C63"
                    />
                    <text
                      x={startX + yBarW + gap + yBarW / 2}
                      y={yPadT + yPlotH - aH - 4}
                      textAnchor="middle"
                      fill="#162C63"
                      fontSize={9.5}
                      fontWeight={700}
                      className="font-mono"
                    >
                      {yr.totalApplications}
                    </text>

                    {/* Approved bar */}
                    <rect
                      x={startX + (yBarW + gap) * 2}
                      y={yPadT + yPlotH - pH}
                      width={yBarW}
                      height={Math.max(2, pH)}
                      rx={3}
                      fill="#059669"
                    />
                    <text
                      x={startX + (yBarW + gap) * 2 + yBarW / 2}
                      y={yPadT + yPlotH - pH - 4}
                      textAnchor="middle"
                      fill="#059669"
                      fontSize={9.5}
                      fontWeight={700}
                      className="font-mono"
                    >
                      {yr.approvedCount}
                    </text>

                    {/* Year Label */}
                    <text
                      x={cx}
                      y={yPadT + yPlotH + 18}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize={11}
                      fontWeight={600}
                    >
                      ปีการศึกษา {yr.year}
                    </text>
                    {yr.isActive && (
                      <text
                        x={cx}
                        y={yPadT + yPlotH + 31}
                        textAnchor="middle"
                        fill="#162C63"
                        fontSize={9.5}
                        fontWeight={600}
                      >
                        (ปัจจุบัน)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Yearly Summary Compact Table (5 cols) */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              สรุปภาพรวมแยกตามปีการศึกษา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงยอดเป้าหมาย ผู้สมัคร ผ่านคัดเลือก และยอดทำแบบประเมินแนะแนว
            </p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">ตารางสรุปภาพรวมการรับสมัครแยกตามปีการศึกษา</caption>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th scope="col" className="py-2.5 px-4 whitespace-nowrap">ปีการศึกษา</th>
                  <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">เป้าหมาย</th>
                  <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">สมัคร</th>
                  <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">อนุมัติ</th>
                  <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">เติมเต็ม</th>
                  <th scope="col" className="py-2.5 px-4 text-right whitespace-nowrap">แนะแนว</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {yearlySummary.map((y) => (
                  <tr key={y.academicYearId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {y.year}
                      {y.isActive && (
                        <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-[#162C63] border border-slate-200">
                          ปัจจุบัน
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">{y.totalTargetSeats}</td>
                    <td className="py-3 px-3 text-right font-semibold text-[#162C63]">
                      {y.totalApplications}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                      {y.approvedCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">{y.fillRatePct}%</td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {y.guidanceAssessmentsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* BAND 2: Per-Program Deep-Dive Inspector */}
      {activeProgram && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-start gap-2.5">
              <BarChart3 className="w-5 h-5 text-[#162C63] mt-0.5 shrink-0" strokeWidth={1.75} />
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  ตรวจสอบสถิติเจาะลึกเฉพาะสาขาวิชา
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลือกสาขาวิชาที่ต้องการตรวจสอบแนวโน้มรายปี ยอดโควตา/รอบปกติ และเกรดเฉลี่ยสะสม (GPAX)
                </p>
              </div>
            </div>

            <select
              value={activeProgram.key}
              onChange={(e) => setSelectedProgramKey(e.target.value)}
              aria-label="เลือกสาขาวิชาเพื่อดูสถิติเจาะลึก"
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-hidden focus:border-[#162C63] cursor-pointer max-w-md"
            >
              {programMatrix.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.code} · {p.level} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Selected Program Multi-Year SVG Chart (6 cols) */}
            <div className="lg:col-span-6 overflow-x-auto">
              <svg
                role="img"
                aria-label={`กราฟสถิติรายปีของ ${activeProgram.name} (${activeProgram.level})`}
                viewBox={`0 0 ${yChartW} ${yChartH}`}
                className="w-full min-w-[380px] h-auto block select-none"
              >
                {progYTicks.map((tick) => {
                  const y = yPadT + yPlotH - (tick / progYCeil) * yPlotH;
                  return (
                    <g key={tick}>
                      <line
                        x1={yPadL}
                        y1={y}
                        x2={yChartW - yPadR}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                        strokeDasharray={tick === 0 ? undefined : "3 3"}
                      />
                      <text
                        x={yPadL - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="#64748B"
                        fontSize={10}
                        className="font-mono"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {years.map((yr, idx) => {
                  const s = activeProgram.byYear[yr.year];
                  const tVal = s?.targetSeats || 0;
                  const aVal = s?.totalApplicants || 0;
                  const pVal = s?.approvedCount || 0;

                  const cx = yPadL + ySlotW * idx + ySlotW / 2;
                  const gap = 4;
                  const groupW = yBarW * 3 + gap * 2;
                  const startX = cx - groupW / 2;

                  const tH = (tVal / progYCeil) * yPlotH;
                  const aH = (aVal / progYCeil) * yPlotH;
                  const pH = (pVal / progYCeil) * yPlotH;

                  return (
                    <g key={yr.id}>
                      <rect
                        x={startX}
                        y={yPadT + yPlotH - tH}
                        width={yBarW}
                        height={Math.max(2, tH)}
                        rx={3}
                        fill="#E2E8F0"
                      />
                      <text
                        x={startX + yBarW / 2}
                        y={yPadT + yPlotH - tH - 4}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize={9.5}
                        className="font-mono"
                      >
                        {tVal}
                      </text>

                      <rect
                        x={startX + yBarW + gap}
                        y={yPadT + yPlotH - aH}
                        width={yBarW}
                        height={Math.max(2, aH)}
                        rx={3}
                        fill="#162C63"
                      />
                      <text
                        x={startX + yBarW + gap + yBarW / 2}
                        y={yPadT + yPlotH - aH - 4}
                        textAnchor="middle"
                        fill="#162C63"
                        fontSize={9.5}
                        fontWeight={700}
                        className="font-mono"
                      >
                        {aVal}
                      </text>

                      <rect
                        x={startX + (yBarW + gap) * 2}
                        y={yPadT + yPlotH - pH}
                        width={yBarW}
                        height={Math.max(2, pH)}
                        rx={3}
                        fill="#059669"
                      />
                      <text
                        x={startX + (yBarW + gap) * 2 + yBarW / 2}
                        y={yPadT + yPlotH - pH - 4}
                        textAnchor="middle"
                        fill="#059669"
                        fontSize={9.5}
                        fontWeight={700}
                        className="font-mono"
                      >
                        {pVal}
                      </text>

                      <text
                        x={cx}
                        y={yPadT + yPlotH + 18}
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize={11}
                        fontWeight={600}
                      >
                        ปี {yr.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Program Breakdown Cards per Year (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500">
                    รหัส {activeProgram.code} · ระดับ {activeProgram.level}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    {activeProgram.name}
                  </h3>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-xs text-slate-500">สะสมทุกปี</span>
                  <p className="text-base font-semibold text-[#162C63]">
                    {activeProgram.allYearsTotalApplicants} / {activeProgram.allYearsTotalTarget} คน
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs tabular-nums">
                {years.map((yr) => {
                  const s = activeProgram.byYear[yr.year];
                  return (
                    <div
                      key={yr.id}
                      className="p-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-slate-900">
                        ปีการศึกษา {yr.year}
                      </span>
                      {s ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                          <span>เป้าหมาย {s.targetSeats}</span>
                          <span className="font-semibold text-[#162C63]">
                            สมัคร {s.totalApplicants} (โควตา {s.quotaApplicants} / ปกติ {s.regularApplicants})
                          </span>
                          <span className="font-semibold text-emerald-700">
                            อนุมัติ {s.approvedCount}
                          </span>
                          <span>
                            GPAX เฉลี่ย {s.avgGpax > 0 ? s.avgGpax.toFixed(2) : "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">ไม่ได้เปิดรับในปีนี้</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BAND 3: Full Cross-Year Program Matrix Table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ตารางสถิติการรับสมัครแยกตามสาขาวิชารายปีการศึกษา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่แถวสาขาวิชาใดก็ได้เพื่อดูกราฟเจาะลึกด้านบน
            </p>
          </div>

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
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              ตารางเปรียบเทียบสถิติการรับสมัครแยกตามสาขาวิชารายปีการศึกษา
            </caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                <th scope="col" className="py-3 px-4 whitespace-nowrap">รหัส</th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap">ระดับ</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">ชื่อสาขาวิชา</th>
                {years.map((yr) => (
                  <th
                    key={yr.id}
                    scope="col"
                    className="py-3 px-4 text-right whitespace-nowrap"
                  >
                    ปี {yr.year} (สมัคร/เป้า)
                  </th>
                ))}
                <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">
                  สะสมทุกปี
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {filteredMatrix.map((p) => {
                const isSelected = activeProgram?.key === p.key;
                return (
                  <tr
                    key={p.key}
                    onClick={() => setSelectedProgramKey(p.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
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
                    <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                    {years.map((yr) => {
                      const s = p.byYear[yr.year];
                      return (
                        <td
                          key={yr.id}
                          className="py-3 px-4 text-right whitespace-nowrap"
                        >
                          {s ? (
                            <div>
                              <span
                                className={
                                  s.totalApplicants > 0
                                    ? "font-semibold text-[#162C63]"
                                    : "text-slate-500"
                                }
                              >
                                {s.totalApplicants}
                              </span>
                              <span className="text-slate-400"> / {s.targetSeats}</span>
                              {s.approvedCount > 0 && (
                                <span className="ml-1.5 text-xs text-emerald-700 font-medium">
                                  (อนุมัติ {s.approvedCount})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap bg-slate-50/60">
                      {p.allYearsTotalApplicants}
                      <span className="text-slate-400 font-normal">
                        {" "}
                        / {p.allYearsTotalTarget}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
