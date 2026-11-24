import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";


/**
 * GET /api/admin/applications
 * ดึงรายการผู้สมัครพร้อมตัวกรอง (ปี, รอบ, ระดับ, สาขา, สถานะ) และการจัดเรียงเกรดเฉลี่ย (GPAX)
 */
export async function GET(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearIdParam = searchParams.get("academicYearId");
    const roundId = searchParams.get("roundId");
    const level = searchParams.get("level");
    const programId = searchParams.get("programId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt"; // gpax | createdAt | name
    const sortOrder = searchParams.get("sortOrder") || "desc"; // asc | desc

    const allYears = await prisma.academicYear.findMany({
      orderBy: { year: "desc" },
      select: { id: true, year: true, isActive: true },
    });

    let activeYear = academicYearIdParam
      ? allYears.find((y) => y.id === academicYearIdParam) || null
      : allYears.find((y) => y.isActive) || allYears[0] || null;

    if (!activeYear && academicYearIdParam) {
      activeYear = allYears.find((y) => y.isActive) || allYears[0] || null;
    }

    const where: Record<string, any> = {};

    if (activeYear) {
      where.round = { academicYearId: activeYear.id };
    }
    if (roundId) where.roundId = roundId;
    if (programId) where.programId = programId;
    if (status && status !== "ALL") where.status = status;

    if (level) {
      where.program = { level };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { applicationNo: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { previousSchool: { contains: q } },
      ];
    }

    let orderBy: Record<string, any> = {};
    if (sortBy === "gpax") {
      orderBy = { gpax: sortOrder };
    } else if (sortBy === "name") {
      orderBy = { firstName: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy,
      include: {
        program: {
          select: { id: true, code: true, name: true, level: true },
        },
        round: {
          select: { id: true, name: true, roundType: true, announceAt: true },
        },
      },
    });

    const formatted = applications.map((a) => {
      let parsedAddress: Record<string, any> = {};
      try {
        if (a.addressInfo) parsedAddress = JSON.parse(a.addressInfo);
      } catch {
        parsedAddress = { address: a.addressInfo };
      }

      return {
        id: a.id,
        applicationNo: a.applicationNo,
        applicantName: `${a.prefix} ${a.firstName} ${a.lastName}`,
        prefix: a.prefix,
        firstName: a.firstName,
        lastName: a.lastName,
        cidMasked: a.cidMasked,
        birthDate: a.birthDate,
        phone: a.phone,
        previousSchool: a.previousSchool,
        schoolProvince: a.schoolProvince,
        previousEducation: a.previousEducation,
        gpax: a.gpax,
        status: a.status,
        programId: a.programId,
        program: a.program,
        roundId: a.roundId,
        round: a.round,
        addressInfo: parsedAddress,
        appliedAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      currentYear: activeYear,
      allYears,
      total: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/admin/applications Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้สมัคร" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/applications
 * เปลี่ยนสถานะผู้สมัคร (รายบุคคล หรือ Bulk Approve อนุมัติยกล็อต)
 */
export async function PUT(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { applicationIds, status } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุรายชื่อใบสมัครที่ต้องการดำเนินการ" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED", "PENDING", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "สถานะไม่ถูกต้อง (APPROVED, REJECTED, PENDING, CANCELLED)" },
        { status: 400 }
      );
    }

    // อัปเดตสถานะทั้งหมดด้วย Transaction
    const result = await prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
      },
      data: {
        status,
      },
    });

    const statusText =
      status === "APPROVED"
        ? "ผ่านการคัดเลือก (อนุมัติ)"
        : status === "REJECTED"
        ? "ไม่ผ่านการคัดเลือก"
        : status === "PENDING"
        ? "รอการพิจารณา"
        : "ยกเลิก";

    return NextResponse.json({
      success: true,
      message: `เปลี่ยนสถานะเป็น "${statusText}" เรียบร้อยแล้ว จำนวน ${result.count} รายการ`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("PUT /api/admin/applications Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตสถานะผู้สมัคร" },
      { status: 500 }
    );
  }
}
