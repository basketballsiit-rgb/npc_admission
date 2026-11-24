"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/basepath";
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Layers,
  Calendar,
  AlertCircle,
  HelpCircle,
  Lock,
} from "lucide-react";

interface Round {
  id: string;
  name: string;
}

interface Program {
  id: string;
  code: string;
  name: string;
  level: string;
}

export default function AdminExportPage() {
  const [allYears, setAllYears] = useState<Array<{ id: string; year: string; isActive: boolean }>>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("APPROVED");

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  // Load academic years list once
  useEffect(() => {
    fetch(apiUrl("/api/admin/settings"))
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.success && s?.data) {
          setAllYears(s.data.allYears || []);
          if (s.data.activeYear?.id) {
            setSelectedYearId(s.data.activeYear.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Load rounds & programs scoped to selected Academic Year
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const qs = selectedYearId
          ? `?academicYearId=${encodeURIComponent(selectedYearId)}`
          : "";
        const [rRes, pRes] = await Promise.all([
          fetch(apiUrl(`/api/rounds${qs}`)),
          fetch(apiUrl(`/api/programs${qs}`)),
        ]);
        if (rRes.ok) {
          const rJson = await rRes.json();
          const rList = rJson.data || rJson.rounds || [];
          setRounds(rList);
        }
        if (pRes.ok) {
          const pJson = await pRes.json();
          const pList = pJson.data || pJson.programs || [];
          setPrograms(pList);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYearId]);

  const handleDownload = (format: "xlsx" | "csv") => {
    setDownloadingFormat(format);
    const params = new URLSearchParams();
    if (selectedYearId) params.set("academicYearId", selectedYearId);
    if (selectedRound) params.set("roundId", selectedRound);
    if (selectedProgram) params.set("programId", selectedProgram);
    if (selectedStatus) params.set("status", selectedStatus);
    params.set("format", format);

    // Open download url directly
    window.location.href = apiUrl(`/api/admin/export?${params.toString()}`);

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 2500);
  };

  const columnsList = [
    "ลำดับ",
    "เลขที่ใบสมัคร",
    "เลขประจำตัวประชาชน (13 หลักเต็ม)",
    "คำนำหน้า",
    "ชื่อ - นามสกุล",
    "วันเดือนปีเกิด",
    "ระดับชั้น (ปวช./ปวส.)",
    "รหัสสาขาวิชา (มาตรฐาน ศธ.02)",
    "ชื่อสาขาวิชา",
    "เกรดเฉลี่ยสะสม (GPAX)",
    "สถานศึกษาเดิม",
    "จังหวัดสถานศึกษาเดิม",
    "วุฒิเดิมที่จบ",
    "เบอร์โทรศัพท์ผู้สมัคร",
    "ที่อยู่ (บ้านเลขที่, หมู่, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)",
    "หมู่เลือด",
    "ชื่อ-สกุล บิดา",
    "ชื่อ-สกุล มารดา",
    "ชื่อ-สกุล ผู้ปกครอง & เบอร์โทร",
    "รอบการรับสมัคร & ปีการศึกษา",
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ศูนย์ส่งออกข้อมูล ศธ.02 / RMS
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
            Excel & CSV UTF-8 BOM
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          ระบบส่งออกข้อมูลผู้ผ่านการคัดเลือกเข้าสู่ฐานข้อมูลระบบ ศธ.02 ออนไลน์ และโปรแกรมบริหารวิทยาลัย (RMS)
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] text-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            ความปลอดภัยของข้อมูลส่วนบุคคล (PDPA Compliant)
          </h3>
          <p className="text-slate-600 leading-relaxed">
            รหัสประจำตัวประชาชน 13 หลักถูกเข้ารหัสลับแบบ <strong>AES-256-GCM</strong> ตลอดเวลาในฐานข้อมูล
            และจะถูกถอดรหัสแบบ On-the-fly ณ ฝั่ง Server เฉพาะเมื่อผู้ดูแลระบบสั่งส่งออกไฟล์ทางการเท่านั้น
            ไม่มีการเปิดเผยหรือเก็บแบบข้อความธรรมดาเด็ดขาด
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Form (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1E3A8A]" />
              กำหนดเงื่อนไขการส่งออกข้อมูล
            </h2>

            <div className="space-y-4 text-xs">
              {/* Academic Year Selection */}
              {allYears.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> เลือกปีการศึกษา
                  </label>
                  <select
                    value={selectedYearId}
                    onChange={(e) => {
                      setSelectedYearId(e.target.value);
                      setSelectedRound("");
                      setSelectedProgram("");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-[#162C63] focus:outline-none focus:border-[#1E3A8A] bg-white"
                  >
                    {allYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        ปีการศึกษา {y.year} {y.isActive ? "(ปัจจุบัน)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Round Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> เลือกรอบการรับสมัคร
                </label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] bg-white"
                >
                  <option value="">ทุกรอบรับสมัคร (ทั้งหมด)</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> เลือกสาขาวิชา
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] bg-white"
                >
                  <option value="">ทุกสาขาวิชา (รวมทุกระดับชั้น)</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.level} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> สถานะผู้สมัคร
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] bg-white"
                >
                  <option value="APPROVED">เฉพาะผู้ผ่านการคัดเลือก (APPROVED - แนะนำสำหรับ ศธ.02)</option>
                  <option value="PENDING">เฉพาะผู้ที่รอตรวจสอบ (PENDING)</option>
                  <option value="REJECTED">เฉพาะผู้ที่ไม่ผ่านการคัดเลือก (REJECTED)</option>
                  <option value="">รวมทุกสถานะ</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDownload("xlsx")}
                disabled={downloadingFormat !== null}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>
                  {downloadingFormat === "xlsx"
                    ? "กำลังจัดเตรียมไฟล์ Excel..."
                    : "ดาวน์โหลดไฟล์ Excel (.xlsx)"}
                </span>
              </button>

              <button
                onClick={() => handleDownload("csv")}
                disabled={downloadingFormat !== null}
                className="flex-1 py-3 px-4 bg-[#1E3A8A] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {downloadingFormat === "csv"
                    ? "กำลังจัดเตรียมไฟล์ CSV..."
                    : "ดาวน์โหลดไฟล์ CSV (UTF-8 BOM)"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Format Spec Card (Right column) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              โครงสร้างข้อมูลมาตรฐานในไฟล์
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ไฟล์ส่งออกประกอบด้วย {columnsList.length} คอลัมน์ที่จัดเรียงตรงตามข้อกำหนดนำเข้าข้อมูลของ
              สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.):
            </p>

            <ul className="space-y-1.5 pt-2 border-t border-slate-100 max-h-80 overflow-y-auto pr-1">
              {columnsList.map((col, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-[11px] text-slate-700 font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{col}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              * ไฟล์ CSV ใส่รหัส UTF-8 Byte Order Mark (\uFEFF) ล่วงหน้า ช่วยให้เปิดบน Microsoft
              Excel ในระบบปฏิบัติการ Windows ได้ทันทีโดยภาษาไทยไม่กลายเป็นภาษาต่างดาว
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}