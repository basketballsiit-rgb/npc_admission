"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl, assetUrl } from "@/lib/basepath";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import {
  Calendar,
  ClipboardCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Award,
  ShieldCheck,
  Building,
  Compass,
} from "lucide-react";

interface ProgramItem {
  id: string;
  code: string;
  level: string;
  name: string;
  isOpen: boolean;
  quotaSeats: number;
  regularSeats: number;
  rolloverSeats: number;
  totalRegularSeats: number;
  currentRoundApplicants: number;
  currentRoundRemainingSeats: number;
  currentRoundTargetSeats: number;
  academicYear: string;
}

interface RoundItem {
  id: string;
  name: string;
  roundType: string;
  startAt: string;
  endAt: string;
  announceAt: string;
  status: "OPEN" | "CLOSED" | "UPCOMING";
  canApply: boolean;
}

function getProgramCategory(name: string): string {
  if (name.includes("ยนต์") || name.includes("เครื่องกล")) {
    return "ช่างอุตสาหกรรม · ยานยนต์";
  }
  if (name.includes("ไฟฟ้า")) {
    return "ช่างอุตสาหกรรม · ไฟฟ้ากำลัง";
  }
  if (name.includes("อิเล็กทรอนิกส์")) {
    return "ช่างอุตสาหกรรม · อิเล็กทรอนิกส์";
  }
  if (name.includes("บัญชี")) {
    return "พาณิชยกรรม · การบัญชี";
  }
  if (name.includes("ตลาด")) {
    return "พาณิชยกรรม · การตลาด";
  }
  if (name.includes("สารสนเทศ") || name.includes("คอมพิวเตอร์") || name.includes("ดิจิทัล")) {
    return "เทคโนโลยีสารสนเทศ";
  }
  return "วิชาชีพเฉพาะทาง";
}

export default function Home() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ปวช." | "ปวส.">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [programsRes, roundsRes] = await Promise.all([
          fetch(apiUrl("/api/programs")),
          fetch(apiUrl("/api/rounds")),
        ]);
        const programsData = await programsRes.json();
        const roundsData = await roundsRes.json();

        if (programsData.success) {
          setPrograms(programsData.data);
        }
        if (roundsData.success) {
          setRounds(roundsData.rounds);
        }
      } catch (err) {
        console.error("Failed to fetch admission data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const openRound = rounds.find((r) => r.canApply) || rounds[0];
  const filteredPrograms = programs.filter((p) => {
    if (activeTab === "ALL") return true;
    return p.level === activeTab;
  });

  const totalRemaining = programs.reduce(
    (sum, p) => sum + (p.currentRoundRemainingSeats || 0),
    0
  );
  const totalTarget = programs.reduce(
    (sum, p) => sum + (p.currentRoundTargetSeats || p.quotaSeats || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans text-slate-800">
      <Navbar />

      {/* Editorial Institutional Hero: Warm paper ground + deep navy seal band */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Clear institutional identity & actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl("/npc-logo-circle.png")}
                  alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-contain border border-slate-200 bg-white shrink-0"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.onerror = null;
                    el.src = assetUrl("/npc-logo.jpg");
                  }}
                />
                <div className="text-xs sm:text-sm text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-900 block">
                    สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
                  </span>
                  <span>
                    {openRound
                      ? `เปิดรับสมัคร ${openRound.name} · ปีการศึกษา 2570`
                      : "ระบบรับสมัครนักเรียน นักศึกษาใหม่ ปีการศึกษา 2570"}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-[-0.02em] leading-[1.2] text-slate-900">
                รับสมัครนักเรียน นักศึกษาใหม่
                <span className="block text-[#162C63] mt-1">
                  วิทยาลัยสารพัดช่างน่าน
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                เปิดรับสมัครระดับประกาศนียบัตรวิชาชีพ (ปวช.) และประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)
                ประจำปีการศึกษา 2570 สมัครออนไลน์ได้ใน 3 ขั้นตอนโดยไม่ต้องแนบเอกสารล่วงหน้า
              </p>

              {/* Primary + Secondary Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white font-semibold text-sm sm:text-base transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" strokeWidth={1.75} />
                  <span>สมัครเรียนออนไลน์</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>

                <Link
                  href="/guidance"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#FAF9F6] hover:bg-slate-100 text-slate-900 font-medium text-sm sm:text-base border border-slate-300 transition-colors"
                >
                  <Compass className="w-4 h-4 text-[#162C63]" strokeWidth={1.75} />
                  <span>แบบทดสอบค้นหาสาขาที่ใช่</span>
                </Link>
              </div>

              {/* Quiet utility links & verified policy commitments */}
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-1.5 text-[#162C63] font-medium hover:underline underline-offset-4"
                >
                  <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>ตรวจสอบสถานะหรือแก้ไขใบสมัคร</span>
                </Link>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" strokeWidth={1.75} />
                  <span>ปวช. เรียนฟรีตามนโยบายรัฐ</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#162C63]" strokeWidth={1.75} />
                  <span>คุ้มครองข้อมูลตาม PDPA</span>
                </span>
              </div>
            </div>

            {/* Right Column: Official Admission Ledger & Live Countdown */}
            <aside className="lg:col-span-5 bg-[#162C63] text-white rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/15">
                <div>
                  <p className="text-xs text-slate-300">รอบการรับสมัครปัจจุบัน</p>
                  <p className="text-lg font-semibold text-white mt-0.5">
                    {openRound ? openRound.name : "ปีการศึกษา 2570"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {openRound?.canApply ? "กำลังเปิดรับสมัคร" : "ติดตามกำหนดการ"}
                </span>
              </div>

              {openRound && openRound.endAt && (
                <CountdownTimer
                  targetDate={openRound.endAt}
                  roundName={openRound.name}
                />
              )}

              <dl className="grid grid-cols-2 divide-x divide-white/15 border-t border-white/15 pt-4 tabular-nums">
                <div className="pr-4">
                  <dt className="text-xs text-slate-300">สาขาที่เปิดรับ</dt>
                  <dd className="text-2xl font-semibold text-white mt-1">
                    {programs.length || 12}
                    <span className="text-xs font-normal text-slate-300 ml-1.5">สาขาวิชา</span>
                  </dd>
                </div>
                <div className="pl-4">
                  <dt className="text-xs text-slate-300">ที่นั่งคงเหลือรอบนี้</dt>
                  <dd className="text-2xl font-semibold text-amber-300 mt-1">
                    {loading ? "—" : totalRemaining}
                    <span className="text-xs font-normal text-slate-300 ml-1.5">
                      / {loading ? "—" : totalTarget} ที่นั่ง
                    </span>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* 3-Step Process Strip + Guidance Link (Replaces generic card wall) */}
        <section
          aria-label="ขั้นตอนการสมัครเรียน"
          className="bg-white rounded-xl border border-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 grid grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-5 space-y-1">
              <span className="font-mono text-xs font-semibold text-[#162C63] tabular-nums">
                ขั้นตอนที่ 1
              </span>
              <h2 className="text-sm font-semibold text-slate-900">กรอกข้อมูลผู้สมัคร</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                เลือกสาขาวิชาที่ต้องการและกรอกประวัติส่วนตัว ไม่ต้องอัปโหลดเอกสารล่วงหน้า
              </p>
            </div>
            <div className="p-5 space-y-1">
              <span className="font-mono text-xs font-semibold text-[#162C63] tabular-nums">
                ขั้นตอนที่ 2
              </span>
              <h2 className="text-sm font-semibold text-slate-900">รับเลขที่ใบสมัคร</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบออกรหัสใบสมัครทันที สามารถกลับมาตรวจสอบหรือแก้ไขข้อมูลได้ตลอดเวลา
              </p>
            </div>
            <div className="p-5 space-y-1">
              <span className="font-mono text-xs font-semibold text-[#162C63] tabular-nums">
                ขั้นตอนที่ 3
              </span>
              <h2 className="text-sm font-semibold text-slate-900">รายงานตัวและมอบตัว</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                นำเอกสารตัวจริงมายื่นที่งานทะเบียนวิทยาลัยตามกำหนดวันประกาศผล
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 p-5 bg-[#FAF8F3] flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                ยังไม่แน่ใจว่าจะเลือกเรียนสาขาไหนดี?
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ทำแบบประเมินความถนัด 12 ข้อ วิเคราะห์กราฟใยแมงมุม 6 แผนกวิชา ใช้เวลา 1 นาที
              </p>
            </div>
            <Link
              href="/guidance"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#162C63] hover:underline underline-offset-4 self-start"
            >
              <span>เริ่มทำแบบประเมินความถนัด</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </section>

        {/* Program Quotas Directory Ledger (Replaces 12-card AI template grid) */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                สาขาวิชาที่เปิดรับสมัคร ปีการศึกษา 2570
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {openRound
                  ? `รอบปัจจุบัน: ${openRound.name} — แสดงยอดผู้สมัครและที่นั่งคงเหลือตามจริง`
                  : "แสดงจำนวนที่นั่งและยอดผู้สมัครแยกตามสาขาวิชา"}
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 self-start md:self-auto">
              {(
                [
                  { id: "ALL", label: `ทุกระดับ (${programs.length})` },
                  { id: "ปวช.", label: "ปวช. (6 สาขา)" },
                  { id: "ปวส.", label: "ปวส. (6 สาขา)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-[#162C63] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-7 h-7 border-2 border-[#162C63] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">กำลังโหลดข้อมูลสาขาวิชาและจำนวนที่นั่ง</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <caption className="sr-only">
                  รายชื่อสาขาวิชาและจำนวนที่นั่งรับสมัคร ปีการศึกษา 2570
                </caption>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                    <th scope="col" className="py-3 px-5 whitespace-nowrap">
                      รหัสสาขา
                    </th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">
                      ระดับ
                    </th>
                    <th scope="col" className="py-3 px-4 whitespace-nowrap">
                      สาขาวิชา / กลุ่มงาน
                    </th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden sm:table-cell">
                      รับทั้งหมด
                    </th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap hidden md:table-cell">
                      สมัครแล้ว
                    </th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                      คงเหลือ
                    </th>
                    <th scope="col" className="py-3 px-4 whitespace-nowrap w-32 hidden lg:table-cell">
                      สัดส่วน
                    </th>
                    <th scope="col" className="py-3 px-5 text-right whitespace-nowrap">
                      สมัครเรียน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 tabular-nums">
                  {filteredPrograms.map((prog) => {
                    const targetSeats = prog.currentRoundTargetSeats || prog.quotaSeats;
                    const remaining = prog.currentRoundRemainingSeats;
                    const applicants = prog.currentRoundApplicants;
                    const percentFilled = Math.min(
                      100,
                      Math.round((applicants / (targetSeats || 1)) * 100)
                    );
                    const categoryLabel = getProgramCategory(prog.name);

                    return (
                      <tr
                        key={prog.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-5 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {prog.code}
                        </td>
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                              prog.level === "ปวช."
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                            }`}
                          >
                            {prog.level}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                            {prog.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {categoryLabel}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right text-slate-700 hidden sm:table-cell">
                          {targetSeats}
                        </td>
                        <td className="py-4 px-3 text-right font-medium text-[#162C63] hidden md:table-cell">
                          {applicants}
                        </td>
                        <td className="py-4 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              remaining > 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {remaining}
                          </span>
                          <span className="text-xs text-slate-400 ml-1 sm:hidden">
                            /{targetSeats}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percentFilled >= 90
                                    ? "bg-rose-600"
                                    : percentFilled >= 70
                                    ? "bg-amber-500"
                                    : "bg-[#162C63]"
                                }`}
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-slate-500 w-9 text-right">
                              {percentFilled}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/apply?programId=${prog.id}&level=${encodeURIComponent(
                              prog.level
                            )}`}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-xs sm:text-sm font-medium transition-colors"
                          >
                            <span>สมัคร</span>
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Admission Rounds Schedule */}
        <section className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 space-y-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#162C63] mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                กำหนดการรับสมัคร ประจำปีการศึกษา 2570
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                วิทยาลัยสารพัดช่างน่านเปิดรับสมัคร 2 รอบหลัก
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rounds.map((round, idx) => (
              <div
                key={round.id}
                className={`p-6 rounded-xl border ${
                  round.canApply
                    ? "bg-[#FAF9F6] border-[#162C63]/30"
                    : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#162C63]">
                    รอบที่ {idx + 1}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      round.status === "OPEN"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : round.status === "UPCOMING"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {round.status === "OPEN"
                      ? "กำลังเปิดรับสมัคร"
                      : round.status === "UPCOMING"
                      ? "เร็วๆ นี้"
                      : "ปิดรับสมัครแล้ว"}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 mb-4">{round.name}</h3>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-200/80 pt-4 tabular-nums">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">ระยะเวลารับสมัคร</span>
                    <span className="font-medium text-slate-900">
                      {new Date(round.startAt).toLocaleDateString("th-TH")} –{" "}
                      {new Date(round.endAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">ประกาศผลการคัดเลือก</span>
                    <span className="font-medium text-amber-800">
                      {new Date(round.announceAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                </div>

                {round.canApply && (
                  <div className="mt-5">
                    <Link
                      href="/apply"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors"
                    >
                      <span>ยื่นใบสมัครรอบนี้</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Institutional Benefits: Quiet hairline-divided strip */}
        <section className="bg-white rounded-xl border border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200 grid grid-cols-1 md:grid-cols-3">
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <Award className="w-4 h-4 text-[#162C63] shrink-0" strokeWidth={1.75} />
              <h3 className="font-semibold text-sm sm:text-base">เรียนฟรีตามนโยบายรัฐ</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ผู้เข้าศึกษาระดับ ปวช. ได้รับการสนับสนุนค่าเล่าเรียน หนังสือเรียน อุปกรณ์การเรียน
              และเครื่องแบบนักเรียนตามเกณฑ์ที่ สอศ. กำหนด
            </p>
          </div>

          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <Briefcase className="w-4 h-4 text-[#162C63] shrink-0" strokeWidth={1.75} />
              <h3 className="font-semibold text-sm sm:text-base">ระบบทวิภาคี มีรายได้ระหว่างเรียน</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ร่วมมือกับสถานประกอบการในจังหวัดน่านและทั่วประเทศ ฝึกงานจริง
              มีเบี้ยเลี้ยงและโอกาสบรรจุงานทันทีหลังสำเร็จการศึกษา
            </p>
          </div>

          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <Building className="w-4 h-4 text-[#162C63] shrink-0" strokeWidth={1.75} />
              <h3 className="font-semibold text-sm sm:text-base">ห้องปฏิบัติการมาตรฐานอุตสาหกรรม</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              จัดการเรียนการสอนเน้นลงมือปฏิบัติจริง ทั้งศูนย์ซ่อมยานยนต์ไฟฟ้า
              ห้องปฏิบัติการคอมพิวเตอร์ และเครื่องมือไฟฟ้าอิเล็กทรอนิกส์ครบชุด
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
