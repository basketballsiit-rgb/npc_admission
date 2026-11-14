import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";


/**
 * GET /api/admin/settings
 * ดึงข้อมูลการตั้งค่าทั้งหมด (ปีการศึกษา, รอบรับสมัคร, สาขาวิชาและโควตา)
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
    const yearIdParam = searchParams.get("academicYearId");

    const allYears = await prisma.academicYear.findMany({
      orderBy: { year: "desc" },
    });

    let activeYear = null;
    if (yearIdParam) {
      activeYear = allYears.find((y) => y.id === yearIdParam) || allYears[0];
    } else {
      activeYear = allYears.find((y) => y.isActive) || allYears[0];
    }

    if (!activeYear) {
      return NextResponse.json({
        success: true,
        years: [],
        rounds: [],
        programs: [],
      });
    }

    const rounds = await prisma.admissionRound.findMany({
      where: { academicYearId: activeYear.id },
      orderBy: { startAt: "asc" },
    });

    const programs = await prisma.programQuota.findMany({
      where: { academicYearId: activeYear.id },
      orderBy: [{ level: "asc" }, { code: "asc" }],
    });

    return NextResponse.json({
      success: true,
      activeYear,
      allYears,
      rounds,
      programs,
    });
  } catch (error) {
    console.error("GET /api/admin/settings Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * บันทึกการตั้งค่าปีการศึกษา รอบรับสมัคร และสาขาวิชา
 */
export async function POST(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // 1. สร้างปีการศึกษาใหม่
    if (action === "CREATE_YEAR") {
      const { year, makeActive } = body;
      if (!year || !year.trim()) {
        return NextResponse.json({ success: false, error: "กรุณาระบุปีการศึกษา" }, { status: 400 });
      }

      if (makeActive) {
        await prisma.academicYear.updateMany({ data: { isActive: false } });
      }

      const newYear = await prisma.academicYear.create({
        data: {
          year: year.trim(),
          isActive: Boolean(makeActive),
        },
      });

      return NextResponse.json({
        success: true,
        message: `สร้างปีการศึกษา ${newYear.year} เรียบร้อยแล้ว`,
        data: newYear,
      });
    }

    // 2. สลับปีการศึกษาปัจจุบัน (Active Year)
    if (action === "SWITCH_ACTIVE_YEAR") {
      const { yearId } = body;
      await prisma.academicYear.updateMany({ data: { isActive: false } });
      const updatedYear = await prisma.academicYear.update({
        where: { id: yearId },
        data: { isActive: true },
      });

      return NextResponse.json({
        success: true,
        message: `ตั้งปีการศึกษา ${updatedYear.year} เป็นปีที่เปิดใช้งานปัจจุบันแล้ว`,
        data: updatedYear,
      });
    }

    // 3. สร้างหรือแก้ไขรอบการรับสมัคร
    if (action === "SAVE_ROUND") {
      const { id, academicYearId, name, roundType, startAt, endAt, announceAt, isActive } = body;

      if (!academicYearId || !name || !roundType || !startAt || !endAt || !announceAt) {
        return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลรอบรับสมัครให้ครบถ้วน" }, { status: 400 });
      }

      let savedRound;
      if (id) {
        savedRound = await prisma.admissionRound.update({
          where: { id },
          data: {
            name: name.trim(),
            roundType,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            announceAt: new Date(announceAt),
            isActive: Boolean(isActive),
          },
        });
      } else {
        savedRound = await prisma.admissionRound.create({
          data: {
            academicYearId,
            name: name.trim(),
            roundType,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            announceAt: new Date(announceAt),
            isActive: Boolean(isActive),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `บันทึกข้อมูลรอบ "${savedRound.name}" เรียบร้อยแล้ว`,
        data: savedRound,
      });
    }

    // 4. บันทึกข้อมูลสาขาวิชา และสลับเปิด/ปิดรายสาขา
    if (action === "SAVE_PROGRAM") {
      const { id, code, name, level, quotaSeats, regularSeats, rolloverSeats, isOpen } = body;

      const updatedProg = await prisma.programQuota.update({
        where: { id },
        data: {
          code: code !== undefined ? code.trim() : undefined,
          name: name !== undefined ? name.trim() : undefined,
          level: level !== undefined ? level.trim() : undefined,
          quotaSeats: quotaSeats !== undefined ? Number(quotaSeats) : undefined,
          regularSeats: regularSeats !== undefined ? Number(regularSeats) : undefined,
          rolloverSeats: rolloverSeats !== undefined ? Number(rolloverSeats) : undefined,
          isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: `บันทึกข้อมูลสาขาวิชา "${updatedProg.name}" สำเร็จ`,
        data: updatedProg,
      });
    }

    // 5. เพิ่มสาขาวิชาใหม่สำหรับปีการศึกษา
    if (action === "CREATE_PROGRAM") {
      const { academicYearId, code, level, name, quotaSeats, regularSeats, isOpen } = body;

      if (!academicYearId || !code || !level || !name) {
        return NextResponse.json(
          { success: false, error: "กรุณากรอกข้อมูลสาขาวิชาให้ครบถ้วน (รหัสสาขา, ระดับชั้น, ชื่อสาขาวิชา)" },
          { status: 400 }
        );
      }

      // ตรวจสอบความซ้ำซ้อนของรหัสสาขาและระดับชั้นในปีการศึกษานี้
      const existing = await prisma.programQuota.findFirst({
        where: {
          academicYearId,
          code: code.trim(),
          level: level.trim(),
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: `มีรหัสสาขาวิชา ${code} (${level}) ในปีการศึกษานี้อยู่แล้ว` },
          { status: 400 }
        );
      }

      const newProg = await prisma.programQuota.create({
        data: {
          academicYearId,
          code: code.trim(),
          level: level.trim(),
          name: name.trim(),
          quotaSeats: Math.max(0, Number(quotaSeats) || 0),
          regularSeats: Math.max(0, Number(regularSeats) || 0),
          rolloverSeats: 0,
          isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `เพิ่มสาขาวิชา "${newProg.name}" (${newProg.level}) เรียบร้อยแล้ว`,
        data: newProg,
      });
    }

    // 6. ลบสาขาวิชา (กรณีที่ยังไม่มีผู้สมัคร)
    if (action === "DELETE_PROGRAM") {
      const { id } = body;
      const count = await prisma.application.count({ where: { programId: id } });
      if (count > 0) {
        return NextResponse.json(
          { success: false, error: `ไม่สามารถลบสาขาวิชานี้ได้ เนื่องจากมีผู้สมัครแล้วจำนวน ${count} คน (แนะนำให้กดปิดรับสมัครแทน)` },
          { status: 400 }
        );
      }

      await prisma.programQuota.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: "ลบสาขาวิชาเรียบร้อยแล้ว",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/settings Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" },
      { status: 500 }
    );
  }
}
