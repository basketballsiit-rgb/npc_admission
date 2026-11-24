"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiUrl, assetUrl } from "@/lib/basepath";
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
  Compass,
  Coins,
  BarChart3,
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
  const [activeYearLabel, setActiveYearLabel] = useState<string>("2570");
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
          // Fetch active academic year dynamically for sidebar display
          fetch(apiUrl("/api/admin/settings"))
            .then((r) => (r.ok ? r.json() : null))
            .then((s) => {
              if (isMounted && s?.success && s?.data?.activeYear?.year) {
                setActiveYearLabel(s.data.activeYear.year);
              }
            })
            .catch(() => {});
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
      name: "สถิติรายปี & สาขาวิชา",
      href: "/admin/analytics",
      icon: BarChart3,
      active: pathname.startsWith("/admin/analytics"),
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
      name: "สถิติงานแนะแนว & Quiz",
      href: "/admin/guidance",
      icon: Compass,
      active: pathname.startsWith("/admin/guidance"),
    },
    {
      name: "จัดการค่าใช้จ่ายแรกเข้า",
      href: "/admin/expenses",
      icon: Coins,
      active: pathname.startsWith("/admin/expenses"),
    },
    {
      name: "ศูนย์ส่งออก ศธ.02 / RMS",
      href: "/admin/export",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/admin/export"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl("/npc-logo.jpg")}
              alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
              width={32}
              height={32}
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
          <span className="font-semibold text-sm text-slate-900">ระบบรับสมัคร (เจ้าหน้าที่)</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="เมนูหลัก"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
        </button>
      </header>

      {/* Sidebar for Desktop / Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-50 transition-transform duration-200 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl("/npc-logo.jpg")}
                alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
                width={40}
                height={40}
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
            <div className="min-w-0">
              <h1 className="font-semibold text-sm text-slate-900 leading-tight truncate">
                วิทยาลัยสารพัดช่างน่าน
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 truncate tabular-nums">
                งานทะเบียน · ปีการศึกษา {activeYearLabel}
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-5 space-y-1 flex-1" aria-label="เมนูผู้ดูแลระบบ">
            <p className="text-xs font-medium text-slate-500 px-3 mb-2">
              เมนูหลัก
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm transition-colors ${
                    item.active
                      ? "bg-slate-100 text-[#162C63] font-semibold border border-slate-200/90"
                      : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.active ? "text-[#162C63]" : "text-slate-500"
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick link to public site */}
          <div className="pt-3 mt-4 border-t border-slate-200/80">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between h-9 px-3 text-xs font-medium text-slate-600 hover:text-[#162C63] hover:bg-slate-50 rounded-lg transition-colors"
            >
              <span>เปิดหน้าเว็บผู้สมัคร</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* User Card & Logout in Sidebar footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                {user?.username?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || user?.username || "ผู้ดูแลระบบ"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role === "SUPERADMIN" ? "ผู้ดูแลระบบสูงสุด" : user?.role || "เจ้าหน้าที่"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </div>
      </main>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden"
        />
      )}
    </div>
  );
}