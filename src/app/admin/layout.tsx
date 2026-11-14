"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/basepath";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Loader2,
  Calendar,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/auth/me"));
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        const adminUser = data.admin || data.user;
        if ((data.authenticated || data.success) && adminUser) {
          if (isMounted) setUser(adminUser);
        } else {
          router.replace("/admin/login");
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/api/admin/auth/logout"), { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  };

  // If on login page, render children directly without admin chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans text-slate-700">
        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
        <p className="text-sm font-medium">กำลังตรวจสอบสิทธิ์การเข้าถึงระบบเจ้าหน้าที่...</p>
      </div>
    );
  }

  const navItems = [
    {
      name: "ภาพรวมสถิติ",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      name: "จัดการรายชื่อผู้สมัคร",
      href: "/admin/applications",
      icon: Users,
      active: pathname.startsWith("/admin/applications"),
    },
    {
      name: "ตั้งค่ารอบและแผนรับ",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
    {
      name: "ศูนย์ส่งออก ศธ.02 / RMS",
      href: "/admin/export",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/admin/export"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-400/80 shadow-xs flex-shrink-0 bg-white">
            <Image
              src="/npc-logo.jpg"
              alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-sm text-slate-900">ระบบรับสมัคร (เจ้าหน้าที่)</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop / Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400/90 shadow-md shadow-slate-900/10 flex-shrink-0 bg-white">
              <Image
                src="/npc-logo.jpg"
                alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-900 leading-tight">
                วิทยาลัยสารพัดช่างน่าน
              </h1>
              <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 inline" /> ระบบบริหารการรับสมัคร
              </p>
            </div>
          </div>

          {/* Academic Year Badge */}
          <div className="mt-4 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              ปีการศึกษาปัจจุบัน:
            </span>
            <span className="font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
              2570
            </span>
          </div>

          {/* Nav Items */}
          <nav className="mt-6 space-y-1.5 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              เมนูหลัก
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? "bg-[#1E3A8A] text-white shadow-sm shadow-indigo-950/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? "text-[#F59E0B]" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick link to public site */}
          <div className="pt-4 mt-auto border-t border-slate-100">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-lg transition-colors"
            >
              <span>เปิดหน้าเว็บผู้สมัคร</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* User Card & Logout in Sidebar footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.username?.slice(0, 2) || "AD"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || user?.username || "ผู้ดูแลระบบ"}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                  {user?.role || "ADMIN"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs"
        />
      )}
    </div>
  );
}