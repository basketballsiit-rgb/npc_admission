import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";


/**
 * GET /api/admin/auth/me
 * ตรวจสอบสถานะการล็อกอินปัจจุบันของเจ้าหน้าที่
 */
export async function GET(request: Request) {
  const session = await getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: session,
    admin: session,
  });
}
