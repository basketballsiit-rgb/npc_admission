import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCID, sanitizeCID, validateThaiCID, maskCID } from "@/lib/security";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface VerifyRequestBody {
  cid: string;
  birthDate: string; // "YYYY-MM-DD"
  phone: string;
}

/**
 * POST /api/applications/verify
 * ยืนยันตัวตนผู้สมัคร 3 ปัจจัย: เลขบัตร ปชช. 13 หลัก + วันเดือนปีเกิด + เบอร์โทรศัพท์
 * ปลอดภัยด้วย cidHash และป้องกัน Brute-force
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);

    // Rate Limiting: ป้องกันการยิงสุ่มรหัส (10 ครั้ง ต่อ 1 นาที ต่อ IP)
    const limitResult = rateLimit(`verify_auth:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: `คุณกรอกข้อมูลผิดบ่อยเกินไป กรุณารอ ${limitResult.resetInSeconds} วินาทีก่อนลองใหม่`,
        },
        { status: 429 }
      );
    }

    const body: VerifyRequestBody = await request.json();
    const { cid, birthDate, phone } = body;

    if (!cid || !birthDate || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS",
          message: "กรุณากรอกเลขบัตรประชาชน วันเดือนปีเกิด และเบอร์โทรศัพท์ให้ครบถ้วน",
        },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบ Checksum เลขบัตรประชาชน
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

    // 2. ค้นหาด้วย HMAC-SHA256 Hash
    const applicantCidHash = hashCID(cleanCID);
    const applications = await prisma.application.findMany({
      where: { cidHash: applicantCidHash },
      orderBy: { createdAt: "desc" },
      include: {
        program: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            isOpen: true,
          },
        },
        round: {
          select: {
            id: true,
            name: true,
            roundType: true,
            startAt: true,
            endAt: true,
            announceAt: true,
            academicYearId: true,
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
          message: "ไม่พบข้อมูลประวัติการสมัครด้วยเลขบัตรประชาชนนี้",
        },
        { status: 404 }
      );
    }

    // 3. ตรวจสอบความตรงกันของวันเดือนปีเกิดและเบอร์โทรศัพท์
    const inputDateStr = new Date(birthDate).toISOString().split("T")[0];
    const cleanInputPhone = phone.replace(/\D/g, "");

    const matchedApp = applications.find((app) => {
      const appDateStr = new Date(app.birthDate).toISOString().split("T")[0];
      const appPhone = app.phone.replace(/\D/g, "");

      const dateMatch = appDateStr === inputDateStr;
      const phoneMatch =
        appPhone === cleanInputPhone ||
        appPhone.endsWith(cleanInputPhone) ||
        cleanInputPhone.endsWith(appPhone);

      return dateMatch && phoneMatch;
    });

    if (!matchedApp) {
      return NextResponse.json(
        {
          success: false,
          error: "AUTH_FAILED",
          message:
            "ข้อมูลวันเดือนปีเกิด หรือเบอร์โทรศัพท์ไม่ตรงกับที่ระบุไว้ในใบสมัคร",
        },
        { status: 401 }
      );
    }

    // 4. คำนวณสถานะและสิทธิ์ตามเวลา Server จริง
    const now = new Date();
    const isRoundOpen =
      now >= matchedApp.round.startAt && now <= matchedApp.round.endAt;
    const isAnnounced = now >= matchedApp.round.announceAt;

    // การอนุญาตแก้ไข: รอบยังเปิดอยู่ และยังไม่ถึงวันประกาศผล และสถานะเป็น PENDING
    const canEdit = isRoundOpen && !isAnnounced && matchedApp.status === "PENDING";

    // สิทธิ์กรอกข้อมูลทะเบียนประวัติเพิ่มเติม (กรณี APPROVED เท่านั้น)
    const canFillExtendedInfo = matchedApp.status === "APPROVED";

    // ตรวจสอบหารอบอื่นที่กำลังเปิดรับสมัครอยู่ (เช่น รอบปกติ หากรอบโควตา REJECTED)
    const currentlyOpenRounds = await prisma.admissionRound.findMany({
      where: {
        academicYearId: matchedApp.round.academicYearId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        id: { not: matchedApp.roundId },
      },
      include: {
        academicYear: { select: { year: true } },
      },
    });

    // ดึงสาขาวิชาทั้งหมดของปีการศึกษานี้ที่เปิดรับ เพื่อให้เลือกเปลี่ยนสาขาได้
    const availablePrograms = await prisma.programQuota.findMany({
      where: {
        academicYearId: matchedApp.round.academicYearId,
        isOpen: true,
      },
      orderBy: [{ level: "asc" }, { code: "asc" }],
    });

    // แยกข้อมูล addressInfo JSON
    let parsedAddressInfo: Record<string, unknown> = {};
    try {
      if (matchedApp.addressInfo) {
        parsedAddressInfo = JSON.parse(matchedApp.addressInfo);
      }
    } catch {
      parsedAddressInfo = { address: matchedApp.addressInfo };
    }

    return NextResponse.json({
      success: true,
      data: {
        id: matchedApp.id,
        applicationNo: matchedApp.applicationNo,
        applicantName: `${matchedApp.prefix} ${matchedApp.firstName} ${matchedApp.lastName}`,
        prefix: matchedApp.prefix,
        firstName: matchedApp.firstName,
        lastName: matchedApp.lastName,
        birthDate: matchedApp.birthDate,
        phone: matchedApp.phone,
        cidMasked: maskCID(cleanCID),
        previousSchool: matchedApp.previousSchool,
        schoolProvince: matchedApp.schoolProvince,
        previousEducation: matchedApp.previousEducation,
        gpax: matchedApp.gpax,
        status: matchedApp.status,
        programId: matchedApp.programId,
        program: matchedApp.program,
        round: matchedApp.round,
        appliedAt: matchedApp.createdAt,
        updatedAt: matchedApp.updatedAt,
        addressInfo: parsedAddressInfo,
        serverTime: now.toISOString(),
        isRoundOpen,
        isAnnounced,
        canEdit,
        canFillExtendedInfo,
        alternativeOpenRounds: currentlyOpenRounds.map((r) => ({
          id: r.id,
          name: r.name,
          roundType: r.roundType,
          startAt: r.startAt,
          endAt: r.endAt,
          announceAt: r.announceAt,
        })),
        availablePrograms: availablePrograms.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          level: p.level,
        })),
      },
    });
  } catch (error) {
    console.error("POST /api/applications/verify Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" },
      { status: 500 }
    );
  }
}
