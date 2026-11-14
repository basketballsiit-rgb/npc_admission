"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import {
  GraduationCap,
  Calendar,
  ClipboardCheck,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building,
  Wrench,
  Zap,
  Cpu,
  Calculator,
  TrendingUp,
  Laptop,
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

function getProgramTheme(name: string, level: string) {
  if (name.includes("ยนต์") || name.includes("เครื่องกล")) {
    return {
      category: "ช่างอุตสาหกรรม (ยานยนต์)",
      borderTop: "border-t-blue-600",
      categoryBadge: "bg-blue-50 text-blue-700 border-blue-200/80",
      iconBg: "bg-blue-100/80 text-blue-700",
      progressBg: "bg-blue-600",
      icon: Wrench,
    };
  }
  if (name.includes("ไฟฟ้า")) {
    return {
      category: "ช่างอุตสาหกรรม (ไฟฟ้า)",
      borderTop: "border-t-amber-500",
      categoryBadge: "bg-amber-50 text-amber-800 border-amber-200/80",
      iconBg: "bg-amber-100/80 text-amber-600",
      progressBg: "bg-amber-500",
      icon: Zap,
    };
  }
  if (name.includes("อิเล็กทรอนิกส์")) {
    return {
      category: "ช่างอุตสาหกรรม (อิเล็กทรอนิกส์)",
      borderTop: "border-t-cyan-600",
      categoryBadge: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
      iconBg: "bg-cyan-100/80 text-cyan-600",
      progressBg: "bg-cyan-600",
      icon: Cpu,
    };
  }
  if (name.includes("บัญชี")) {
    return {
      category: "บริหารธุรกิจ (การบัญชี)",
      borderTop: "border-t-emerald-600",
      categoryBadge: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      iconBg: "bg-emerald-100/80 text-emerald-700",
      progressBg: "bg-emerald-600",
      icon: Calculator,
    };
  }
  if (name.includes("ตลาด")) {
    return {
      category: "บริหารธุรกิจ (การตลาด)",
      borderTop: "border-t-purple-600",
      categoryBadge: "bg-purple-50 text-purple-800 border-purple-200/80",
      iconBg: "bg-purple-100/80 text-purple-700",
      progressBg: "bg-purple-600",
      icon: TrendingUp,
    };
  }
  if (name.includes("สารสนเทศ") || name.includes("คอมพิวเตอร์") || name.includes("ดิจิทัล")) {
    return {
      category: "เทคโนโลยีสารสนเทศ",
      borderTop: "border-t-indigo-600",
      categoryBadge: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
      iconBg: "bg-indigo-100/80 text-indigo-700",
      progressBg: "bg-indigo-600",
      icon: Laptop,
    };
  }
  return {
    category: "วิชาชีพเฉพาะทาง",
    borderTop: "border-t-[#1E3A8A]",
    categoryBadge: "bg-slate-50 text-slate-700 border-slate-200",
    iconBg: "bg-slate-100 text-slate-700",
    progressBg: "bg-[#1E3A8A]",
    icon: GraduationCap,
  };
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
          fetch("/api/programs"),
          fetch("/api/rounds"),
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <Navbar />

      {/* Main Hero & Admission Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-[#1E3A8A] to-[#1e293b] text-white pt-10 pb-16 sm:pb-24">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            {/* Round Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-amber-300">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>
                {openRound
                  ? `เปิดรับสมัครแล้ว: ${openRound.name} ปีการศึกษา 2570`
                  : "ระบบรับสมัครนักเรียน นักศึกษาใหม่ ปีการศึกษา 2570"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              ก้าวสู่อนาคตวิชาชีพที่มั่นคง
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
                วิทยาลัยสารพัดช่างน่าน
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
              เปิดรับสมัครนักเรียน นักศึกษาใหม่ ระดับประกาศนียบัตรวิชาชีพ (ปวช.) และประกาศนียบัตรวิชาชีพชั้นสูง&nbsp;(ปวส.)
              <br className="hidden sm:inline" />
              {" "}ประจำปีการศึกษา 2570 สมัครง่ายใน 3 ขั้นตอน ไม่ต้องแนบเอกสารล่วงหน้า
            </p>

            {/* Live Countdown Timer */}
            {openRound && openRound.endAt && (
              <div className="pt-2">
                <CountdownTimer
                  targetDate={openRound.endAt}
                  roundName={openRound.name}
                />
              </div>
            )}

            {/* 2 Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
              <Link
                href="/apply"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ClipboardCheck className="w-5 h-5 text-slate-950" />
                <span>สมัครเรียนออนไลน์</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/status"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-md transition-all hover:border-white/40"
              >
                <Search className="w-4 h-4 text-slate-300" />
                <span>ตรวจสอบสถานะ / แก้ไขข้อมูล</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>เรียนฟรีตามนโยบายรัฐ (ปวช.)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>ข้อมูลปลอดภัยตามมาตรฐาน PDPA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>ระบบทวิภาคี มีรายได้ระหว่างเรียน</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Quotas Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 z-20 pb-16 space-y-12">
        {/* Filter and Tab Header Card */}
        <div className="bg-slate-50/75 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4 text-[#F59E0B]" />
                แผนการรับสมัครนักศึกษาใหม่
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                สาขาวิชาที่เปิดรับสมัคร ประจำปีการศึกษา 2570
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {openRound
                  ? `รอบปัจจุบัน: ${openRound.name} (ข้อมูลยอดรับและที่นั่งคงเหลือคำนวณแบบเรียลไทม์)`
                  : "แสดงจำนวนที่นั่งและยอดผู้สมัคร"}
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "ALL"
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทุกระดับ ({programs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ปวช.")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "ปวช."
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ปวช. (6 สาขา)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ปวส.")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "ปวส."
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ปวส. (6 สาขา)
              </button>
            </div>
          </div>

          {/* Programs Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">กำลังโหลดข้อมูลสาขาวิชาและจำนวนที่นั่ง...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPrograms.map((prog) => {
                const targetSeats = prog.currentRoundTargetSeats || prog.quotaSeats;
                const remaining = prog.currentRoundRemainingSeats;
                const applicants = prog.currentRoundApplicants;
                const percentFilled = Math.min(
                  100,
                  Math.round((applicants / (targetSeats || 1)) * 100)
                );
                const theme = getProgramTheme(prog.name, prog.level);
                const CategoryIcon = theme.icon;

                return (
                  <div
                    key={prog.id}
                    className={`bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden border-t-4 ${theme.borderTop}`}
                  >
                    <div className="space-y-3.5">
                      {/* Top row with Category Icon, Level badge & Program code */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center flex-shrink-0 shadow-xs`}
                          >
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              prog.level === "ปวช."
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-purple-50 text-purple-800 border border-purple-200"
                            }`}
                          >
                            ระดับ {prog.level}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          รหัส {prog.code}
                        </span>
                      </div>

                      {/* Category tag & Program Title */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          กลุ่มวิชา: {theme.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-[#1E3A8A] transition-colors">
                          {prog.name}
                        </h3>
                      </div>

                      {/* Quota breakdown tags */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2.5 px-2 bg-slate-50/90 rounded-xl border border-slate-200/70">
                        <div className="p-1">
                          <p className="text-slate-400 text-[10px] font-medium">เป้าหมาย</p>
                          <p className="font-bold text-slate-700 text-sm">{targetSeats}</p>
                        </div>
                        <div className="p-1 border-x border-slate-200">
                          <p className="text-slate-400 text-[10px] font-medium">สมัครแล้ว</p>
                          <p className="font-black text-[#1E3A8A] text-sm">{applicants}</p>
                        </div>
                        <div className="p-1">
                          <p className="text-slate-400 text-[10px] font-medium">คงเหลือ</p>
                          <p
                            className={`font-black text-sm ${
                              remaining > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {remaining}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-500">
                          <span>สัดส่วนการสมัคร</span>
                          <span className="font-mono font-bold text-slate-700">{percentFilled}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              percentFilled >= 90
                                ? "bg-rose-500"
                                : percentFilled >= 60
                                ? "bg-amber-500"
                                : theme.progressBg
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-2 border-t border-slate-100">
                      <Link
                        href={`/apply?programId=${prog.id}&level=${encodeURIComponent(
                          prog.level
                        )}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/15 hover:shadow-lg transition-all group-hover:scale-[1.01]"
                      >
                        <span>สมัครสาขานี้</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admission Rounds Schedule Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[#1E3A8A]" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                กำหนดการรับสมัคร ประจำปีการศึกษา 2570
              </h3>
              <p className="text-xs text-slate-500">
                วิทยาลัยสารพัดช่างน่านเปิดรับสมัคร 2 รอบหลัก
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rounds.map((round, idx) => (
              <div
                key={round.id}
                className={`p-6 rounded-2xl border transition-all ${
                  round.canApply
                    ? "bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                    รอบที่ {idx + 1}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      round.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : round.status === "UPCOMING"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {round.status === "OPEN"
                      ? "กำลังเปิดรับสมัคร"
                      : round.status === "UPCOMING"
                      ? "เร็วๆ นี้"
                      : "ปิดรับสมัครแล้ว"}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 mb-4">{round.name}</h4>

                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-200/70 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ระยะเวลารับสมัคร:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(round.startAt).toLocaleDateString("th-TH")} –{" "}
                      {new Date(round.endAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">วันประกาศผลการคัดเลือก:</span>
                    <span className="font-semibold text-amber-700">
                      {new Date(round.announceAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                </div>

                {round.canApply && (
                  <div className="mt-5">
                    <Link
                      href="/apply"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white text-xs font-bold transition-colors"
                    >
                      <span>ยื่นใบสมัครรอบนี้</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits & Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Award className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">เรียนฟรีตามนโยบายรัฐ</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ผู้เข้าศึกษาระดับ ปวช. ได้รับการสนับสนุนค่าเล่าเรียน หนังสือเรียน อุปกรณ์การเรียน
              และเครื่องแบบนักเรียนตามเกณฑ์ที่ สอศ. กำหนด
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">ระบบทวิภาคี รายได้ระหว่างเรียน</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ร่วมมือกับสถานประกอบการชั้นนำทั้งในจังหวัดน่านและทั่วประเทศ ฝึกงานจริง
              มีเบี้ยเลี้ยงและโอกาสได้รับการบรรจุงานทันทีหลังจบการศึกษา
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">เครื่องมือและห้องปฏิบัติการทันสมัย</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              จัดการเรียนการสอนโดยเน้นปฏิบัติจริง (Hands-on Practice) ห้องปฏิบัติการคอมพิวเตอร์
              ศูนย์ซ่อมยานยนต์ และเครื่องมือไฟฟ้าอิเล็กทรอนิกส์มาตรฐานอุตสาหกรรม
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
