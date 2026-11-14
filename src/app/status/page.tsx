"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/basepath";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Edit3,
  Calendar,
  IdCard,
  User,
  ArrowRight,
  Phone,
  School,
  X,
  Save,
  Printer,
  ShieldCheck,
  PartyPopper,
  Home as HomeIcon,
  Layers,
  Sparkles,
  LogOut,
  FileText,
  Heart,
  MapPin,
  Check,
} from "lucide-react";
import { sanitizeCID, validateThaiCID, maskCID } from "@/lib/security";
import {
  THAI_PROVINCES,
  PREVIOUS_EDUCATION_OPTIONS,
  GUARDIAN_RELATION_OPTIONS,
} from "@/lib/constants";

interface VerifiedApplication {
  id: string;
  applicationNo: string;
  applicantName: string;
  prefix: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  cidMasked: string;
  previousSchool: string;
  schoolProvince: string;
  previousEducation: string;
  gpax: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  programId: string;
  program: {
    id: string;
    code: string;
    name: string;
    level: string;
    isOpen: boolean;
  };
  round: {
    id: string;
    name: string;
    roundType: string;
    startAt: string;
    endAt: string;
    announceAt: string;
    academicYearId: string;
    academicYear: { year: string };
  };
  appliedAt: string;
  updatedAt: string;
  addressInfo: Record<string, any>;
  serverTime: string;
  isRoundOpen: boolean;
  isAnnounced: boolean;
  canEdit: boolean;
  canFillExtendedInfo: boolean;
  alternativeOpenRounds: Array<{
    id: string;
    name: string;
    roundType: string;
    startAt: string;
    endAt: string;
    announceAt: string;
  }>;
  availablePrograms: Array<{
    id: string;
    code: string;
    name: string;
    level: string;
  }>;
}

function StatusContent() {
  const searchParams = useSearchParams();
  const initialCid = searchParams.get("cid") || "";

  // Authentication Input State (3 Factors)
  const [cidInput, setCidInput] = useState(initialCid);
  const [birthDateInput, setBirthDateInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authenticated Application State
  const [appData, setAppData] = useState<VerifiedApplication | null>(null);

  // Edit Mode State (สำหรับ PENDING ในรอบที่เปิดอยู่)
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editSchool, setEditSchool] = useState("");
  const [editProvince, setEditProvince] = useState("น่าน");
  const [editEducation, setEditEducation] = useState("");
  const [editGpax, setEditGpax] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editGuardianName, setEditGuardianName] = useState("");
  const [editGuardianRelation, setEditGuardianRelation] = useState("บิดา");
  const [editGuardianPhone, setEditGuardianPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Extended Profile Registration State (สำหรับ APPROVED - ศธ.02 และ RMS)
  const [houseNo, setHouseNo] = useState("");
  const [moo, setMoo] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("น่าน");
  const [postalCode, setPostalCode] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O");
  const [extFatherName, setExtFatherName] = useState("");
  const [extMotherName, setExtMotherName] = useState("");
  const [extGuardianName, setExtGuardianName] = useState("");
  const [extGuardianRelation, setExtGuardianRelation] = useState("บิดา");
  const [extGuardianPhone, setExtGuardianPhone] = useState("");
  const [savingExtInfo, setSavingExtInfo] = useState(false);
  const [extSuccessMsg, setExtSuccessMsg] = useState<string | null>(null);

  // Format CID as user types: x-xxxx-xxxxx-xx-x
  const handleCIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    let formatted = raw;
    if (raw.length > 1) formatted = `${raw.slice(0, 1)}-${raw.slice(1)}`;
    if (raw.length > 5) formatted = `${formatted.slice(0, 6)}-${raw.slice(5)}`;
    if (raw.length > 10) formatted = `${formatted.slice(0, 12)}-${raw.slice(10)}`;
    if (raw.length > 12) formatted = `${formatted.slice(0, 15)}-${raw.slice(12)}`;
    setCidInput(formatted);
    setAuthError(null);
  };

  const cleanCID = sanitizeCID(cidInput);
  const isCIDValid = cleanCID.length === 13 && validateThaiCID(cleanCID);

  // ยืนยันตัวตน 3 ปัจจัย (CID + BirthDate + Phone)
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setEditSuccessMsg(null);
    setExtSuccessMsg(null);

    if (!isCIDValid) {
      setAuthError("กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้องตามสูตร Modulo 11");
      return;
    }
    if (!birthDateInput) {
      setAuthError("กรุณาระบุวันเดือนปีเกิดของผู้สมัคร");
      return;
    }
    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setAuthError("กรุณากรอกเบอร์โทรศัพท์ที่เคยใช้ลงทะเบียนให้ถูกต้อง");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(apiUrl("/api/applications/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cid: cleanCID,
          birthDate: birthDateInput,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || "ข้อมูลยืนยันตัวตนไม่ตรงกับข้อมูลในระบบ");
        setAppData(null);
        return;
      }

      setAppData(data.data);
      populateEditState(data.data);
      populateExtendedState(data.data);
    } catch (err) {
      console.error("Verification Error:", err);
      setAuthError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setVerifying(false);
    }
  };

  const populateEditState = (app: VerifiedApplication) => {
    setEditPhone(app.phone);
    setEditSchool(app.previousSchool);
    setEditProvince(app.schoolProvince || "น่าน");
    setEditEducation(app.previousEducation);
    setEditGpax(String(app.gpax));
    setEditProgramId(app.programId);

    const fam = app.addressInfo || {};
    setEditFatherName(fam.fatherName || "");
    setEditMotherName(fam.motherName || "");
    setEditGuardianName(fam.guardianName || "");
    setEditGuardianRelation(fam.guardianRelation || "บิดา");
    setEditGuardianPhone(fam.guardianPhone || "");
  };

  const populateExtendedState = (app: VerifiedApplication) => {
    const fam = app.addressInfo || {};
    setHouseNo(fam.houseNo || "");
    setMoo(fam.moo || "");
    setSubdistrict(fam.subdistrict || "");
    setDistrict(fam.district || "");
    setProvince(fam.province || "น่าน");
    setPostalCode(fam.postalCode || "");
    setBloodGroup(fam.bloodGroup || "O");
    setExtFatherName(fam.fatherName || "");
    setExtMotherName(fam.motherName || "");
    setExtGuardianName(fam.guardianName || "");
    setExtGuardianRelation(fam.guardianRelation || "บิดา");
    setExtGuardianPhone(fam.guardianPhone || "");
  };

  // บันทึกการแก้ไขใบสมัคร (สำหรับ PENDING ในรอบที่เปิดอยู่)
  const handleSaveApplicationEdit = async () => {
    if (!appData) return;
    setSavingEdit(true);
    setEditSuccessMsg(null);
    setAuthError(null);

    try {
      const payload: Record<string, any> = {
        phone: editPhone.trim(),
        previousSchool: editSchool.trim(),
        schoolProvince: editProvince,
        previousEducation: editEducation,
        gpax: parseFloat(editGpax),
        programId: editProgramId,
        fatherName: editFatherName.trim(),
        motherName: editMotherName.trim(),
        guardianName: editGuardianName.trim(),
        guardianRelation: editGuardianRelation.trim(),
        guardianPhone: editGuardianPhone.trim(),
      };

      const res = await fetch(apiUrl(`/api/applications/${appData.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || "ไม่สามารถแก้ไขใบสมัครได้");
        return;
      }

      setEditSuccessMsg("บันทึกการแก้ไขข้อมูลและสาขาวิชาเรียบร้อยแล้ว");
      setIsEditing(false);

      // รีเฟรชข้อมูลล่าสุด
      const updatedProgram = appData.availablePrograms.find((p) => p.id === editProgramId);
      setAppData({
        ...appData,
        phone: editPhone.trim(),
        previousSchool: editSchool.trim(),
        schoolProvince: editProvince,
        previousEducation: editEducation,
        gpax: parseFloat(editGpax),
        programId: editProgramId,
        program: updatedProgram
          ? { ...appData.program, ...updatedProgram }
          : appData.program,
        addressInfo: {
          ...appData.addressInfo,
          fatherName: editFatherName.trim(),
          motherName: editMotherName.trim(),
          guardianName: editGuardianName.trim(),
          guardianRelation: editGuardianRelation.trim(),
          guardianPhone: editGuardianPhone.trim(),
        },
      });
    } catch (err) {
      console.error("Save edit error:", err);
      setAuthError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่");
    } finally {
      setSavingEdit(false);
    }
  };

  // บันทึกข้อมูลทะเบียนประวัติเพิ่มเติม (สำหรับ APPROVED - ศธ.02 และ RMS)
  const handleSaveExtendedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appData) return;
    setSavingExtInfo(true);
    setExtSuccessMsg(null);
    setAuthError(null);

    try {
      const payload = {
        houseNo: houseNo.trim(),
        moo: moo.trim(),
        subdistrict: subdistrict.trim(),
        district: district.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        bloodGroup,
        fatherName: extFatherName.trim(),
        motherName: extMotherName.trim(),
        guardianName: extGuardianName.trim(),
        guardianRelation: extGuardianRelation.trim(),
        guardianPhone: extGuardianPhone.trim(),
      };

      const res = await fetch(apiUrl(`/api/applications/${appData.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || "ไม่สามารถบันทึกข้อมูลทะเบียนประวัติได้");
        return;
      }

      setExtSuccessMsg("บันทึกข้อมูลทะเบียนประวัติเพิ่มเติมสำหรับระบบ ศธ.02 และ RMS สำเร็จเรียบร้อย!");
      setAppData({
        ...appData,
        addressInfo: {
          ...appData.addressInfo,
          ...payload,
        },
      });
    } catch (err) {
      console.error("Save extended profile error:", err);
      setAuthError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingExtInfo(false);
    }
  };

  const handleLogout = () => {
    setAppData(null);
    setCidInput("");
    setBirthDateInput("");
    setPhoneInput("");
    setAuthError(null);
    setEditSuccessMsg(null);
    setExtSuccessMsg(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-[#1E3A8A]">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>ระบบบริการผู้สมัคร วิทยาลัยสารพัดช่างน่าน</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ตรวจสอบสถานะ แก้ไขใบสมัคร และบันทึกประวัติเพิ่มเติม
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ระบบยืนยันตัวตนความปลอดภัยสูง ค้นหาผ่านค่าแฮช ป้องกันข้อมูลรั่วไหล 100%
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="font-bold">{authError}</div>
              {authError.includes("ไม่พบข้อมูล") && (
                <div className="text-xs text-rose-700 flex flex-wrap items-center gap-1.5 pt-1">
                  <span>หากท่านยังไม่ได้ลงทะเบียนสมัครเรียน:</span>
                  <Link
                    href="/apply"
                    className="font-bold text-[#1E3A8A] underline hover:text-indigo-950 inline-flex items-center gap-1"
                  >
                    <span>คลิกเพื่อสมัครเรียนที่นี่</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Success Banner */}
        {editSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{editSuccessMsg}</div>
          </div>
        )}

        {/* Extended Profile Success Banner */}
        {extSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
            <PartyPopper className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{extSuccessMsg}</div>
          </div>
        )}

        {/* ---------------- VIEW 1: IDENTITY VERIFICATION FORM (ถ้ายังไม่ล็อกอิน) ---------------- */}
        {!appData ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-[#1E3A8A]" />
                กรอกข้อมูลยืนยันตัวตน 3 ส่วนเพื่อเข้าถึงข้อมูลใบสมัคร
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                เพื่อความปลอดภัยของข้อมูลส่วนบุคคล (PDPA) กรุณากรอกข้อมูลที่ตรงกับที่ลงทะเบียนไว้
              </p>
            </div>

            <form onSubmit={handleVerifyIdentity} className="space-y-4">
              {/* Field 1: Citizen ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  1. เลขประจำตัวประชาชน 13 หลัก <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cidInput}
                    onChange={handleCIDChange}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    maxLength={17}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm sm:text-base tracking-wider focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-indigo-100"
                  />
                  {cleanCID.length === 13 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs">
                      {isCIDValid ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> ถูกต้อง
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-4 h-4" /> เลขผิด
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 2: Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    2. วันเดือนปีเกิดของผู้สมัคร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthDateInput}
                    onChange={(e) => setBirthDateInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                {/* Field 3: Registered Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    3. เบอร์โทรศัพท์ที่เคยใช้สมัคร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="เช่น 0812345678"
                    required
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3.5 rounded-2xl bg-[#1E3A8A] hover:bg-indigo-900 text-white font-bold text-sm shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังตรวจสอบข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>ยืนยันตัวตนเพื่อเข้าถึงใบสมัคร</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ค้นหาผ่าน cidHash ปลอดภัยระดับสากล</span>
              </span>
              <Link href="/apply" className="text-indigo-700 hover:underline font-semibold">
                ยังไม่ได้สมัคร? คลิกสมัครเรียนออนไลน์
              </Link>
            </div>
          </div>
        ) : (
          /* ---------------- VIEW 2: AUTHENTICATED APPLICATION PORTAL ---------------- */
          <div className="space-y-6">
            {/* Top Toolbar: Logout & Masked CID Pill */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">ผู้สมัคร:</span>
                <span className="font-bold text-slate-800">{appData.applicantName}</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {appData.cidMasked}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>

            {/* Application Main Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    เลขที่ใบสมัคร (Application No.)
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black font-mono text-[#1E3A8A]">
                    {appData.applicationNo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รอบ: {appData.round.name} (ปีการศึกษา {appData.round.academicYear.year})
                  </p>
                </div>

                <div>
                  {/* Status Badges */}
                  {appData.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ผ่านการคัดเลือก (APPROVED)
                    </span>
                  )}

                  {appData.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      ไม่ผ่านการคัดเลือก (REJECTED)
                    </span>
                  )}

                  {appData.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      {appData.isRoundOpen
                        ? "เปิดรับสมัครอยู่ / รอการตรวจสอบ"
                        : "รอประกาศผลการคัดเลือก"}
                    </span>
                  )}
                </div>
              </div>

              {/* ---------------- CASE 1: APPROVED BANNER & CALLOUT ---------------- */}
              {appData.status === "APPROVED" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 text-emerald-950 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-6 h-6 text-emerald-600" />
                    <h4 className="text-lg font-black text-emerald-900">
                      ขอแสดงความยินดี! ท่านผ่านการคัดเลือกเข้าศึกษาต่อ วิทยาลัยสารพัดช่างน่าน
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    ท่านได้รับการคัดเลือกในหลักสูตร{" "}
                    <strong>
                      ระดับ {appData.program.level} {appData.program.name} (รหัส {appData.program.code})
                    </strong>{" "}
                    กรุณากรอกข้อมูลทะเบียนประวัติเพิ่มเติมในแบบฟอร์มด้านล่างให้ครบถ้วน เพื่อส่งต่อเข้าสู่ระบบทะเบียนนักเรียนนักศึกษา ศธ.02 และระบบบริหารจัดการ RMS ของวิทยาลัย
                  </p>
                </div>
              )}

              {/* ---------------- CASE 2: REJECTED NOTIFICATION & SHORTCUT ---------------- */}
              {appData.status === "REJECTED" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-rose-50/50 to-white border border-rose-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">
                        แจ้งผลการพิจารณาคัดเลือก
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        วิทยาลัยสารพัดช่างน่าน ขอขอบคุณที่ท่านให้ความสนใจสมัครเข้าศึกษาในรอบนี้
                        ทางคณะกรรมการได้พิจารณาคุณสมบัติแล้ว ขอเรียนให้ทราบว่าท่านยังไม่ผ่านการคัดเลือกในรอบดังกล่าว
                      </p>
                    </div>
                  </div>

                  {/* Shortcut to re-apply in open Regular Round if available */}
                  {appData.alternativeOpenRounds && appData.alternativeOpenRounds.length > 0 && (
                    <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-bold text-indigo-900">
                            ข่าวดี! มีรอบการรับสมัครอื่นกำลังเปิดรับสมัครอยู่:
                          </p>
                          <p className="text-xs text-indigo-700">
                            {appData.alternativeOpenRounds[0].name} (ท่านสามารถใช้เลข 13 หลักเดิมสมัครได้ทันที)
                          </p>
                        </div>
                        <Link
                          href={`/apply?level=${encodeURIComponent(
                            appData.program.level
                          )}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white font-bold text-xs shadow-xs transition-transform hover:scale-105"
                        >
                          <span>สมัครใหม่ในรอบนี้ทันที</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- CASE 3: PENDING WAITING FOR ANNOUNCEMENT ---------------- */}
              {appData.status === "PENDING" && !appData.isRoundOpen && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>สิ้นสุดระยะเวลารับสมัครแล้ว - อยู่ระหว่างรอประกาศผลการคัดเลือก</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    ระบบจะประกาศผลในวันที่{" "}
                    <strong>{new Date(appData.round.announceAt).toLocaleDateString("th-TH")}</strong>{" "}
                    (เนื่องจากสิ้นสุดระยะเวลาเปิดรับสมัครแล้ว จึงปิดการแก้ไขข้อมูลชั่วคราว)
                  </p>
                </div>
              )}

              {/* Details Grid Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-xs">สาขาวิชาที่สมัคร</span>
                  <p className="font-bold text-[#1E3A8A] text-base">
                    ระดับ {appData.program.level} {appData.program.name}
                  </p>
                  <p className="font-mono text-slate-500 text-xs">รหัสสาขา: {appData.program.code}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-xs">ข้อมูลการติดต่อ</span>
                  <p className="font-bold text-slate-900 text-base">{appData.phone}</p>
                  <p className="text-slate-500 text-xs">
                    วันเกิด: {new Date(appData.birthDate).toLocaleDateString("th-TH")}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 text-xs">ประวัติการศึกษาเดิม</span>
                  <p className="text-slate-800">
                    จบจาก <strong>{appData.previousSchool}</strong> ({appData.schoolProvince}) | วุฒิ: {appData.previousEducation} | เกรดเฉลี่ย (GPAX):{" "}
                    <strong className="font-mono text-[#1E3A8A]">{appData.gpax}</strong>
                  </p>
                </div>
              </div>

              {/* Family and Guardian Snapshot */}
              {appData.addressInfo && (
                <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                    ข้อมูลครอบครัวและผู้ปกครอง
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                    <div>
                      <span className="text-slate-500">ชื่อบิดา:</span> {appData.addressInfo.fatherName || "-"}
                    </div>
                    <div>
                      <span className="text-slate-500">ชื่อมารดา:</span> {appData.addressInfo.motherName || "-"}
                    </div>
                    {appData.addressInfo.guardianName && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">ผู้ปกครองที่ติดต่อได้:</span>{" "}
                        <strong className="text-slate-900">{appData.addressInfo.guardianName}</strong>{" "}
                        <span className="text-indigo-700">({appData.addressInfo.guardianRelation || "ผู้ปกครอง"})</span>{" "}
                        | โทร: <span className="font-mono font-bold">{appData.addressInfo.guardianPhone || "-"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons: Print & Edit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบสมัคร</span>
                </button>

                {/* Edit Button: Visible and active only when round is open and status is PENDING */}
                {appData.canEdit ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? "ปิดหน้าต่างแก้ไข" : "แก้ไขข้อมูล / เปลี่ยนสาขาวิชา"}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    {appData.status === "APPROVED"
                      ? "(ผ่านการคัดเลือกแล้ว สามารถกรอกประวัติเพิ่มเติมด้านล่าง)"
                      : "(รอบการรับสมัครสิ้นสุดลงแล้ว จึงล็อกการแก้ไขข้อมูล)"}
                  </span>
                )}
              </div>
            </div>

            {/* ---------------- EDIT APPLICATION INLINE FORM (สำหรับ PENDING ในรอบที่เปิด) ---------------- */}
            {isEditing && appData.canEdit && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-md space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-[#1E3A8A]" />
                      แก้ไขข้อมูลใบสมัครและเปลี่ยนสาขาวิชา
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      สามารถแก้ไขข้อมูลและเลือกสาขาวิชาใหม่ได้ด้วยตนเองก่อนปิดรับสมัคร
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Select New Program */}
                  <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <label className="block font-bold text-[#1E3A8A]">
                      สาขาวิชาที่ต้องการเข้าศึกษา (สามารถเปลี่ยนสาขาวิชาได้ที่นี่)
                    </label>
                    <select
                      value={editProgramId}
                      onChange={(e) => setEditProgramId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                    >
                      {appData.availablePrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          ระดับ {p.level} {p.name} (รหัส {p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อใหม่</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">เกรดเฉลี่ยสะสม (GPAX)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={editGpax}
                        onChange={(e) => setEditGpax(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">ชื่อสถานศึกษาเดิม</label>
                      <input
                        type="text"
                        value={editSchool}
                        onChange={(e) => setEditSchool(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">จังหวัดสถานศึกษาเดิม</label>
                      <select
                        value={editProvince}
                        onChange={(e) => setEditProvince(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                      >
                        {THAI_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">ชื่อบิดา</label>
                      <input
                        type="text"
                        value={editFatherName}
                        onChange={(e) => setEditFatherName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">ชื่อมารดา</label>
                      <input
                        type="text"
                        value={editMotherName}
                        onChange={(e) => setEditMotherName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">ชื่อผู้ปกครอง</label>
                      <input
                        type="text"
                        value={editGuardianName}
                        onChange={(e) => setEditGuardianName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">เบอร์โทรผู้ปกครอง</label>
                      <input
                        type="tel"
                        value={editGuardianPhone}
                        onChange={(e) => setEditGuardianPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApplicationEdit}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>บันทึกการแก้ไข</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- EXTENDED PROFILE FORM FOR APPROVED APPLICANTS (ศธ.02 & RMS) ---------------- */}
            {appData.status === "APPROVED" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    แบบฟอร์มรายงานตัวและจัดทำทะเบียนประวัติ
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    ข้อมูลทะเบียนประวัติเพิ่มเติม (ส่งต่อระบบ ศธ.02 และ RMS)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    กรุณากรอกข้อมูลที่อยู่ตามทะเบียนบ้าน หมู่เลือด และข้อมูลครอบครัวเพื่อบันทึกประวัติเข้าสู่ฐานข้อมูลการศึกษา
                  </p>
                </div>

                <form onSubmit={handleSaveExtendedProfile} className="space-y-6 text-xs sm:text-sm">
                  {/* Address Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <MapPin className="w-4 h-4 text-[#1E3A8A]" />
                      <span>ที่อยู่ตามทะเบียนบ้าน</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">บ้านเลขที่ *</label>
                        <input
                          type="text"
                          value={houseNo}
                          onChange={(e) => setHouseNo(e.target.value)}
                          placeholder="เช่น 123/4"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                        />
                      </div>

                      <div className="sm:col-span-1 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">หมู่ที่</label>
                        <input
                          type="text"
                          value={moo}
                          onChange={(e) => setMoo(e.target.value)}
                          placeholder="เช่น 5"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">ตำบล / แขวง *</label>
                        <input
                          type="text"
                          value={subdistrict}
                          onChange={(e) => setSubdistrict(e.target.value)}
                          placeholder="เช่น ในเวียง"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">อำเภอ / เขต *</label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="เช่น เมืองน่าน"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">จังหวัด *</label>
                        <select
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E3A8A]"
                        >
                          {THAI_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">รหัสไปรษณีย์ *</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="เช่น 55000"
                          maxLength={5}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:border-[#1E3A8A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical & Blood Group */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>ข้อมูลสุขภาพและหมู่เลือด</span>
                    </div>

                    <div className="max-w-xs space-y-1">
                      <label className="block font-semibold text-slate-600 text-xs">หมู่เลือด (Blood Group) *</label>
                      <div className="flex gap-2">
                        {["A", "B", "AB", "O"].map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setBloodGroup(bg)}
                            className={`flex-1 py-2 rounded-xl border font-bold text-sm transition-all ${
                              bloodGroup === bg
                                ? "bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Family & Guardian in Extended form */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <User className="w-4 h-4 text-[#1E3A8A]" />
                      <span>ข้อมูลบิดา มารดา และผู้ปกครอง</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">ชื่อ-สกุล บิดา</label>
                        <input
                          type="text"
                          value={extFatherName}
                          onChange={(e) => setExtFatherName(e.target.value)}
                          placeholder="ชื่อ-สกุล บิดา"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">ชื่อ-สกุล มารดา</label>
                        <input
                          type="text"
                          value={extMotherName}
                          onChange={(e) => setExtMotherName(e.target.value)}
                          placeholder="ชื่อ-สกุล มารดา"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-600 text-xs">
                          ชื่อ-สกุล ผู้ปกครอง *
                        </label>
                        <input
                          type="text"
                          value={extGuardianName}
                          onChange={(e) => setExtGuardianName(e.target.value)}
                          placeholder="ชื่อผู้ปกครองที่ติดต่อได้"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-600 text-xs">ความสัมพันธ์ *</label>
                          <select
                            value={extGuardianRelation}
                            onChange={(e) => setExtGuardianRelation(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                          >
                            {GUARDIAN_RELATION_OPTIONS.map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-600 text-xs">เบอร์โทรผู้ปกครอง *</label>
                          <input
                            type="tel"
                            value={extGuardianPhone}
                            onChange={(e) => setExtGuardianPhone(e.target.value)}
                            placeholder="08x-xxx-xxxx"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Extended Profile */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      * ข้อมูลนี้จะได้รับการบันทึกเข้าระบบ ศธ.02 และระบบ RMS ประจำตัวนักศึกษา
                    </p>
                    <button
                      type="submit"
                      disabled={savingExtInfo}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {savingExtInfo ? (
                        <span>กำลังบันทึกข้อมูล...</span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>บันทึกข้อมูลทะเบียนประวัติเพิ่มเติม</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">กำลังโหลดระบบตรวจสอบสถานะ...</p>
          </div>
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
