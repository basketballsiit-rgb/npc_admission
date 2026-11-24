"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/basepath";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import {
  GraduationCap,
  Calendar,
  ClipboardCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Award,
  ChevronRight,
  ShieldCheck,
  Building,
  Wrench,
  Zap,
  Cpu,
  Calculator,
  TrendingUp,
  Laptop,
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

function getProgramMeta(name: string) {
  if (name.includes("ยนต์") || name.includes("เครื่องกล")) {
    return { category: "ช่างอุตสาหกรรม (ยานยนต์)", icon: Wrench };
  }
  if (name.includes("ไฟฟ้า")) {
    return { category: "ช่างอุตสาหกรรม (ไฟฟ้า)", icon: Zap };
  }
  if (name.includes("อิเล็กทรอนิกส์")) {
    return { category: "ช่างอุตสาหกรรม (อิเล็กทรอนิกส์)", icon: Cpu };
  }
  if (name.includes("บัญชี")) {
    return { category: "บริหารธุรกิจ (การบัญชี)", icon: Calculator };
  }
  if (name.includes("ตลาด")) {
    return { category: "บริหารธุรกิจ (การตลาด)", icon: TrendingUp };
  }
  if (name.includes("สารสนเทศ") || name.includes("คอมพิวเตอร์") || name.includes("ดิจิทัล")) {
    return { category: "เทคโนโลยีสารสนเทศ", icon: Laptop };
  }
  return { category: "วิชาชีพเฉพาะทาง", icon: GraduationCap };
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

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans text-slate-800">
      <Navbar />

      {/* Hero: Asymmetric split grounded in Nan Polytechnic College navy & warm brass */}
      <section className="bg-[#162C63] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Institutional headline & focused actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  {openRound
                    ? `เปิดรับสมัคร ${openRound.name} ปีการศึกษา 2570`
                    : "ระบบรับสมัครนักเรียน นักศึกษาใหม่ ปีการศึกษา 2570"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.2] text-white">
                รับสมัครนักเรียน นักศึกษาใหม่
                <span className="block text-amber-300 mt-1">
                  วิทยาลัยสารพัดช่างน่าน
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                เปิดรับสมัครระดับประกาศนียบัตรวิชาชีพ (ปวช.) และประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)
                ประจำปีการศึกษา 2570 ยื่นใบสมัครออนไลน์ได้ใน 3 ขั้นตอนโดยไม่ต้องแนบเอกสารล่วงหน้า
              </p>

              {/* One primary CTA + one secondary CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm sm:text-base transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" strokeWidth={1.75} />
                  <span>สมัครเรียนออนไลน์</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>

                <Link
                  href="/guidance"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm sm:text-base border border-white/20 transition-colors"
                >
                  <Compass className="w-4 h-4 text-amber-300" strokeWidth={1.75} />
                  <span>แบบทดสอบค้นหาสาขาที่ใช่</span>
                </Link>
              </div>

              {/* Quiet tertiary link */}
              <div className="pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-1.5 text-white hover:text-amber-300 underline underline-offset-4 decoration-white/30 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>ตรวจสอบสถานะหรือแก้ไขใบสมัคร</span>
                </Link>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                  <span>ปวช. เรียนฟรีตามนโยบายรัฐ</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.75} />
                  <span>คุ้มครองข้อมูลตาม PDPA</span>
                </span>
              </div>
            </div>

            {/* Right: Live Round Summary & Countdown Panel */}
            <div className="lg:col-span-5">
              <div className="bg-[#112350] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-xs text-slate-300">สถานะรอบรับสมัครปัจจุบัน</p>
                    <p className="text-base font-semibold text-white mt-0.5">
                      {openRound ? openRound.name : "ปีการศึกษา 2570"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-medium shrink-0">
                    {openRound?.canApply ? "เปิดรับสมัคร" : "ติดตามกำหนดการ"}
                  </span>
                </div>

                {openRound && openRound.endAt && (
                  <CountdownTimer
                    targetDate={openRound.endAt}
                    roundName={openRound.name}
                  />
                )}

                <div className="grid grid-cols-2 gap-3 pt-1 text-left">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <p className="text-xs text-slate-300">สาขาที่เปิดรับ</p>
                    <p className="text-2xl font-semibold text-white tabular-nums mt-1">
                      {programs.length || 12}
                      <span className="text-xs font-normal text-slate-300 ml-1">สาขา</span>
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <p className="text-xs text-slate-300">ที่นั่งคงเหลือรวม</p>
                    <p className="text-2xl font-semibold text-amber-300 tabular-nums mt-1">
                      {loading ? "—" : totalRemaining}
                      <span className="text-xs font-normal text-slate-300 ml-1">ที่นั่ง</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        {/* Guidance Callout: Quiet warm institutional strip */}
        <section className="bg-[#FAF8F3] rounded-2xl p-6 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#162C63] text-amber-300 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                ยังไม่แน่ใจว่าจะเลือกเรียนสาขาไหนดี?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                ทำแบบประเมินความถนัด 12 ข้อ เพื่อวิเคราะห์ความเหมาะสมจากกราฟใยแมงมุมทั้ง 6 แผนกวิชา ใช้เวลาประมาณ 1 นาที
              </p>
            </div>
          </div>
          <Link
            href="/guidance"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white font-medium text-sm transition-colors shrink-0"
          >
            <span>เริ่มทำแบบประเมินความถนัด</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </section>

        {/* Program Quotas Section */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                สาขาวิชาที่เปิดรับสมัคร ปีการศึกษา 2570
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {openRound
                  ? `รอบปัจจุบัน: ${openRound.name} — แสดงยอดผู้สมัครและที่นั่งคงเหลือตามจริง`
                  : "แสดงจำนวนที่นั่งและยอดผู้สมัครแยกตามสาขาวิชา"}
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-white text-[#162C63] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทุกระดับ ({programs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ปวช.")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "ปวช."
                    ? "bg-white text-[#162C63] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ปวช. (6 สาขา)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ปวส.")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "ปวส."
                    ? "bg-white text-[#162C63] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ปวส. (6 สาขา)
              </button>
            </div>
          </div>

          {/* Programs Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#162C63] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">กำลังโหลดข้อมูลสาขาวิชาและจำนวนที่นั่ง</p>
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
                const meta = getProgramMeta(prog.name);
                const CategoryIcon = meta.icon;

                return (
                  <article
                    key={prog.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-4">
                      {/* Header: Level badge & Official VOC code */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <CategoryIcon className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                              prog.level === "ปวช."
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                            }`}
                          >
                            ระดับ {prog.level}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          รหัส {prog.code}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{meta.category}</p>
                        <h3 className="font-semibold text-slate-900 text-base leading-snug">
                          {prog.name}
                        </h3>
                      </div>

                      {/* Quota Numbers */}
                      <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-2 bg-slate-50 rounded-lg border border-slate-200/70 tabular-nums">
                        <div>
                          <p className="text-xs text-slate-500">เป้าหมาย</p>
                          <p className="font-semibold text-slate-800 text-sm mt-0.5">
                            {targetSeats}
                          </p>
                        </div>
                        <div className="border-x border-slate-200">
                          <p className="text-xs text-slate-500">สมัครแล้ว</p>
                          <p className="font-semibold text-[#162C63] text-sm mt-0.5">
                            {applicants}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">คงเหลือ</p>
                          <p
                            className={`font-semibold text-sm mt-0.5 ${
                              remaining > 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {remaining}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>สัดส่วนการสมัคร</span>
                          <span className="font-mono font-medium text-slate-700 tabular-nums">
                            {percentFilled}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-[width] duration-300 ${
                              percentFilled >= 90
                                ? "bg-rose-600"
                                : percentFilled >= 70
                                ? "bg-amber-500"
                                : "bg-[#162C63]"
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <Link
                        href={`/apply?programId=${prog.id}&level=${encodeURIComponent(
                          prog.level
                        )}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors"
                      >
                        <span>สมัครสาขานี้</span>
                        <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Admission Rounds Schedule */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 space-y-6">
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
                    ? "bg-[#F8FAFC] border-[#162C63]/30"
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

        {/* Institutional Benefits: Quiet hairline-divided strip instead of 3-card AI template */}
        <section className="bg-white rounded-2xl border border-slate-200/90 divide-y md:divide-y-0 md:divide-x divide-slate-200 grid grid-cols-1 md:grid-cols-3">
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
