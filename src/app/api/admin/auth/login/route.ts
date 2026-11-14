import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";


/**
 * POST /api/admin/auth/login
 * ล็อกอินเข้าสู่ระบบสำหรับเจ้าหน้าที่และผู้ดูแลระบบ
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);

    // Rate Limiting: ป้องกัน Brute-force Login (5 ครั้งต่อนาที)
    const limit = rateLimit(`admin_login:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    });

    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: `พยายามล็อกอินถี่เกินไป กรุณารอ ${limit.resetInSeconds} วินาทีก่อนลองใหม่`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหาบัญชีผู้ดูแลระบบ
    const admin = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบรหัสผ่านด้วย bcrypt
    const isPasswordValid = verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    };

    const token = createAdminToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: sessionUser,
      token,
    });

    // กำหนด HttpOnly Cookie เพื่อความปลอดภัยระดับสูงสุด
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 ชั่วโมง
    });

    return response;
  } catch (error) {
    console.error("POST /api/admin/auth/login Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}
