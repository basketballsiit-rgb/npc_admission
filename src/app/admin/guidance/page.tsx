"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  Compass,
  Users,
  MousePointerClick,
  TrendingUp,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Loader2,
  Layers,
  Award,
  Heart,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Share2,
  Zap,
} from "lucide-react";
import { DEPARTMENTS, DepartmentKey, STUDY_MODES, SPECIAL_INTERESTS } from "@/lib/guidance-config";

interface GuidanceData {
  summary: {
    totalAssessments: number;
    clickedApplyCount: number;
    totalSharedCards?: number;
    evRecommendedCount?: number;
    conversionRate: number;
    trackCounts: {
      VOCATIONAL: number;
      HYBRID: number;
      ACADEMIC: number;
    };
    eduCounts: {
      M3: number;
      M6_PVS: number;
    };
    topDeptCounts: Record<string, number>;
    studyModeCounts: {
      NORMAL: number;
      DUAL: number;
      FLEX: number;
    };
    specialInterestCounts: Record<string, number>;
  };
  recentLogs: {
    id: string;
    currentEducation: string;
    schoolName: string | null;
    vocScore: number;
    genScore: number;
    trackResult: string;
    recommendedDept1: string;
    recommendedCode1: string;
    recommendedDept2: string;
    studyModePref: string;
    specialInterest: string;
    clickedApply: boolean;
    sharedCardCount?: number;
    createdAt: string;
  }[];
}

export default function AdminGuidancePage() {
  const [data, setData] = useState<GuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(apiUrl("/api/admin/guidance"));
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (err) {
      console.error("Failed to load guidance statistics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">
          กำลังประมวลผลสถิติงานแนะแนว...
        </p>
      </div>
    );
  }

  const summary = data?.summary;
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>ระบบแนะแนวค้นหาสายเรียนและสาขาที่ใช่ (Career Quiz Analytics)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            รายงานสถิติงานแนะแนวการศึกษา
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สถิติพฤติกรรมและความสนใจของนักเรียนที่ทำแบบประเมิน (ปลอดภัยตามหลัก PDPA 100% ไม่เก็บข้อมูลส่วนบุคคล)
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#1E3A8A]" : ""}`}
          />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Assessments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              ผู้ทำแบบประเมินทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary?.totalAssessments.toLocaleString() || 0}
            <span className="text-xs font-medium text-slate-500 ml-1.5">คน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ม.3: {summary?.eduCounts.M3 || 0} • ม.6/ปวช.3: {summary?.eduCounts.M6_PVS || 0}
          </div>
        </div>

        {/* Card 2: Clicked Apply */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              กดปุ่มสมัครเรียนต่อ
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            {summary?.clickedApplyCount.toLocaleString() || 0}
            <span className="text-xs font-medium text-slate-500 ml-1.5">ครั้ง</span>
          </div>
          <div className="text-[11px] text-slate-400">
            จากหน้าสรุปผลประเมินแนะแนว
          </div>
        </div>

        {/* Card 3: Shared 3D Cards */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              แชร์การ์ดรูปภาพ / สตอรี่
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {(summary?.totalSharedCards || 0).toLocaleString()}
            <span className="text-xs font-medium text-slate-500 ml-1.5">ครั้ง</span>
          </div>
          <div className="text-[11px] text-slate-400">
            บันทึกภาพ/แชร์ให้ผู้ปกครอง
          </div>
        </div>

        {/* Card 4: EV 20143 Recommendations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              แนะนำยานยนต์ไฟฟ้า
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-600">
            {(summary?.evRecommendedCount || 0).toLocaleString()}
            <span className="text-xs font-medium text-slate-500 ml-1.5">คน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            สาขาวิชา 20143 (ปวช.)
          </div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Conversion Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {summary?.conversionRate || 0}%
          </div>
          <div className="text-[11px] text-slate-400">
            ส่งต่อสู่การสมัครเรียนจริง
          </div>
        </div>

        {/* Card 6: Vocational Track Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              สายอาชีพ (Vocational)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {summary?.trackCounts.VOCATIONAL || 0}
            <span className="text-xs font-medium text-slate-500 ml-1.5">คน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ลูกผสม: {summary?.trackCounts.HYBRID || 0} • สามัญ: {summary?.trackCounts.ACADEMIC || 0}
          </div>
        </div>
      </div>

      {/* Grid: 6 Departments Breakdown & Study Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6 Departments Interest (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>สัดส่วนความสนใจ 6 แผนกวิชาหลัก (แนะนำอันดับ 1)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เรียงตามจำนวนผู้ที่ได้ผลประเมินแผนกวิชานี้เป็นอันดับ 1
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {Object.keys(DEPARTMENTS).map((deptKey) => {
              const k = deptKey as DepartmentKey;
              const dept = DEPARTMENTS[k];
              const count = summary?.topDeptCounts[k] || 0;
              const total = summary?.totalAssessments || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{dept.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({dept.pvc.code} / {dept.pvs.code})
                      </span>
                    </div>
                    <span className="font-bold text-slate-700">
                      {count} คน ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: dept.accentColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Study Mode & Special Interests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Study Mode Pref */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-[#1E3A8A]" />
              <span>ความต้องการระบบการเรียน (ข้อ 11)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">
                  ระบบปกติ (เรียนในวิทยาลัยเต็มเวลา)
                </span>
                <span className="font-mono font-bold text-[#1E3A8A]">
                  {summary?.studyModeCounts.NORMAL || 0} คน
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70">
                <span className="font-semibold text-blue-900">
                  ระบบทวิภาคี (เรียนควบคู่ฝึกงานจริง)
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {summary?.studyModeCounts.DUAL || 0} คน
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">
                  ยืดหยุ่นได้ทั้งสองระบบ
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {summary?.studyModeCounts.FLEX || 0} คน
                </span>
              </div>
            </div>
          </div>

          {/* Special Interests */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span>ความสนใจทักษะเสริม / กิจกรรม (ข้อ 12)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(SPECIAL_INTERESTS).map(([key, val]) => {
                const count = summary?.specialInterestCounts[key] || 0;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">
                      {val.label}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {count} คน
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assessment Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1E3A8A]" />
              <span>บันทึกผลการประเมิน 20 รายการล่าสุด (PDPA Safe)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              ไม่แสดงข้อมูลระบุตัวบุคคล เก็บเฉพาะผลคะแนนเพื่อการสถิติ
            </p>
          </div>
          <span className="text-xs text-slate-400">
            แสดง {recentLogs.length} รายการล่าสุด
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/70">
                <th className="py-2.5 px-3">วัน-เวลา</th>
                <th className="py-2.5 px-3">วุฒิ</th>
                <th className="py-2.5 px-3">โรงเรียนเดิม</th>
                <th className="py-2.5 px-3 text-center">คะแนน (อาชีพ:สามัญ)</th>
                <th className="py-2.5 px-3">ผลวิเคราะห์สาย</th>
                <th className="py-2.5 px-3">อันดับ 1 (รหัส)</th>
                <th className="py-2.5 px-3">อันดับ 2</th>
                <th className="py-2.5 px-3 text-center">แชร์การ์ด</th>
                <th className="py-2.5 px-3 text-center">กดสมัครเรียน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลผลการประเมินในระบบ
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => {
                  const dept1 = DEPARTMENTS[log.recommendedDept1 as DepartmentKey];
                  const dept2 = DEPARTMENTS[log.recommendedDept2 as DepartmentKey];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700">
                        {log.currentEducation === "ม.3" ? "ปวช. (ม.3)" : "ปวส. (ม.6/ปวช.3)"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">
                        {log.schoolName || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        <span className="text-[#1E3A8A]">{log.vocScore}</span> :{" "}
                        <span className="text-slate-500">{log.genScore}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.trackResult === "VOCATIONAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.trackResult === "HYBRID"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {log.trackResult === "VOCATIONAL"
                            ? "สายอาชีพ"
                            : log.trackResult === "HYBRID"
                            ? "ลูกผสม"
                            : "สายสามัญ"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {dept1?.shortName || log.recommendedDept1}{" "}
                        <span className="font-mono text-slate-400 text-[11px]">
                          ({log.recommendedCode1})
                        </span>
                        {log.recommendedCode1 === "20143" && (
                          <span className="ml-1 px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold">
                            EV
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {dept2?.shortName || log.recommendedDept2}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {(log.sharedCardCount || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold">
                            <Share2 className="w-3 h-3" />
                            <span>{log.sharedCardCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {log.clickedApply ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>กดสมัครแล้ว</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
