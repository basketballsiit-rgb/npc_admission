import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateThaiCID,
  encryptCID,
  hashCID,
  maskCID,
  sanitizeCID,
} from "@/lib/security";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface ApplicationRequestBody {
  roundId: string;
  programId: string;
  cid: string;
  prefix: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string e.g. "2009-05-15"
  phone: string;
  previousSchool: string;
  schoolProvince: string;
  previousEducation: string; // e.g. "ม.3", "ปวช.3", "ม.6"
  gpax: number;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  addressInfo?: Record<string, unknown> | string;
}

/**
 * POST /api/applications
 * ยื่นใบสมัครใหม่ พร้อมตรวจสอบกติกาความถูกต้องและวันเวลาระดับ Server
 */
export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: ป้องกันการยิงสแปม (15 ครั้ง ต่อ 10 นาที ต่อ IP)
    const clientIp = getClientIp(request.headers);
    const limitResult = rateLimit(`app_submit:${clientIp}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 15,
    });

    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: `มีการส่งคำขอถี่เกินไป กรุณารออีก ${limitResult.resetInSeconds} วินาทีก่อนลองใหม่`,
        },
        { status: 429 }
      );
    }

    const body: ApplicationRequestBody = await request.json();
    const {
      roundId,
      programId,
      cid,
      prefix,
      firstName,
      lastName,
      birthDate,
      phone,
      previousSchool,
      schoolProvince,
      previousEducation,
      gpax,
      addressInfo,
    } = body;

    // 2. ตรวจสอบข้อมูลบังคับพื้นฐาน
    if (
      !roundId ||
      !programId ||
      !cid ||
      !prefix ||
      !firstName ||
      !lastName ||
      !birthDate ||
      !phone ||
      !previousSchool ||
      !schoolProvince ||
      !previousEducation ||
      gpax === undefined ||
      gpax === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบทุกช่อง",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบความถูกต้องของเกรดเฉลี่ย (GPAX ต้องเป็นตัวเลข 0.00 - 4.00 แต่ไม่บล็อกขั้นต่ำ)
    const parsedGpax = Number(gpax);
    if (isNaN(parsedGpax) || parsedGpax < 0 || parsedGpax > 4.0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_GPAX",
          message: "เกรดเฉลี่ยสะสม (GPAX) ต้องอยู่ระหว่าง 0.00 ถึง 4.00",
        },
        { status: 400 }
      );
    }

    // 3. ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย 13 หลัก ตามสูตร Modulo 11
    const cleanCID = sanitizeCID(cid);
    if (!validateThaiCID(cleanCID)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CID",
          message: "เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามสูตรคำนวณของกรมการปกครอง",
        },
        { status: 400 }
      );
    }

    // 4. ตรวจสอบรอบการรับสมัครและเวลา Server จริง
    const round = await prisma.admissionRound.findUnique({
      where: { id: roundId },
      include: { academicYear: true },
    });

    if (!round || !round.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "ROUND_NOT_FOUND",
          message: "ไม่พบรอบการรับสมัครที่ระบุ หรือรอบนี้ปิดการใช้งานแล้ว",
        },
        { status: 404 }
      );
    }

    const now = new Date(); // ตรวจสอบเวลา Server จริง ณ วินาทีนี้
    if (now < round.startAt) {
      return NextResponse.json(
        {
          success: false,
          error: "ROUND_NOT_OPENED",
          message: `รอบนี้ยังไม่เปิดรับสมัคร (เปิดรับวันที่ ${round.startAt.toLocaleString("th-TH")})`,
          serverTime: now.toISOString(),
        },
        { status: 400 }
      );
    }

    if (now > round.endAt) {
      return NextResponse.json(
        {
          success: false,
          error: "ROUND_CLOSED",
          message: `รอบการรับสมัครนี้ปิดรับสมัครแล้วเมื่อวันที่ ${round.endAt.toLocaleString("th-TH")}`,
          serverTime: now.toISOString(),
        },
        { status: 400 }
      );
    }

    // 5. ตรวจสอบสาขาวิชาและสถานะการเปิดรับ (isOpen)
    const program = await prisma.programQuota.findUnique({
      where: { id: programId },
    });

    if (!program || program.academicYearId !== round.academicYearId) {
      return NextResponse.json(
        {
          success: false,
          error: "PROGRAM_NOT_FOUND",
          message: "ไม่พบสาขาวิชาที่ระบุสำหรับปีการศึกษานี้",
        },
        { status: 404 }
      );
    }

    if (!program.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: "PROGRAM_CLOSED",
          message: `สาขาวิชา "${program.name}" ปิดรับสมัครชั่วคราว`,
        },
        { status: 400 }
      );
    }

    // 6. กติกาตรวจสอบเลข 13 หลักซ้ำด้วย cidHash ในปีการศึกษาเดียวกัน
    const applicantCidHash = hashCID(cleanCID);

    // ดึงประวัติการสมัครทั้งหมดของเลข 13 หลักนี้ในปีการศึกษาเดียวกัน
    const existingApplications = await prisma.application.findMany({
      where: {
        cidHash: applicantCidHash,
        round: {
          academicYearId: round.academicYearId,
        },
      },
      include: {
        round: true,
        program: true,
      },
    });

    // 6.1 เช็กการสมัครซ้ำในรอบเดียวกัน: ห้ามสมัครซ้ำ (แต่สามารถแก้ไขใบสมัครเดิมได้)
    const duplicateInThisRound = existingApplications.find(
      (app) => app.roundId === round.id
    );

    if (duplicateInThisRound) {
      return NextResponse.json(
        {
          success: false,
          error: "DUPLICATE_IN_ROUND",
          message: `ท่านได้ยื่นใบสมัครในรอบ "${round.name}" แล้ว (เลขที่ใบสมัคร: ${duplicateInThisRound.applicationNo}) หากต้องการแก้ไขข้อมูล กรุณาใช้ระบบแก้ไขใบสมัคร`,
          applicationNo: duplicateInThisRound.applicationNo,
          applicationId: duplicateInThisRound.id,
        },
        { status: 409 }
      );
    }

    // 6.2 กติการอบปกติ (REGULAR): ตรวจสอบผลจากรอบโควตา (QUOTA)
    if (round.roundType === "REGULAR") {
      const quotaApp = existingApplications.find(
        (app) => app.round.roundType === "QUOTA"
      );

      if (quotaApp) {
        // หากมีสถานะ APPROVED ในรอบโควตาแล้ว -> ล็อกไม่ให้สมัครใหม่ในรอบปกติ
        if (quotaApp.status === "APPROVED") {
          return NextResponse.json(
            {
              success: false,
              error: "QUOTA_APPROVED_LOCKED",
              message:
                "ท่านผ่านการคัดเลือกรอบโควตาพิเศษแล้ว จึงไม่สามารถสมัครใหม่ในรอบปกติได้",
              applicationNo: quotaApp.applicationNo,
              programName: quotaApp.program.name,
            },
            { status: 403 }
          );
        }

        // หากสถานะยังคงเป็น PENDING อยู่ระหว่างพิจารณาในรอบโควตา
        if (quotaApp.status === "PENDING") {
          return NextResponse.json(
            {
              success: false,
              error: "QUOTA_PENDING",
              message:
                "ใบสมัครรอบโควตาของท่านยังอยู่ระหว่างการพิจารณา หากต้องการยกเลิกเพื่อสมัครรอบปกติ กรุณาติดต่อฝ่ายทะเบียน",
              applicationNo: quotaApp.applicationNo,
            },
            { status: 403 }
          );
        }

        // หากสถานะเป็น REJECTED หรือ CANCELLED ในรอบโควตา -> อนุญาตให้สมัครรอบปกติได้ทันที
      }
    }

    // 7. เข้ารหัส CID และสร้างเลขที่ใบสมัครอัตโนมัติ (เช่น NPC70-Q-0001 หรือ NPC70-R-0001)
    const cidEncrypted = encryptCID(cleanCID);
    const cidMasked = maskCID(cleanCID);

    // ดึงจำนวนใบสมัครในรอบนี้เพื่อสร้างลำดับตัวเลข
    const appCountInRound = await prisma.application.count({
      where: { roundId: round.id },
    });

    const shortYear = round.academicYear.year.slice(-2); // เช่น "70" จาก "2570"
    const roundCode =
      round.roundType === "QUOTA"
        ? "Q"
        : round.roundType === "REGULAR"
        ? "R"
        : "E";
    const sequence = String(appCountInRound + 1).padStart(4, "0");
    const applicationNo = `NPC${shortYear}-${roundCode}-${sequence}`;

    // จัดเก็บข้อมูลที่อยู่และครอบครัว (บิดา มารดา ผู้ปกครอง) ในรูปแบบ JSON
    const familyAndAddress = {
      ...(typeof addressInfo === "object" && addressInfo !== null ? addressInfo : {}),
      ...(typeof addressInfo === "string" ? { address: addressInfo } : {}),
      fatherName: body.fatherName?.trim() || undefined,
      motherName: body.motherName?.trim() || undefined,
      guardianName: body.guardianName?.trim() || undefined,
      guardianRelation: body.guardianRelation?.trim() || undefined,
      guardianPhone: body.guardianPhone?.trim() || undefined,
    };

    // 8. บันทึกใบสมัครลงในฐานข้อมูล (Prisma Parameterized Query ป้องกัน SQL Injection 100%)
    const newApplication = await prisma.application.create({
      data: {
        applicationNo,
        roundId: round.id,
        programId: program.id,
        cidEncrypted,
        cidHash: applicantCidHash,
        cidMasked,
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: new Date(birthDate),
        phone: phone.trim(),
        previousSchool: previousSchool.trim(),
        schoolProvince: schoolProvince.trim(),
        previousEducation: previousEducation.trim(),
        gpax: parsedGpax,
        status: "PENDING",
        addressInfo: JSON.stringify(familyAndAddress),
      },
      include: {
        program: {
          select: { code: true, name: true, level: true },
        },
        round: {
          select: { name: true, roundType: true, announceAt: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "ยื่นใบสมัครสำเร็จเรียบร้อยแล้ว",
        data: {
          applicationNo: newApplication.applicationNo,
          applicantName: `${newApplication.prefix} ${newApplication.firstName} ${newApplication.lastName}`,
          cidMasked: newApplication.cidMasked,
          program: `${newApplication.program.level} ${newApplication.program.name} (${newApplication.program.code})`,
          round: newApplication.round.name,
          announceAt: newApplication.round.announceAt,
          guardianName: familyAndAddress.guardianName,
          guardianPhone: familyAndAddress.guardianPhone,
          status: newApplication.status,
          createdAt: newApplication.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/applications Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "เกิดข้อผิดพลาดในการบันทึกใบสมัคร กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}
