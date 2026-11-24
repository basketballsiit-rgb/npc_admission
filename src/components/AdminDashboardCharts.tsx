"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface ProgramStatItem {
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
}

export interface DashboardSummary {
  totalApplications: number;
  quotaApplications: number;
  regularApplications: number;
  pvocApplications: number;
  pvsApplications: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

interface AdminDashboardChartsProps {
  summary: DashboardSummary;
  programs: ProgramStatItem[];
  activeRound?: {
    name: string;
    status: "UPCOMING" | "OPEN" | "CLOSED";
    endAt: string;
  };
  levelFilter: "ALL" | "ปวช." | "ปวส.";
}

function shortenProgramLabel(name: string): string {
  return name
    .replace(/^สาขาวิชา/, "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

export default function AdminDashboardCharts({
  summary,
  programs,
  activeRound,
  levelFilter,
}: AdminDashboardChartsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalTargetSeats = programs.reduce((acc, p) => acc + (p.targetSeats || 0), 0);
  const totalApplicantsInView = programs.reduce((acc, p) => acc + (p.totalApplicants || 0), 0);
  const totalApprovedInView = programs.reduce((acc, p) => acc + (p.approvedCount || 0), 0);
  const totalRemainingInView = programs.reduce((acc, p) => acc + (p.remainingSeats || 0), 0);

  const overallFillPct =
    totalTargetSeats > 0
      ? Math.min(100, Math.round((totalApplicantsInView / totalTargetSeats) * 100))
      : 0;

  // --- 1. Column Bar Chart Geometry (Target vs Applicants vs Approved per Program) ---
  const maxVal = Math.max(
    10,
    ...programs.map((p) => Math.max(p.targetSeats || 0, p.totalApplicants || 0))
  );
  // Round Y-axis ceiling to nice step of 10
  const yCeiling = Math.ceil(maxVal / 10) * 10;
  const yTicks = [0, Math.round(yCeiling / 2), yCeiling];

  const chartW = 680;
  const chartH = 240;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 54;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const count = Math.max(1, programs.length);
  const slotW = plotW / count;
  const barW = Math.min(28, Math.max(12, slotW * 0.56));

  const hoveredProgram = programs.find((p) => p.id === hoveredId) || null;

  // --- 2. 270-degree Radial Gauge Geometry ---
  const gaugeR = 52;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeSweep = gaugeCirc * 0.75; // 270 degrees
  const gaugeFillLen = (overallFillPct / 100) * gaugeSweep;

  // --- 3. Level Share Donut Geometry (ปวช. vs ปวส.) ---
  const levelTotal = summary.pvocApplications + summary.pvsApplications;
  const pvocTargetSeats = programs
    .filter((p) => p.level === "ปวช.")
    .reduce((s, p) => s + p.targetSeats, 0);
  const pvsTargetSeats = programs
    .filter((p) => p.level.includes("ปวส"))
    .reduce((s, p) => s + p.targetSeats, 0);

  const pvocShare =
    levelTotal > 0 ? summary.pvocApplications / levelTotal : 0;
  const pvsShare =
    levelTotal > 0 ? summary.pvsApplications / levelTotal : 0;

  const donutR = 40;
  const donutCirc = 2 * Math.PI * donutR;
  const pvocArc = pvocShare * donutCirc;
  const pvsArc = pvsShare * donutCirc;

  // --- 4. Selection Status Stacked Bar ---
  const statusTotal =
    summary.approvedCount + summary.pendingCount + summary.rejectedCount;
  const approvedPct =
    statusTotal > 0 ? (summary.approvedCount / statusTotal) * 100 : 0;
  const pendingPct =
    statusTotal > 0 ? (summary.pendingCount / statusTotal) * 100 : 0;
  const rejectedPct =
    statusTotal > 0 ? (summary.rejectedCount / statusTotal) * 100 : 0;

  // --- 5. Quota vs Regular Seats & Applicants ---
  const totalQuotaSeats = programs.reduce((s, p) => s + p.quotaSeats, 0);
  const totalRegularSeats = programs.reduce((s, p) => s + p.regularSeats, 0);
  const quotaPct =
    totalQuotaSeats > 0
      ? Math.min(100, Math.round((summary.quotaApplications / totalQuotaSeats) * 100))
      : 0;
  const regularPct =
    totalRegularSeats > 0
      ? Math.min(100, Math.round((summary.regularApplications / totalRegularSeats) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* BAND 1 & 2: Asymmetric 12-col Hero Analytics Row (8 cols Primary Chart + 4 cols Lead Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Primary Column Chart (8 cols) */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                กราฟเปรียบเทียบเป้าหมายรับกับยอดผู้สมัครรายสาขา
                {levelFilter !== "ALL" ? ` (${levelFilter})` : ""}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แท่งสีเทาคือเป้าหมายรับจริง แท่งสีกรมท่าคือยอดผู้สมัครปัจจุบัน (ชี้ที่แท่งเพื่อดูรายละเอียด)
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3.5 text-xs text-slate-600 shrink-0">
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

          {/* Interactive Detail Strip (Zero layout jump) */}
          <div className="min-h-[28px] px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
            {hoveredProgram ? (
              <>
                <span className="font-semibold text-slate-900">
                  {hoveredProgram.code} · {hoveredProgram.name} ({hoveredProgram.level})
                </span>
                <div className="flex items-center gap-3 text-slate-700">
                  <span>เป้าหมาย {hoveredProgram.targetSeats}</span>
                  <span className="font-semibold text-[#162C63]">
                    สมัคร {hoveredProgram.totalApplicants}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    อนุมัติ {hoveredProgram.approvedCount}
                  </span>
                  <span>คงเหลือ {hoveredProgram.remainingSeats}</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-slate-600">
                  รวม {programs.length} สาขาวิชาที่แสดงผล
                </span>
                <div className="flex items-center gap-3 text-slate-700">
                  <span>เป้าหมายรวม {totalTargetSeats} ที่นั่ง</span>
                  <span className="font-semibold text-[#162C63]">
                    สมัครรวม {totalApplicantsInView}
                  </span>
                  <span>คงเหลือ {totalRemainingInView}</span>
                </div>
              </>
            )}
          </div>

          {/* Inline SVG Column Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              role="img"
              aria-label={`กราฟแท่งเปรียบเทียบเป้าหมายรับรวม ${totalTargetSeats} ที่นั่ง กับผู้สมัครรวม ${totalApplicantsInView} คน จากทั้งหมด ${programs.length} สาขาวิชา`}
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full min-w-[520px] h-auto block select-none"
            >
              {/* Horizontal Y-Axis Gridlines */}
              {yTicks.map((tick) => {
                const y = padT + plotH - (tick / yCeiling) * plotH;
                return (
                  <g key={tick}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth={1}
                      strokeDasharray={tick === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={padL - 8}
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

              {/* Bars per Program */}
              {programs.map((p, idx) => {
                const cx = padL + slotW * idx + slotW / 2;
                const x = cx - barW / 2;
                const targetH = (p.targetSeats / yCeiling) * plotH;
                const targetY = padT + plotH - targetH;

                const appH = Math.min(plotH, (p.totalApplicants / yCeiling) * plotH);
                const appY = padT + plotH - appH;

                const apprH = Math.min(plotH, (p.approvedCount / yCeiling) * plotH);
                const apprY = padT + plotH - apprH;

                const isHovered = hoveredId === p.id;
                const shortName = shortenProgramLabel(p.name);
                const labelText =
                  shortName.length > 9 ? `${shortName.slice(0, 8)}…` : shortName;

                return (
                  <g
                    key={p.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      setHoveredId((prev) => (prev === p.id ? null : p.id))
                    }
                  >
                    {/* Invisible hover column hit target */}
                    <rect
                      x={padL + slotW * idx}
                      y={padT}
                      width={slotW}
                      height={plotH + padB}
                      fill={isHovered ? "rgba(22, 44, 99, 0.04)" : "transparent"}
                      rx={6}
                    />

                    {/* Target Seats Bar (Background track) */}
                    <rect
                      x={x}
                      y={targetY}
                      width={barW}
                      height={Math.max(2, targetH)}
                      rx={4}
                      fill={isHovered ? "#CBD5E1" : "#E2E8F0"}
                    />

                    {/* Applicants Bar */}
                    {p.totalApplicants > 0 && (
                      <rect
                        x={x}
                        y={appY}
                        width={barW}
                        height={Math.max(3, appH)}
                        rx={4}
                        fill="#162C63"
                      />
                    )}

                    {/* Approved Bar (overlay bottom segment) */}
                    {p.approvedCount > 0 && (
                      <rect
                        x={x}
                        y={apprY}
                        width={barW}
                        height={Math.max(3, apprH)}
                        rx={4}
                        fill="#059669"
                      />
                    )}

                    {/* Numeric count above target bar */}
                    <text
                      x={cx}
                      y={Math.min(targetY, appY) - 5}
                      textAnchor="middle"
                      fill={p.totalApplicants > 0 ? "#162C63" : "#64748B"}
                      fontSize={10}
                      fontWeight={p.totalApplicants > 0 ? 700 : 500}
                      className="font-mono"
                    >
                      {p.totalApplicants}/{p.targetSeats}
                    </text>

                    {/* X-Axis Program Code */}
                    <text
                      x={cx}
                      y={padT + plotH + 16}
                      textAnchor="middle"
                      fill={isHovered ? "#162C63" : "#334155"}
                      fontSize={10}
                      fontWeight={isHovered ? 700 : 600}
                      className="font-mono"
                    >
                      {p.code}
                    </text>

                    {/* X-Axis Short Thai Name */}
                    <text
                      x={cx}
                      y={padT + plotH + 31}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize={9.5}
                    >
                      {labelText}
                    </text>

                    {/* Level indicator dot/text */}
                    <text
                      x={cx}
                      y={padT + plotH + 44}
                      textAnchor="middle"
                      fill={p.level === "ปวช." ? "#475569" : "#B45309"}
                      fontSize={9}
                      fontWeight={600}
                    >
                      {p.level}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Hero Lead Metric + 270-degree Radial Gauge (4 cols) */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                อัตราการเติมเต็มที่นั่งรวม
              </p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums mt-1 leading-none">
                {summary.totalApplications}
                <span className="text-sm font-normal text-slate-500 ml-1.5">
                  / {totalTargetSeats} ที่นั่ง
                </span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${
                activeRound?.status === "OPEN"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : activeRound?.status === "UPCOMING"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeRound?.status === "OPEN"
                    ? "bg-emerald-600"
                    : activeRound?.status === "UPCOMING"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
              />
              {activeRound?.status === "OPEN"
                ? "เปิดรับสมัคร"
                : activeRound?.status === "UPCOMING"
                ? "เตรียมเปิดรับ"
                : "ปิดรับแล้ว"}
            </span>
          </div>

          {/* 270-degree Radial SVG Gauge */}
          <div className="flex items-center justify-center py-1">
            <svg
              role="img"
              aria-label={`อัตราการรับสมัครรวม ${overallFillPct} เปอร์เซ็นต์ (${summary.totalApplications} จาก ${totalTargetSeats} ที่นั่ง)`}
              viewBox="0 0 140 124"
              className="w-40 h-36 block select-none"
            >
              <g transform="translate(70, 70) rotate(135)">
                {/* Background 270° track */}
                <circle
                  cx={0}
                  cy={0}
                  r={gaugeR}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={11}
                  strokeDasharray={`${gaugeSweep} ${gaugeCirc}`}
                  strokeLinecap="round"
                />
                {/* Filled progress arc */}
                {overallFillPct > 0 && (
                  <circle
                    cx={0}
                    cy={0}
                    r={gaugeR}
                    fill="none"
                    stroke={overallFillPct >= 90 ? "#059669" : "#162C63"}
                    strokeWidth={11}
                    strokeDasharray={`${gaugeFillLen} ${gaugeCirc}`}
                    strokeLinecap="round"
                  />
                )}
              </g>
              <text
                x={70}
                y={68}
                textAnchor="middle"
                fill="#0F172A"
                fontSize={24}
                fontWeight={700}
                className="font-mono"
              >
                {overallFillPct}%
              </text>
              <text
                x={70}
                y={86}
                textAnchor="middle"
                fill="#64748B"
                fontSize={10.5}
              >
                คงเหลือ {totalRemainingInView} ที่นั่ง
              </text>
            </svg>
          </div>

          {/* Active Round Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="text-slate-500">รอบรับสมัครปัจจุบัน</p>
              <p className="font-semibold text-slate-900 truncate mt-0.5">
                {activeRound?.name || "ไม่มีรอบเปิดรับสมัคร"}
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="text-[#162C63] font-medium hover:underline shrink-0"
            >
              ตั้งค่ารอบ
            </Link>
          </div>
        </section>
      </div>

      {/* BAND 3: Three Distinct Chart Shapes Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Card 3A: Donut Chart — สัดส่วนตามระดับชั้น (ปวช. / ปวส.) */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              สัดส่วนผู้สมัครตามระดับชั้น
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบระดับ ปวช. และ ปวส.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <svg
              role="img"
              aria-label={`ผู้สมัคร ปวช. ${summary.pvocApplications} คน และ ปวส. ${summary.pvsApplications} คน`}
              viewBox="0 0 100 100"
              className="w-24 h-24 shrink-0 select-none"
            >
              <circle
                cx={50}
                cy={50}
                r={donutR}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={12}
              />
              {levelTotal > 0 && (
                <g transform="rotate(-90 50 50)">
                  <circle
                    cx={50}
                    cy={50}
                    r={donutR}
                    fill="none"
                    stroke="#162C63"
                    strokeWidth={12}
                    strokeDasharray={`${pvocArc} ${donutCirc}`}
                  />
                  <circle
                    cx={50}
                    cy={50}
                    r={donutR}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth={12}
                    strokeDasharray={`${pvsArc} ${donutCirc}`}
                    strokeDashoffset={-pvocArc}
                  />
                </g>
              )}
              <text
                x={50}
                y={48}
                textAnchor="middle"
                fill="#0F172A"
                fontSize={16}
                fontWeight={700}
                className="font-mono"
              >
                {levelTotal}
              </text>
              <text
                x={50}
                y={61}
                textAnchor="middle"
                fill="#64748B"
                fontSize={9}
              >
                คน
              </text>
            </svg>

            <div className="flex-1 space-y-2.5 text-xs tabular-nums">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#162C63]" />
                  ระดับ ปวช.
                </span>
                <span className="font-semibold text-slate-900">
                  {summary.pvocApplications}
                  <span className="text-slate-400 font-normal">/{pvocTargetSeats}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600" />
                  ระดับ ปวส.
                </span>
                <span className="font-semibold text-slate-900">
                  {summary.pvsApplications}
                  <span className="text-slate-400 font-normal">/{pvsTargetSeats}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3B: Composition Stacked Bar — สถานะการคัดเลือก */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                สถานะการตรวจสอบใบสมัคร
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สัดส่วนอนุมัติ รอตรวจสอบ และไม่ผ่านเกณฑ์
              </p>
            </div>
            <span className="text-lg font-semibold text-slate-900 tabular-nums">
              {totalApprovedInView}
              <span className="text-xs font-normal text-slate-500 ml-1">อนุมัติ</span>
            </span>
          </div>

          <div className="space-y-3">
            {/* Stacked composition bar */}
            <div
              role="img"
              aria-label={`ผ่านการคัดเลือก ${summary.approvedCount} คน, รอตรวจสอบ ${summary.pendingCount} คน, ไม่ผ่าน ${summary.rejectedCount} คน`}
              className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex"
            >
              {approvedPct > 0 && (
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${approvedPct}%` }}
                />
              )}
              {pendingPct > 0 && (
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${pendingPct}%` }}
                />
              )}
              {rejectedPct > 0 && (
                <div
                  className="h-full bg-rose-600"
                  style={{ width: `${rejectedPct}%` }}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-1">
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/70">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  อนุมัติ
                </span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {summary.approvedCount}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/70">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  รอตรวจ
                </span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {summary.pendingCount}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/70">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  ไม่ผ่าน
                </span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {summary.rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3C: Horizontal Comparative Bars — ประเภทการรับ (โควตา vs รอบปกติ) */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              ยอดสมัครแยกตามประเภทรอบ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบรอบโควตาพิเศษและรอบปกติ
            </p>
          </div>

          <div className="space-y-3.5 text-xs tabular-nums">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">รอบโควตาพิเศษ</span>
                <span className="text-slate-900 font-semibold">
                  {summary.quotaApplications}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    / {totalQuotaSeats} ที่นั่ง ({quotaPct}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#162C63]"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">รอบปกติ</span>
                <span className="text-slate-900 font-semibold">
                  {summary.regularApplications}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    / {totalRegularSeats} ที่นั่ง ({regularPct}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${regularPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
