"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl, assetUrl } from "@/lib/basepath";
import { Lock, User, ShieldCheck, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      // เข้าสู่ระบบสำเร็จ ย้ายไปหน้าแดชบอร์ด
      router.push("/admin");
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 font-sans text-slate-800">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/90 shadow-lg shadow-indigo-950/20 mx-auto bg-white flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl("/npc-logo.jpg")}
              alt="ตราสัญลักษณ์ วิทยาลัยสารพัดช่างน่าน"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.src.includes("/npc_admission")) {
                  el.src = "/npc_admission/npc-logo.jpg";
                }
              }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              เข้าสู่ระบบสำหรับเจ้าหน้าที่
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ระบบรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#1E3A8A]"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">รหัสผ่าน (Password)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#1E3A8A]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * ข้อมูลตั้งต้นจากระบบ: admin / Admin@NPC2570
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-indigo-900 text-white font-bold text-sm shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#1E3A8A] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลักผู้สมัคร</span>
          </Link>
          <div className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ความปลอดภัยระดับสูง</span>
          </div>
        </div>
      </div>
    </div>
  );
}
