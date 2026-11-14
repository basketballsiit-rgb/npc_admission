import { Building2, Phone, MapPin, Globe, Shield, Printer } from "lucide-react";
import Link from "next/link";
import { assetUrl } from "@/lib/basepath";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: College Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-400/80 shadow-xs flex-shrink-0 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl("/npc-logo.jpg")}
                  alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src.includes("/npc_admission")) {
                      el.src = "/npc_admission/npc-logo.jpg";
                    }
                  }}
                />
              </div>
              <span className="font-bold text-white text-base">วิทยาลัยสารพัดช่างน่าน</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ
              <br />
              มุ่งมั่นผลิตและพัฒนากำลังคนอาชีวศึกษาที่มีคุณภาพสู่มาตรฐานสากล
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>คุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA</span>
            </div>
          </div>

          {/* Column 2: Contact Details */}
          <div className="space-y-2 text-xs text-slate-400">
            <h4 className="font-semibold text-white text-sm mb-3">งานทะเบียนและประมวลผล</h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>150 ถนนสุมนเทวราช ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>โทรศัพท์: 054-710367, 054-772520</span>
            </div>
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>โทรสาร (Fax): 054-772520</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <a
                href="https://www.npc.ac.th"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                www.npc.ac.th
              </a>
            </div>
          </div>

          {/* Column 3: Quick Links & Admission Info */}
          <div className="space-y-2 text-xs text-slate-400">
            <h4 className="font-semibold text-white text-sm mb-3">บริการรับสมัคร</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/apply" className="hover:text-amber-400 transition-colors">
                  • สมัครเรียนออนไลน์ (ปวช. และ ปวส.)
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-amber-400 transition-colors">
                  • ตรวจสอบสถานะใบสมัคร / พิมพ์ใบสมัคร
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-400 transition-colors">
                  • ระบบบริหารจัดการสำหรับเจ้าหน้าที่
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2570 วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College). สงวนลิขสิทธิ์.</p>
          <p className="flex items-center gap-2">
            <span>NPC E-Service Admission Portal</span>
            <span>•</span>
            <span className="text-slate-400">ระบบฐานข้อมูล สอศ. (ศธ.02 Compatible)</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
