"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Printer,
  RotateCcw,
  BookOpen,
  Award,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Layers,
  Heart,
  Wrench,
  Check,
  Coins,
  Plus,
} from "lucide-react";
import { apiUrl, assetUrl } from "@/lib/basepath";
import {
  DEPARTMENTS,
  DepartmentKey,
  CurrentEducationInput,
  EducationLevelType,
  STUDY_MODES,
  SPECIAL_INTERESTS,
} from "@/lib/guidance-config";
import {
  GUIDANCE_QUESTIONS,
  calculateAssessmentResult,
  AssessmentResult,
} from "@/lib/guidance-questions";
import RadarChart from "@/components/RadarChart";
import GuidanceShareCardModal from "@/components/GuidanceShareCardModal";

export default function GuidanceQuizPage() {
  const router = useRouter();

  // State: 'welcome' | 'quiz' | 'result'
  const [step, setStep] = useState<"welcome" | "quiz" | "result">("welcome");

  // User input before quiz
  const [currentEducation, setCurrentEducation] =
    useState<CurrentEducationInput>("ม.3");
  const [schoolName, setSchoolName] = useState("");

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Result state
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [savingLog, setSavingLog] = useState(false);

  // Toggle level preview in result (ปวช. vs ปวส.)
  const [selectedLevelView, setSelectedLevelView] =
    useState<EducationLevelType>("ปวช.");

  // Sub-program selection for departments with multiple options (e.g. ช่างยนต์ 20101 vs ยานยนต์ไฟฟ้า 20143)
  const [subProgramTop1, setSubProgramTop1] = useState<string>("20101");
  const [subProgramTop2, setSubProgramTop2] = useState<string>("20101");

  // Share Card 3D Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Tooltip/highlighted department on hover
  const [highlightedDept, setHighlightedDept] = useState<DepartmentKey | null>(
    null
  );

  const currentQ = GUIDANCE_QUESTIONS[currentQIndex];
  const totalQuestions = GUIDANCE_QUESTIONS.length;
  const progressPercent = Math.round(
    ((currentQIndex + 1) / totalQuestions) * 100
  );

  // Sync initial level view with currentEducation
  useEffect(() => {
    if (currentEducation === "ม.3") {
      setSelectedLevelView("ปวช.");
    } else {
      setSelectedLevelView("ปวส.");
    }
  }, [currentEducation]);

  // Handle start quiz
  const handleStartQuiz = () => {
    setStep("quiz");
    setCurrentQIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle select choice
  const handleSelectChoice = (choiceId: string) => {
    const newAnswers = { ...answers, [currentQ.id]: choiceId };
    setAnswers(newAnswers);

    // Auto-advance with smooth transition after 250ms
    setTimeout(() => {
      if (currentQIndex < totalQuestions - 1) {
        setCurrentQIndex(currentQIndex + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Complete quiz
        finishQuiz(newAnswers);
      }
    }, 220);
  };

  // Calculate & save assessment log
  const finishQuiz = async (finalAnswers: Record<number, string>) => {
    const res = calculateAssessmentResult(
      currentEducation,
      schoolName,
      finalAnswers
    );
    setResult(res);
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // หากผู้ทำแบบประเมิน ปวช. มีคะแนนด้านไฟฟ้า/อิเล็กทรอนิกส์ >= 6 หรือเลือก EV ในข้อ 5 ให้แนะนำรหัส 20143 ยานยนต์ไฟฟ้าเป็นหลัก
    let defaultCodeTop1 =
      res.currentEducation === "ม.3"
        ? (res.top1 === "AUTO" && res.preferEv ? "20143" : DEPARTMENTS[res.top1].pvc.code)
        : DEPARTMENTS[res.top1].pvs.code;

    if (res.currentEducation === "ม.3" && res.top1 === "AUTO" && res.preferEv) {
      setSubProgramTop1("20143");
    } else {
      setSubProgramTop1("20101");
    }

    if (res.currentEducation === "ม.3" && res.top2 === "AUTO" && res.preferEv) {
      setSubProgramTop2("20143");
    } else {
      setSubProgramTop2("20101");
    }

    // Save log to backend
    setSavingLog(true);
    try {
      const top2Config = DEPARTMENTS[res.top2];
      const program2 =
        res.currentEducation === "ม.3" ? top2Config.pvc : top2Config.pvs;

      const response = await fetch(apiUrl("/api/guidance"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEducation: res.currentEducation,
          schoolName: res.schoolName,
          vocScore: res.vocScore,
          genScore: res.genScore,
          trackResult: res.trackResult,
          scores: res.scores,
          recommendedDept1: res.top1,
          recommendedCode1: defaultCodeTop1,
          recommendedDept2: res.top2,
          studyModePref: res.studyMode,
          specialInterest: res.specialInterest,
        }),
      });
      const data = await response.json();
      if (data.logId) {
        setLogId(data.logId);
      }
    } catch (e) {
      console.error("Failed to save guidance log:", e);
    } finally {
      setSavingLog(false);
    }
  };

  // Apply button handler: updates clickedApply = true, then navigates
  const handleApplyClick = async (level: EducationLevelType, code: string) => {
    if (logId) {
      try {
        await fetch(apiUrl("/api/guidance"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId, clickedApply: true }),
        });
      } catch (e) {
        console.error("Failed to update clickedApply:", e);
      }
    }
    router.push(`/apply?level=${encodeURIComponent(level)}&code=${encodeURIComponent(code)}`);
  };

  const handleRestartQuiz = () => {
    setAnswers({});
    setCurrentQIndex(0);
    setResult(null);
    setLogId(null);
    setStep("welcome");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-full border border-amber-300 shadow-xs overflow-hidden flex items-center justify-center bg-white p-0.5">
              <img
                src={assetUrl("/npc-logo.jpg")}
                alt="ตราวิทยาลัยสารพัดช่างน่าน"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/npc-logo.jpg";
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <span>NPC Career Discovery</span>
                <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-sm">
                  ระบบแนะแนว
                </span>
              </div>
              <h1 className="text-sm font-black text-[#1E3A8A] leading-tight">
                วิทยาลัยสารพัดช่างน่าน
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-[#1E3A8A] px-3 py-1.5 rounded-xl hover:bg-slate-100 transition hidden sm:inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าหลักรับสมัคร</span>
            </Link>
            <Link
              href="/apply"
              className="text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <span>สมัครเรียน</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-10">
        {/* ======================= STEP 1: WELCOME SCREEN ======================= */}
        {step === "welcome" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight">
                  แบบประเมินค้นหาสายเรียนและสาขาวิชา
                  <span className="block text-[#162C63] mt-1">วิทยาลัยสารพัดช่างน่าน</span>
                </h1>

                <p className="text-sm text-slate-600 leading-relaxed">
                  ยังไม่แน่ใจว่าจะเรียนต่อสาขาไหนดีระหว่าง ช่างยนต์ ไฟฟ้ากำลัง อิเล็กทรอนิกส์ เทคโนโลยีสารสนเทศ การบัญชี หรือการตลาด?
                  ตอบคำถามสั้นๆ 12 ข้อ (ใช้เวลาประมาณ 1 นาที) เพื่อวิเคราะห์ความถนัดและดูผลกราฟใยแมงมุมทั้ง 6 แผนกวิชาทันที
                </p>

                {/* PDPA & Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <strong className="text-slate-900 font-semibold">ไม่เก็บข้อมูลส่วนบุคคล</strong>
                      <p className="text-slate-600 text-xs mt-0.5">ไม่ขอเลขบัตรประชาชนหรือข้อมูลระบุตัวตน</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <Compass className="w-4 h-4 text-[#162C63] shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <strong className="text-slate-900 font-semibold">กราฟใยแมงมุม 6 แผนกวิชา</strong>
                      <p className="text-slate-600 text-xs mt-0.5">แสดงสัดส่วนความถนัดสายอาชีพเทียบกับสายสามัญ</p>
                    </div>
                  </div>
                </div>

                {/* Pre-Quiz Form */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      วุฒิการศึกษาที่กำลังศึกษาอยู่ หรือจบการศึกษาล่าสุด{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentEducation("ม.3")}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          currentEducation === "ม.3"
                            ? "bg-blue-50/70 border-[#1E3A8A] text-[#1E3A8A] ring-2 ring-blue-600/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GraduationCap className={`w-5 h-5 ${currentEducation === "ม.3" ? "text-[#1E3A8A]" : "text-slate-400"}`} />
                          <div>
                            <div className="text-xs font-bold">กำลังศึกษา ม.3</div>
                            <div className="text-[11px] text-slate-500">สมัครเข้าศึกษาต่อระดับ ปวช.</div>
                          </div>
                        </div>
                        {currentEducation === "ม.3" && (
                          <CheckCircle2 className="w-5 h-5 text-[#1E3A8A]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentEducation("ม.6_ปวช.3")}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          currentEducation === "ม.6_ปวช.3"
                            ? "bg-blue-50/70 border-[#1E3A8A] text-[#1E3A8A] ring-2 ring-blue-600/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Award className={`w-5 h-5 ${currentEducation === "ม.6_ปวช.3" ? "text-[#1E3A8A]" : "text-slate-400"}`} />
                          <div>
                            <div className="text-xs font-bold">ม.6 / ปวช.3 / กศน.</div>
                            <div className="text-[11px] text-slate-500">สมัครเข้าศึกษาต่อระดับ ปวส.</div>
                          </div>
                        </div>
                        {currentEducation === "ม.6_ปวช.3" && (
                          <CheckCircle2 className="w-5 h-5 text-[#1E3A8A]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อโรงเรียนเดิมหรือสถาบันเดิม{" "}
                      <span className="text-slate-400 font-normal">(ระบุหรือไม่ระบุก็ได้)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="เช่น รร.สตรีศรีน่าน, รร.นันทบุรีวิทยา ฯลฯ"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E3A8A] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartQuiz}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-blue-800 hover:from-blue-900 hover:to-indigo-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>เริ่มทำแบบประเมิน (12 ข้อ)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= STEP 2: QUIZ SCREEN ======================= */}
        {step === "quiz" && currentQ && (
          <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
            {/* Top Navigation & Progress */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    if (currentQIndex > 0) {
                      setCurrentQIndex(currentQIndex - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      setStep("welcome");
                    }
                  }}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentQIndex === 0 ? "กลับหน้าแรก" : "ข้อก่อนหน้า"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#1E3A8A]">
                    ข้อ {currentQIndex + 1} / {totalQuestions}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-amber-600">{progressPercent}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1E3A8A] via-blue-600 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Part Badge */}
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  {currentQ.partTitle}
                </span>
                {currentQ.subtitle && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    * {currentQ.subtitle}
                  </p>
                )}
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.id}. {currentQ.question}
              </h2>

              {/* Choices */}
              <div className="space-y-3 pt-2">
                {currentQ.choices.map((choice) => {
                  const isSelected = answers[currentQ.id] === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleSelectChoice(choice.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 border-[#1E3A8A] shadow-xs ring-2 ring-blue-600/20 translate-x-1"
                          : "bg-white border-slate-200/90 text-slate-700 hover:border-blue-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          isSelected
                            ? "bg-[#1E3A8A] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {choice.label}
                      </span>
                      <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                        {choice.text}
                      </div>
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================= STEP 3: RESULT SCREEN ======================= */}
        {step === "result" && result && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            {/* Action Bar (Top) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  ✓
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900">
                    วิเคราะห์ผลการประเมินเสร็จสมบูรณ์
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    วุฒิที่เลือก: {result.currentEducation === "ม.3" ? "ม.3 (ระดับ ปวช.)" : "ม.6/ปวช.3 (ระดับ ปวส.)"}
                    {result.schoolName ? ` • ${result.schoolName}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>สร้างการ์ดรูปภาพ 3D / สตอรี่</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ / บันทึก PDF</span>
                </button>
                <button
                  onClick={handleRestartQuiz}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ทำแบบประเมินใหม่</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: VOC vs GEN TRACK CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-base font-black text-slate-900">
                  สัดส่วนความถนัด: สายอาชีพ (Vocational) เทียบ สายสามัญ (Academic)
                </h3>
              </div>

              {/* Progress Comparison Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#1E3A8A]">
                    <span className="w-3 h-3 rounded-full bg-[#1E3A8A]"></span>
                    สายอาชีพ (เน้นลงมือปฏิบัติจริง) : {result.vocScore} / 12 คะแนน ({Math.round((result.vocScore / 12) * 100)}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                    สายสามัญ (เน้นทฤษฎีวิชาการ) : {result.genScore} / 12 คะแนน ({Math.round((result.genScore / 12) * 100)}%)
                  </span>
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-[#1E3A8A] transition-all duration-500"
                    style={{ width: `${(result.vocScore / 12) * 100}%` }}
                    title={`สายอาชีพ: ${result.vocScore} คะแนน`}
                  />
                  <div
                    className="h-full bg-slate-300 transition-all duration-500"
                    style={{ width: `${(result.genScore / 12) * 100}%` }}
                    title={`สายสามัญ: ${result.genScore} คะแนน`}
                  />
                </div>
              </div>

              {/* Result Summary Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  result.trackResult === "VOCATIONAL"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : result.trackResult === "HYBRID"
                    ? "bg-blue-50 border-blue-200 text-blue-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black">{result.trackTitle}</h4>
                  <p className="text-xs mt-1 leading-relaxed text-slate-700">
                    {result.trackDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: RADAR CHART 6 DEPARTMENTS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-black text-slate-900">
                      กราฟใยแมงมุมแสดงความถนัด 6 แผนกวิชาหลัก (Radar Chart)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วิเคราะห์ความสอดคล้องจากทักษะ สไตล์การทำงาน และความสนใจ เต็มแผนกละ 15 คะแนน
                  </p>
                </div>

                {/* Level Toggle Switch */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setSelectedLevelView("ปวช.")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedLevelView === "ปวช."
                        ? "bg-[#1E3A8A] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ระดับ ปวช. (ม.3)
                  </button>
                  <button
                    onClick={() => setSelectedLevelView("ปวส.")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedLevelView === "ปวส."
                        ? "bg-[#1E3A8A] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ระดับ ปวส. (ม.6/ปวช.3)
                  </button>
                </div>
              </div>

              {/* Chart + Horizontal Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* SVG Radar Chart (7 cols) */}
                <div className="lg:col-span-7 flex justify-center">
                  <RadarChart
                    scores={result.scores}
                    maxScore={15}
                    highlightDept={highlightedDept || undefined}
                  />
                </div>

                {/* Horizontal Progress Bars Breakdown (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    สรุปคะแนนเรียงตามลำดับความถนัด
                  </h4>

                  {result.sortedDepartments.map((item, idx) => {
                    const dept = DEPARTMENTS[item.key];
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;

                    return (
                      <div
                        key={item.key}
                        onMouseEnter={() => setHighlightedDept(item.key)}
                        onMouseLeave={() => setHighlightedDept(null)}
                        className={`p-3 rounded-2xl border transition-all ${
                          isTop1
                            ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                            : isTop2
                            ? "bg-blue-50/40 border-blue-200 shadow-xs"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                isTop1
                                  ? "bg-amber-500 text-white"
                                  : isTop2
                                  ? "bg-[#1E3A8A] text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900">
                              {dept.shortName}
                            </span>
                            {isTop1 && (
                              <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-md font-bold">
                                แนะนำอันดับ 1
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-700">
                            {item.score} / 15 ({item.percentage}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop1
                                ? "bg-amber-500"
                                : isTop2
                                ? "bg-[#1E3A8A]"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: RECOMMENDED PROGRAMS (TOP 1 & TOP 2) */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>สาขาวิชาแนะนำที่ตรงกับผลการประเมินของคุณ</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    คลิกปุ่ม &quot;สมัครเรียนสาขานี้ทันที&quot; ระบบจะล็อกเลือกสาขาและระดับการศึกษาให้อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* CARDS: TOP 1 & TOP 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TOP 1 CARD */}
                {(() => {
                  const dept = DEPARTMENTS[result.top1];
                  const hasAlternatives =
                    selectedLevelView === "ปวช." &&
                    dept.alternativePvc &&
                    dept.alternativePvc.length > 0;
                  
                  let prog = selectedLevelView === "ปวช." ? dept.pvc : dept.pvs;
                  if (hasAlternatives && subProgramTop1 === "20143") {
                    const evProg = dept.alternativePvc?.find((a) => a.code === "20143");
                    if (evProg) prog = evProg;
                  }

                  const item = result.sortedDepartments[0];

                  return (
                    <div className="bg-white rounded-3xl p-6 border-2 border-amber-400 shadow-lg relative overflow-hidden flex flex-col justify-between space-y-4">
                      {/* Top Ribbon */}
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-xs">
                        ★ แนะนำอันดับ 1
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${dept.badgeColor}`}>
                            {dept.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            ความถนัด {item.percentage}%
                          </span>
                        </div>

                        {/* Multiple Programs Selector (e.g. ช่างยนต์ vs ยานยนต์ไฟฟ้า EV) */}
                        {hasAlternatives && (
                          <div className="p-2.5 bg-gradient-to-r from-amber-50 to-red-50/50 rounded-2xl border border-amber-200 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>สาขาวิชาที่เปิดรับสมัคร (ระดับ ปวช.):</span>
                              </span>
                              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.2 rounded-full font-bold">
                                เปิด 2 สาขา
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSubProgramTop1("20101")}
                                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                  subProgramTop1 === "20101"
                                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="font-bold text-xs">สาขาช่างยนต์</div>
                                <div className={`text-[10px] font-mono ${subProgramTop1 === "20101" ? "text-blue-200" : "text-slate-400"}`}>
                                  รหัส 20101
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSubProgramTop1("20143")}
                                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                  subProgramTop1 === "20143"
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="font-bold text-xs flex items-center gap-1">
                                  <span>ยานยนต์ไฟฟ้า</span>
                                  <span className={`text-[9px] px-1 rounded font-bold ${subProgramTop1 === "20143" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                                    ⚡ EV
                                  </span>
                                </div>
                                <div className={`text-[10px] font-mono ${subProgramTop1 === "20143" ? "text-amber-100" : "text-slate-400"}`}>
                                  รหัส 20143
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-bold text-slate-500">
                            {prog.levelLabel} • รหัส ศธ.02:{" "}
                            <span className="font-mono text-[#1E3A8A] font-black text-sm">
                              {prog.code}
                            </span>
                            {prog.badge && (
                              <span className="ml-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {prog.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                            {prog.name}
                          </h4>
                        </div>

                        {/* Future Careers */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                            <span>เส้นทางอาชีพในอนาคต</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {dept.futureCareers.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key Strengths */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>จุดเด่นที่คุณจะได้รับการฝึกฝน</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {dept.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleApplyClick(prog.level, prog.code)}
                          className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group cursor-pointer ${
                            prog.code === "20143"
                              ? "bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-600 hover:to-red-700"
                              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                          }`}
                        >
                          <span>
                            สมัครเรียน: {prog.name} (รหัส {prog.code})
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* TOP 2 CARD */}
                {(() => {
                  const dept = DEPARTMENTS[result.top2];
                  const hasAlternatives =
                    selectedLevelView === "ปวช." &&
                    dept.alternativePvc &&
                    dept.alternativePvc.length > 0;

                  let prog = selectedLevelView === "ปวช." ? dept.pvc : dept.pvs;
                  if (hasAlternatives && subProgramTop2 === "20143") {
                    const evProg = dept.alternativePvc?.find((a) => a.code === "20143");
                    if (evProg) prog = evProg;
                  }

                  const item = result.sortedDepartments[1];

                  return (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md relative overflow-hidden flex flex-col justify-between space-y-4">
                      {/* Top Ribbon */}
                      <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[11px] font-black px-4 py-1 rounded-bl-2xl">
                        ทางเลือกใกล้เคียง อันดับ 2
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${dept.badgeColor}`}>
                            {dept.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            ความถนัด {item.percentage}%
                          </span>
                        </div>

                        {/* Multiple Programs Selector for Top 2 */}
                        {hasAlternatives && (
                          <div className="p-2.5 bg-gradient-to-r from-amber-50 to-red-50/50 rounded-2xl border border-amber-200 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>สาขาวิชาที่เปิดรับสมัคร (ระดับ ปวช.):</span>
                              </span>
                              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.2 rounded-full font-bold">
                                เปิด 2 สาขา
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSubProgramTop2("20101")}
                                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                  subProgramTop2 === "20101"
                                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="font-bold text-xs">สาขาช่างยนต์</div>
                                <div className={`text-[10px] font-mono ${subProgramTop2 === "20101" ? "text-blue-200" : "text-slate-400"}`}>
                                  รหัส 20101
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSubProgramTop2("20143")}
                                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                  subProgramTop2 === "20143"
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="font-bold text-xs flex items-center gap-1">
                                  <span>ยานยนต์ไฟฟ้า</span>
                                  <span className={`text-[9px] px-1 rounded font-bold ${subProgramTop2 === "20143" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                                    ⚡ EV
                                  </span>
                                </div>
                                <div className={`text-[10px] font-mono ${subProgramTop2 === "20143" ? "text-amber-100" : "text-slate-400"}`}>
                                  รหัส 20143
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-bold text-slate-500">
                            {prog.levelLabel} • รหัส ศธ.02:{" "}
                            <span className="font-mono text-[#1E3A8A] font-black text-sm">
                              {prog.code}
                            </span>
                            {prog.badge && (
                              <span className="ml-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {prog.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                            {prog.name}
                          </h4>
                        </div>

                        {/* Future Careers */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            <span>เส้นทางอาชีพในอนาคต</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {dept.futureCareers.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key Strengths */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>จุดเด่นที่คุณจะได้รับการฝึกฝน</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {dept.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleApplyClick(prog.level, prog.code)}
                          className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <span>
                            สมัครเรียน: {prog.name} (รหัส {prog.code})
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SECTION: INITIAL EXPENSES & SHARE CARD PROMO */}
            <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50/40 rounded-3xl p-6 sm:p-7 border border-amber-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Coins className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    ค่าใช้จ่ายแรกเข้า
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  {selectedLevelView === "ปวช."
                    ? "✨ ระดับ ปวช. สนับสนุนนโยบายเรียนฟรี 15 ปีอย่างมีคุณภาพ (ค่าเล่าเรียน 0 บาทตลอดหลักสูตร) มีกองทุน กยศ./กรอ. รองรับ"
                    : "✨ ระดับ ปวส. ค่าใช้จ่ายแรกเข้าเป็นไปตามระเบียบกระทรวงศึกษาธิการ สามารถยื่นกู้ กยศ. ได้ และระบบทวิภาคีมีเบี้ยเลี้ยงรายได้ระหว่างเรียน"}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-900 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>บันทึกหรือแชร์ผลลัพธ์ผ่านการ์ดรูปภาพ 3D พื้นหลังคาแรกเตอร์สุดเท่ลง Instagram, TikTok หรือส่งให้เพื่อนได้ทันที</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="shrink-0 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-300" />
                <div className="text-left">
                  <div className="text-[11px] text-blue-200 font-medium">ภาพพื้นหลังการ์ตูน 3D</div>
                  <div className="text-xs font-black">สร้างการ์ดรูปภาพแชร์สตอรี่ / โซเชียล</div>
                </div>
              </button>
            </div>

            {/* SECTION 4: EXTRA GUIDANCE (Q11 & Q12) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Study Mode Box */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Layers className="w-4 h-4 text-[#1E3A8A]" />
                  <span>ระบบการเรียนที่ตอบโจทย์คุณ (จากข้อ 11)</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {STUDY_MODES[result.studyMode]?.label}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {STUDY_MODES[result.studyMode]?.desc}
                </p>
              </div>

              {/* Special Interest Box */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span>ทักษะเสริมและกิจกรรมที่แนะนำ (จากข้อ 12)</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>{SPECIAL_INTERESTS[result.specialInterest]?.label}</span>
                  <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-bold">
                    {SPECIAL_INTERESTS[result.specialInterest]?.tag}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {SPECIAL_INTERESTS[result.specialInterest]?.recommendation}
                </p>
              </div>
            </div>

            {/* Bottom Support Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-[#1E3A8A] to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black">
                  ต้องการปรึกษาคุณครูแนะแนวเพิ่มเติม?
                </h4>
                <p className="text-xs text-blue-200 mt-1">
                  งานแนะแนวอาชีพและการจัดหางาน วิทยาลัยสารพัดช่างน่าน พร้อมให้คำปรึกษารายบุคคลทุกวันทำการ
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/apply"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  ไปที่หน้าฟอร์มรับสมัคร
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
                >
                  หน้าหลัก
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3D Share Card Modal */}
      {result && (
        <GuidanceShareCardModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          result={result}
          selectedCode={subProgramTop1}
          selectedLevel={selectedLevelView}
          logId={logId}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>
          ระบบแนะแนวค้นหาสายเรียนและสาขาที่ใช่ (Career & Major Discovery Quiz) • วิทยาลัยสารพัดช่างน่าน
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          สถิติการประเมินเก็บแบบไม่ระบุตัวบุคคล เพื่อพัฒนาการจัดการศึกษาตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>
      </footer>
    </div>
  );
}
