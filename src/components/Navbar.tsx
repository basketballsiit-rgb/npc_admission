"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { assetUrl } from "@/lib/basepath";
import {
  GraduationCap,
  ClipboardList,
  Search,
  Lock,
  Menu,
  X,
  Building2,
  Compass,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "หน้าแรก", icon: Building2 },
    { href: "/guidance", label: "แนะแนวค้นหาสาขา", icon: Compass },
    { href: "/apply", label: "สมัครเรียนออนไลน์", icon: ClipboardList },
    { href: "/status", label: "ตรวจสอบสถานะ / แก้ไข", icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & College Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl("/npc-logo.jpg")}
                alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  if (!el.src.includes("/npc_admission")) {
                    el.src = "/npc_admission/npc-logo.jpg";
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-base tracking-tight">
                  NPC Admission
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                  2570
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-[#1E3A8A] font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#1E3A8A]" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Officer Login Link */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#162C63] transition-colors"
              title="สำหรับเจ้าหน้าที่งานทะเบียนและอาจารย์ที่ปรึกษา"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>สำหรับเจ้าหน้าที่</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#1E3A8A]"
              aria-label="เมนูหลัก"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-[#1E3A8A] font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#1E3A8A]" : "text-slate-500"}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              เข้าสู่ระบบสำหรับเจ้าหน้าที่
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
