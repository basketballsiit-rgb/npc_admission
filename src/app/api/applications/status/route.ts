import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCID, sanitizeCID, validateThaiCID } from "@/lib/security";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/applications/status?cid=... หรือ ?applicationNo=...
 * ค้นหาสถานะใบสมัคร พร้อมระบบป้องกัน Brute-force อัตโนมัติ
 */
export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);

    // Rate Limiting: 10 requests ต่อ 1 นาที ต่อ IP
    const limitResult = rateLimit(`status_check:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: `คุณค้นหาถี่เกินไป กรุณารอ ${limitResult.resetInSeconds} วินาทีแล้วลองใหม่`,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");
    const applicationNo = searchParams.get("applicationNo");

    if (!cid && !applicationNo) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_PARAMETER",
          message: "กรุณาระบุเลขประจำตัวประชาชน 13 หลัก หรือเลขที่ใบสมัคร",
        },
        { status: 400 }
      );
    }

    let whereClause: Record<string, unknown> = {};

    if (cid) {
      const cleanCID = sanitizeCID(cid);
      if (!validateThaiCID(cleanCID)) {
        return NextResponse.json(
          {
            success: false,
            error: "INVALID_CID",
            message: "รูปแบบเลขประจำตัวประชาชน 13 หลักไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }
      // ค้นหาด้วย HMAC-SHA256 Hash เพื่อความรวดเร็วและปลอดภัยระดับสูงสุด
      const hashed = hashCID(cleanCID);
      whereClause = { cidHash: hashed };
    } else if (applicationNo) {
      whereClause = { applicationNo: applicationNo.trim() };
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        program: {
          select: { code: true, name: true, level: true },
        },
        round: {
          select: {
            id: true,
            name: true,
            roundType: true,
            startAt: true,
            endAt: true,
            announceAt: true,
            academicYear: { select: { year: true } },
          },
        },
      },
    });

    if (applications.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "ไม่พบข้อมูลใบสมัครในระบบ",
        },
        { status: 404 }
      );
    }

    const now = new Date();

    const results = applications.map((app) => ({
      id: app.id,
      applicationNo: app.applicationNo,
      applicantName: `${app.prefix} ${app.firstName} ${app.lastName}`,
      cidMasked: app.cidMasked,
      program: `${app.program.level} ${app.program.name} (${app.program.code})`,
      roundName: app.round.name,
      roundType: app.round.roundType,
      academicYear: app.round.academicYear.year,
      status: app.status,
      appliedAt: app.createdAt,
      announceAt: app.round.announceAt,
      addressInfo: app.addressInfo,
      // สามารถแก้ไขได้หรือไม่ (ต้องยังไม่ปิดรอบ)
      canEdit: now <= app.round.endAt && app.status === "PENDING",
    }));

    return NextResponse.json({
      success: true,
      total: results.length,
      data: results,
    });
  } catch (error) {
    console.error("GET /api/applications/status Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการค้นหาข้อมูล" },
      { status: 500 }
    );
  }
}
