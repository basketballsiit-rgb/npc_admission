"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/basepath";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  validateThaiCID,
  sanitizeCID,
  maskCID,
} from "@/lib/security";
import {
  PREFIX_OPTIONS,
  PREVIOUS_EDUCATION_OPTIONS,
  THAI_PROVINCES,
  GUARDIAN_RELATION_OPTIONS,
} from "@/lib/constants";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  FileCheck2,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  Phone,
  School,
  IdCard,
  User,
  ShieldCheck,
  Home as HomeIcon,
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
  currentRoundRemainingSeats: number;
  currentRoundTargetSeats: number;
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

function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProgramId = searchParams.get("programId") || "";
  const initialLevel = searchParams.get("level") || "ปวช.";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ข้อมูลตั้งต้นจาก API
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [activeRound, setActiveRound] = useState<RoundItem | null>(null);

  // Form State - ขั้นตอนที่ 1
  const [cidInput, setCidInput] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(initialProgramId);

  // Form State - ขั้นตอนที่ 2
  const [prefix, setPrefix] = useState("นาย");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [schoolProvince, setSchoolProvince] = useState("น่าน");
  const [previousEducation, setPreviousEducation] = useState("มัธยมศึกษาปีที่ 3 (ม.3)");
  const [gpax, setGpax] = useState("");
  const [address, setAddress] = useState("");

  // ข้อมูลครอบครัวและผู้ปกครอง
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("บิดา");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Result State - เมื่อสมัครสำเร็จ (ขั้นตอนที่ 4)
  const [submissionResult, setSubmissionResult] = useState<{
    applicationNo: string;
    applicantName: string;
    cidMasked: string;
    program: string;
    round: string;
    announceAt: string;
    createdAt: string;
    guardianName?: string;
    guardianRelation?: string;
    guardianPhone?: string;
  } | null>(null);

  // โหลดข้อมูลรอบและสาขาวิชา
  useEffect(() => {
    async function loadData() {
      try {
        const [progRes, roundRes] = await Promise.all([
          fetch(apiUrl("/api/programs")),
          fetch(apiUrl("/api/rounds")),
        ]);
        const progData = await progRes.json();
        const roundData = await roundRes.json();

        if (progData.success) {
          setPrograms(progData.data);
          if (!selectedProgramId && progData.data.length > 0) {
            const defaultProg = progData.data.find(
              (p: ProgramItem) => p.level === selectedLevel && p.isOpen
            );
            if (defaultProg) setSelectedProgramId(defaultProg.id);
          }
        }

        if (roundData.success) {
          setRounds(roundData.rounds);
          const current = roundData.rounds.find((r: RoundItem) => r.canApply);
          setActiveRound(current || roundData.rounds[0] || null);
        }
      } catch (err) {
        console.error("Error loading application data:", err);
        setErrorMsg("ไม่สามารถโหลดข้อมูลรอบการรับสมัครได้ กรุณารีเฟรชหน้าเว็บ");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format CID as user types: x-xxxx-xxxxx-xx-x
  const handleCIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    let formatted = raw;
    if (raw.length > 1) formatted = `${raw.slice(0, 1)}-${raw.slice(1)}`;
    if (raw.length > 5) formatted = `${formatted.slice(0, 6)}-${raw.slice(5)}`;
    if (raw.length > 10) formatted = `${formatted.slice(0, 12)}-${raw.slice(10)}`;
    if (raw.length > 12) formatted = `${formatted.slice(0, 15)}-${raw.slice(12)}`;
    setCidInput(formatted);
    setErrorMsg(null);
  };

  const cleanCID = sanitizeCID(cidInput);
  const isCIDValid = cleanCID.length === 13 && validateThaiCID(cleanCID);

  // ตัวกรองสาขาวิชาตามระดับชั้น
  const availablePrograms = programs.filter(
    (p) => p.level === selectedLevel && p.isOpen
  );

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // ตรวจสอบความถูกต้องของขั้นตอนที่ 1
  const handleNextStep1 = async () => {
    setErrorMsg(null);

    if (!isCIDValid) {
      setErrorMsg("กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้องตามสูตรคำนวณของกรมการปกครอง");
      return;
    }

    if (!selectedProgramId) {
      setErrorMsg("กรุณาเลือกสาขาวิชาที่ต้องการสมัคร");
      return;
    }

    if (!activeRound) {
      setErrorMsg("ขณะนี้ยังไม่มีรอบการรับสมัครที่เปิดใช้งาน");
      return;
    }

    // Pre-check duplicate in current round
    try {
      const checkRes = await fetch(apiUrl(`/api/applications/status?cid=${cleanCID}`));
      const checkData = await checkRes.json();

      if (checkRes.status === 200 && checkData.data) {
        const inThisRound = checkData.data.find(
          (app: any) => app.roundName === activeRound.name
        );
        if (inThisRound) {
          setErrorMsg(
            `เลขบัตรประชาชนนี้ได้ยื่นใบสมัครในรอบ "${activeRound.name}" แล้ว (เลขที่ใบสมัคร: ${inThisRound.applicationNo}) หากต้องการแก้ไขข้อมูล กรุณาไปที่เมนูตรวจสอบสถานะ`
          );
          return;
        }

        // หากเป็นรอบปกติและผู้สมัคร APPROVED ในรอบโควตาแล้ว
        if (activeRound.roundType === "REGULAR") {
          const quotaApproved = checkData.data.find(
            (app: any) => app.roundType === "QUOTA" && app.status === "APPROVED"
          );
          if (quotaApproved) {
            setErrorMsg(
              "ท่านผ่านการคัดเลือกในรอบโควตาพิเศษแล้ว จึงไม่สามารถสมัครใหม่ในรอบปกติได้"
            );
            return;
          }
        }
      }
    } catch {
      // ignore network check error and let server-side enforce
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ตรวจสอบความถูกต้องของขั้นตอนที่ 2
  const handleNextStep2 = () => {
    setErrorMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("กรุณากรอกชื่อและนามสกุลของผู้สมัคร");
      return;
    }
    if (!birthDate) {
      setErrorMsg("กรุณาระบุวันเดือนปีเกิด");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setErrorMsg("กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้ให้ถูกต้อง (9-10 หลัก)");
      return;
    }
    if (!previousSchool.trim()) {
      setErrorMsg("กรุณาระบุชื่อสถานศึกษาเดิมที่สำเร็จการศึกษา");
      return;
    }
    const numGpax = parseFloat(gpax);
    if (isNaN(numGpax) || numGpax < 0 || numGpax > 4.0) {
      setErrorMsg("กรุณากรอกเกรดเฉลี่ยสะสม (GPAX) เป็นตัวเลข 0.00 ถึง 4.00");
      return;
    }
    if (!guardianName.trim()) {
      setErrorMsg("กรุณากรอกชื่อ-นามสกุลของผู้ปกครองที่สามารถติดต่อได้");
      return;
    }
    const cleanGuardianPhone = guardianPhone.replace(/\D/g, "");
    if (!guardianPhone.trim() || cleanGuardianPhone.length < 9) {
      setErrorMsg("กรุณากรอกเบอร์โทรศัพท์ของผู้ปกครองให้ถูกต้อง (9-10 หลัก)");
      return;
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ยืนยันการสมัคร (ขั้นตอนที่ 3)
  const handleSubmitApplication = async () => {
    if (!activeRound || !selectedProgram) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(apiUrl("/api/applications"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: activeRound.id,
          programId: selectedProgram.id,
          cid: cleanCID,
          prefix,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate,
          phone: phone.trim(),
          previousSchool: previousSchool.trim(),
          schoolProvince,
          previousEducation,
          gpax: parseFloat(gpax),
          fatherName: fatherName.trim() || undefined,
          motherName: motherName.trim() || undefined,
          guardianName: guardianName.trim(),
          guardianRelation: guardianRelation.trim(),
          guardianPhone: guardianPhone.trim(),
          addressInfo: address.trim() ? { address: address.trim() } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.message || "เกิดข้อผิดพลาดในการบันทึกใบสมัคร กรุณาตรวจสอบข้อมูล");
        return;
      }

      setSubmissionResult({
        ...data.data,
        guardianName: guardianName.trim(),
        guardianRelation: guardianRelation.trim(),
        guardianPhone: guardianPhone.trim(),
      });
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission Error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAppNo = () => {
    if (submissionResult?.applicationNo) {
      navigator.clipboard.writeText(submissionResult.applicationNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-[#1E3A8A]">
            <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
            <span>ระบบรับสมัครออนไลน์ วิทยาลัยสารพัดช่างน่าน (NPC Admission)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            แบบฟอร์มสมัครเรียนออนไลน์ ประจำปีการศึกษา 2570
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activeRound
              ? `เปิดรับสมัคร: ${activeRound.name} (กรอกข้อมูลเพียง 3 ขั้นตอน ไม่ต้องแนบเอกสาร)`
              : "กรอกข้อมูลเพื่อสมัครเรียน"}
          </p>
        </div>

        {/* Stepper indicator (Only show during steps 1-3) */}
        {step <= 3 && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {/* Step 1 Pill */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= 1
                      ? "bg-[#1E3A8A] text-white shadow-md shadow-indigo-900/20"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-xs font-semibold text-center ${
                    step === 1 ? "text-[#1E3A8A]" : "text-slate-500"
                  }`}
                >
                  ตรวจสิทธิ์ & สาขา
                </span>
              </div>

              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  step >= 2 ? "bg-[#1E3A8A]" : "bg-slate-200"
                }`}
              />

              {/* Step 2 Pill */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= 2
                      ? "bg-[#1E3A8A] text-white shadow-md shadow-indigo-900/20"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-xs font-semibold text-center ${
                    step === 2 ? "text-[#1E3A8A]" : "text-slate-500"
                  }`}
                >
                  ข้อมูลผู้สมัคร
                </span>
              </div>

              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  step >= 3 ? "bg-[#1E3A8A]" : "bg-slate-200"
                }`}
              />

              {/* Step 3 Pill */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= 3
                      ? "bg-[#1E3A8A] text-white shadow-md shadow-indigo-900/20"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs font-semibold text-center ${
                    step === 3 ? "text-[#1E3A8A]" : "text-slate-500"
                  }`}
                >
                  ทบทวน & ยืนยัน
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: ตรวจสิทธิ์เลข 13 หลัก และเลือกสาขา */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-[#1E3A8A]" />
                ขั้นตอนที่ 1: ตรวจสอบเลขประจำตัวประชาชน และเลือกสาขาวิชา
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ระบบจะตรวจสอบความถูกต้องของเลข 13 หลักตามสูตร Checksum ทันที เพื่อความปลอดภัย
              </p>
            </div>

            {/* 1.1 เลขประจำตัวประชาชน 13 หลัก */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                เลขประจำตัวประชาชน 13 หลัก <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-md">
                <input
                  type="text"
                  value={cidInput}
                  onChange={handleCIDChange}
                  placeholder="X-XXXX-XXXXX-XX-X"
                  className={`w-full px-4 py-3.5 rounded-xl border font-mono text-base tracking-wider transition-all focus:outline-none focus:ring-2 ${
                    cleanCID.length === 13
                      ? isCIDValid
                        ? "border-emerald-400 bg-emerald-50/20 focus:ring-emerald-300 text-slate-900"
                        : "border-rose-400 bg-rose-50/20 focus:ring-rose-300 text-rose-900"
                      : "border-slate-300 focus:border-[#1E3A8A] focus:ring-indigo-100"
                  }`}
                  maxLength={17}
                />
                {cleanCID.length === 13 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold">
                    {isCIDValid ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>ถูกต้อง</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600">
                        <AlertCircle className="w-5 h-5" />
                        <span>เลขไม่ถูกต้อง</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                * ข้อมูลเลขประจำตัวประชาชนจะได้รับการเข้ารหัสระดับ AES-256-GCM ปลอดภัยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </p>
            </div>

            {/* 1.2 เลือกระดับชั้นการศึกษา */}
            <div className="space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                เลือกระดับชั้นที่ต้องการเข้าศึกษา <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel("ปวช.");
                    const firstPvoc = programs.find((p) => p.level === "ปวช." && p.isOpen);
                    if (firstPvoc) setSelectedProgramId(firstPvoc.id);
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedLevel === "ปวช."
                      ? "border-[#1E3A8A] bg-indigo-50/70 text-[#1E3A8A] font-bold shadow-xs ring-2 ring-[#1E3A8A]/20"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  <p className="text-base font-extrabold">ระดับ ปวช.</p>
                  <p className="text-xs text-slate-500 mt-0.5">รับผู้จบ ม.3 หรือเทียบเท่า</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel("ปวส.");
                    const firstPvs = programs.find((p) => p.level === "ปวส." && p.isOpen);
                    if (firstPvs) setSelectedProgramId(firstPvs.id);
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedLevel === "ปวส."
                      ? "border-[#1E3A8A] bg-indigo-50/70 text-[#1E3A8A] font-bold shadow-xs ring-2 ring-[#1E3A8A]/20"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  <p className="text-base font-extrabold">ระดับ ปวส.</p>
                  <p className="text-xs text-slate-500 mt-0.5">รับผู้จบ ปวช.3 / ม.6 หรือเทียบเท่า</p>
                </button>
              </div>
            </div>

            {/* 1.3 เลือกสาขาวิชา 1 สาขา */}
            <div className="space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                เลือกสาขาวิชา (ผู้สมัคร 1 คน เลือกได้ 1 สาขาต่อใบสมัคร) <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePrograms.map((prog) => {
                  const isSelected = selectedProgramId === prog.id;
                  const targetSeats = prog.currentRoundTargetSeats || prog.quotaSeats;
                  const remaining = prog.currentRoundRemainingSeats;

                  return (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedProgramId(prog.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#1E3A8A] bg-indigo-50/60 ring-2 ring-[#1E3A8A]/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {prog.code}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              remaining > 0 ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            ว่าง {remaining} ที่นั่ง
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{prog.name}</h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">เป้าหมายรับ: {targetSeats} ที่นั่ง</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep1}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1E3A8A] hover:bg-indigo-900 text-white font-bold text-sm shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ถัดไป: กรอกข้อมูลทั่วไป</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ข้อมูลทั่วไปของผู้สมัคร */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1E3A8A]" />
                ขั้นตอนที่ 2: ข้อมูลทั่วไปของผู้สมัคร
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                กรอกข้อมูลส่วนบุคคลและประวัติการศึกษาเดิม เพื่อใช้จัดทำประวัติในระบบ ศธ.02
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              {/* Prefix */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                >
                  {PREFIX_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* First Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ชื่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="เช่น สมชาย"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Last Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="เช่น ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Birth Date */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  วันเดือนปีเกิด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Phone */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Previous School */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ชื่อสถานศึกษาเดิม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  placeholder="เช่น โรงเรียนน่านคริสเตียนศึกษา หรือ โรงเรียนสตรีศรีน่าน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* School Province */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  จังหวัดสถานศึกษาเดิม <span className="text-rose-500">*</span>
                </label>
                <select
                  value={schoolProvince}
                  onChange={(e) => setSchoolProvince(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                >
                  {THAI_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous Education Level */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  วุฒิการศึกษาเดิมที่สำเร็จ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={previousEducation}
                  onChange={(e) => setPreviousEducation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                >
                  {PREVIOUS_EDUCATION_OPTIONS.map((edu) => (
                    <option key={edu} value={edu}>
                      {edu}
                    </option>
                  ))}
                </select>
              </div>

              {/* GPAX */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    เกรดเฉลี่ยสะสม (GPAX) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    ไม่จำกัดขั้นต่ำ
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpax}
                  onChange={(e) => setGpax(e.target.value)}
                  placeholder="เช่น 2.75"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* ข้อมูลบิดาและมารดา */}
              <div className="sm:col-span-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    ข้อมูลบิดาและมารดาของผู้สมัคร
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ชื่อ-นามสกุล บิดา
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="เช่น นายสมบูรณ์ ใจดี"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ชื่อ-นามสกุล มารดา
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="เช่น นางสมศรี ใจดี"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>
              </div>

              {/* ข้อมูลผู้ปกครอง */}
              <div className="sm:col-span-6 pt-4 border-t border-slate-100 space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      ข้อมูลผู้ปกครอง (อาจไม่ใช่ บิดา หรือ มารดา) <span className="text-rose-500">*</span>
                    </h3>
                  </div>

                  {/* ปุ่มลัดคัดลอกจากบิดาหรือมารดา */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">เลือกด่วน:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (fatherName.trim()) {
                          setGuardianName(fatherName.trim());
                          setGuardianRelation("บิดา");
                        } else {
                          setGuardianRelation("บิดา");
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-colors font-medium text-[11px]"
                    >
                      ผู้ปกครองคือ บิดา
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (motherName.trim()) {
                          setGuardianName(motherName.trim());
                          setGuardianRelation("มารดา");
                        } else {
                          setGuardianRelation("มารดา");
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-colors font-medium text-[11px]"
                    >
                      ผู้ปกครองคือ มารดา
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 pt-1">
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ชื่อ-นามสกุล ผู้ปกครอง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="เช่น นายสมเกียรติ มั่นคง (หรือบิดา/มารดา)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ความสัมพันธ์กับผู้สมัคร <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                    >
                      {GUARDIAN_RELATION_OPTIONS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      เบอร์โทรศัพท์ผู้ปกครองที่ติดต่อได้ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="เช่น 0891234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end pb-1 text-slate-500 text-[11px]">
                    * ใช้สำหรับติดต่อกรณีฉุกเฉินและรายงานตัวเข้าศึกษา
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ที่อยู่ปัจจุบันของผู้สมัคร / ผู้ปกครอง
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เช่น 123 หมู่ 4 ต.ในเวียง อ.เมือง จ.น่าน 55000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Back / Next Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep2}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1E3A8A] hover:bg-indigo-900 text-white font-bold text-sm shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ถัดไป: ทบทวนข้อมูล</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ทบทวนข้อมูล & ยืนยันการสมัคร */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#1E3A8A]" />
                ขั้นตอนที่ 3: ทบทวนข้อมูลและยืนยันการสมัคร
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนกดยืนยันใบสมัคร
              </p>
            </div>

            {/* Review Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Selected Program Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  สาขาวิชาที่เลือกสมัคร
                </span>
                <p className="font-extrabold text-slate-900 text-base">
                  ระดับ {selectedProgram?.level} {selectedProgram?.name}
                </p>
                <p className="font-mono text-xs text-slate-600">รหัสสาขา: {selectedProgram?.code}</p>
                <p className="text-xs text-indigo-800 font-medium">รอบ: {activeRound?.name}</p>
              </div>

              {/* Applicant CID & Name Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ข้อมูลผู้สมัคร
                </span>
                <p className="font-bold text-slate-900 text-base">
                  {prefix} {firstName} {lastName}
                </p>
                <p className="font-mono text-slate-700">เลขบัตร ปชช.: {maskCID(cleanCID)}</p>
                <p className="text-slate-600">
                  วันเกิด: {new Date(birthDate).toLocaleDateString("th-TH")} (โทร: {phone})
                </p>
              </div>

              {/* Prior Education Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ประวัติการศึกษาเดิม
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-800">
                  <div>
                    <span className="text-slate-500">สถานศึกษาเดิม:</span> {previousSchool}
                  </div>
                  <div>
                    <span className="text-slate-500">จังหวัด:</span> {schoolProvince}
                  </div>
                  <div>
                    <span className="text-slate-500">เกรดเฉลี่ย (GPAX):</span>{" "}
                    <span className="font-bold font-mono text-[#1E3A8A]">{gpax}</span>
                  </div>
                </div>
                {address && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">ที่อยู่ / ติดต่อเพิ่มเติม:</span> {address}
                  </div>
                )}
              </div>

              {/* Family & Guardian Review Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ข้อมูลครอบครัวและผู้ปกครอง
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-800">
                  <div>
                    <span className="text-slate-500">ชื่อบิดา:</span> {fatherName || "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">ชื่อมารดา:</span> {motherName || "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">ชื่อผู้ปกครอง:</span>{" "}
                    <span className="font-bold text-slate-900">{guardianName}</span>{" "}
                    <span className="text-xs text-indigo-700 font-medium">({guardianRelation})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">เบอร์โทรผู้ปกครอง:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{guardianPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PDPA & Data Consent Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>การคุ้มครองข้อมูลส่วนบุคคลและวัตถุประสงค์การใช้ข้อมูล (PDPA)</span>
              </div>
              <p className="leading-relaxed">
                ข้าพเจ้าขอรับรองว่าข้อมูลที่กรอกในใบสมัครนี้ถูกต้องและเป็นความจริงทุกประการ
                และยินยอมให้วิทยาลัยสารพัดช่างน่านประมวลผล จัดเก็บ และส่งต่อข้อมูลนี้เพื่อใช้ในการคัดเลือก
                รายงานตัว และส่งเข้าสู่ระบบฐานข้อมูลทะเบียนศึกษา (ศธ.02) ตามระเบียบสำนักงานคณะกรรมการการอาชีวศึกษา
              </p>
            </div>

            {/* Back / Submit Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับไปแก้ไข</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังบันทึกใบสมัคร...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ยืนยันการสมัครเรียน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: หน้าสรุปผลการสมัครสำเร็จ (Confirmation Receipt) */}
        {step === 4 && submissionResult && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md space-y-8 animate-in fade-in duration-300">
            {/* Top Success Badge */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ยื่นใบสมัครออนไลน์สำเร็จเรียบร้อยแล้ว!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                ระบบได้บันทึกข้อมูลเข้าสู่ฐานข้อมูลงานทะเบียน วิทยาลัยสารพัดช่างน่าน เรียบร้อยแล้ว
                กรุณาบันทึกเลขที่ใบสมัครไว้เป็นหลักฐาน
              </p>
            </div>

            {/* Official Confirmation Card (Printable Area) */}
            <div
              id="printable-receipt"
              className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 border-2 border-dashed border-indigo-200 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    เลขที่ใบสมัคร (Application No.)
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#1E3A8A]">
                      {submissionResult.applicationNo}
                    </span>
                    <button
                      type="button"
                      onClick={copyAppNo}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="คัดลอกเลขที่ใบสมัคร"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    สถานะ: รอการตรวจสอบ (PENDING)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ยื่นเมื่อ: {new Date(submissionResult.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-white border border-slate-100">
                  <p className="text-slate-400 text-xs">ชื่อ-นามสกุลผู้สมัคร</p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {submissionResult.applicantName}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-100">
                  <p className="text-slate-400 text-xs">เลขประจำตัวประชาชน (คุ้มครอง PDPA)</p>
                  <p className="font-mono font-bold text-slate-900 text-base mt-0.5">
                    {submissionResult.cidMasked}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-100 sm:col-span-2">
                  <p className="text-slate-400 text-xs">สาขาวิชาที่สมัคร</p>
                  <p className="font-bold text-[#1E3A8A] text-base mt-0.5">
                    {submissionResult.program}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    รอบการรับสมัคร: {submissionResult.round}
                  </p>
                </div>

                {submissionResult.guardianName && (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-100 sm:col-span-2">
                    <p className="text-slate-400 text-xs">ข้อมูลผู้ปกครองที่ติดต่อได้</p>
                    <p className="font-bold text-slate-900 text-base mt-0.5">
                      {submissionResult.guardianName}{" "}
                      {submissionResult.guardianRelation ? `(${submissionResult.guardianRelation})` : ""}
                    </p>
                    {submissionResult.guardianPhone && (
                      <p className="text-xs font-mono text-indigo-700 font-semibold mt-0.5">
                        เบอร์โทรศัพท์: {submissionResult.guardianPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Announcement Date Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">กำหนดการประกาศผลการคัดเลือก:</span>{" "}
                  {new Date(submissionResult.announceAt).toLocaleDateString("th-TH")} ผ่านเว็บไซต์
                  วิทยาลัยสารพัดช่างน่าน หรือสามารถตรวจสอบสถานะได้ตลอด 24 ชั่วโมง
                </div>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-[#1E3A8A] text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ / บันทึกหน้าจอ</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={`/status?applicationNo=${encodeURIComponent(
                    submissionResult.applicationNo
                  )}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-[#1E3A8A] font-bold text-xs sm:text-sm border border-indigo-200 transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>ตรวจสอบสถานะใบสมัคร</span>
                </Link>

                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>กลับสู่หน้าแรก</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">กำลังโหลดแบบฟอร์มรับสมัคร...</p>
          </div>
        </div>
      }
    >
      <ApplyForm />
    </Suspense>
  );
}
