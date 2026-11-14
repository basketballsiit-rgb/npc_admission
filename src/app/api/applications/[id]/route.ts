import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UpdateApplicationBody {
  // ข้อมูลแก้ไขทั่วไป (สำหรับ PENDING)
  prefix?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  previousSchool?: string;
  schoolProvince?: string;
  previousEducation?: string;
  gpax?: number;
  programId?: string;

  // ข้อมูลครอบครัวและผู้ปกครอง
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;

  // ข้อมูลทะเบียนประวัติเพิ่มเติมสำหรับ ศธ.02 และ RMS (สำหรับ APPROVED)
  houseNo?: string;
  moo?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  bloodGroup?: string;

  addressInfo?: Record<string, unknown> | string;
}

/**
 * PUT /api/applications/[id]
 * แก้ไขข้อมูลใบสมัคร หรือกรอกข้อมูลทะเบียนประวัติเพิ่มเติมสำหรับผู้ผ่านการคัดเลือก (APPROVED)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateApplicationBody = await request.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        round: true,
        program: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลใบสมัคร" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isRoundClosed = now > application.round.endAt;

    // กรณีสถานะเป็น APPROVED: อนุญาตให้กรอก/อัปเดตข้อมูลทะเบียนประวัติเพิ่มเติม (ศธ.02/RMS) เสมอ
    if (application.status === "APPROVED") {
      let existingInfo: Record<string, unknown> = {};
      try {
        if (application.addressInfo) existingInfo = JSON.parse(application.addressInfo);
      } catch {
        existingInfo = { address: application.addressInfo };
      }

      const merged = {
        ...existingInfo,
        ...(typeof body.addressInfo === "object" && body.addressInfo !== null ? body.addressInfo : {}),
        ...(typeof body.addressInfo === "string" ? { address: body.addressInfo } : {}),
        ...(body.fatherName !== undefined ? { fatherName: body.fatherName.trim() } : {}),
        ...(body.motherName !== undefined ? { motherName: body.motherName.trim() } : {}),
        ...(body.guardianName !== undefined ? { guardianName: body.guardianName.trim() } : {}),
        ...(body.guardianRelation !== undefined ? { guardianRelation: body.guardianRelation.trim() } : {}),
        ...(body.guardianPhone !== undefined ? { guardianPhone: body.guardianPhone.trim() } : {}),
        // ฟิลด์ทะเบียนประวัติ ศธ.02/RMS
        ...(body.houseNo !== undefined ? { houseNo: body.houseNo.trim() } : {}),
        ...(body.moo !== undefined ? { moo: body.moo.trim() } : {}),
        ...(body.subdistrict !== undefined ? { subdistrict: body.subdistrict.trim() } : {}),
        ...(body.district !== undefined ? { district: body.district.trim() } : {}),
        ...(body.province !== undefined ? { province: body.province.trim() } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode.trim() } : {}),
        ...(body.bloodGroup !== undefined ? { bloodGroup: body.bloodGroup.trim() } : {}),
      };

      const updated = await prisma.application.update({
        where: { id },
        data: {
          phone: body.phone?.trim() ?? application.phone,
          addressInfo: JSON.stringify(merged),
        },
        include: {
          program: true,
          round: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "บันทึกข้อมูลทะเบียนประวัติเพิ่มเติมสำหรับระบบ ศธ.02 และ RMS เรียบร้อยแล้ว",
        data: {
          applicationNo: updated.applicationNo,
          applicantName: `${updated.prefix} ${updated.firstName} ${updated.lastName}`,
          program: `${updated.program.level} ${updated.program.name}`,
          status: updated.status,
          addressInfo: merged,
          updatedAt: updated.updatedAt,
        },
      });
    }

    // กรณีสถานะเป็น REJECTED หรือ CANCELLED: ไม่อนุญาตให้แก้ไขใบสมัครเดิม (ให้ไปสมัครรอบใหม่)
    if (application.status === "REJECTED" || application.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "APPLICATION_LOCKED",
          message: "ใบสมัครนี้สิ้นสุดกระบวนการแล้ว ไม่สามารถแก้ไขได้ หากมีรอบเปิดรับอยู่ท่านสามารถสมัครใหม่ได้",
        },
        { status: 400 }
      );
    }

    // กรณีสถานะเป็น PENDING: ตรวจสอบว่ารอบปิดหรือยัง
    if (isRoundClosed) {
      return NextResponse.json(
        {
          success: false,
          error: "ROUND_CLOSED",
          message: "ไม่สามารถแก้ไขใบสมัครได้ เนื่องจากรอบการรับสมัครสิ้นสุดลงแล้ว และอยู่ระหว่างรอการประกาศผล",
          closedAt: application.round.endAt,
          serverTime: now.toISOString(),
        },
        { status: 400 }
      );
    }

    // จัดการกรณีเปลี่ยนสาขาวิชา
    let newProgramId = application.programId;
    if (body.programId && body.programId !== application.programId) {
      const targetProgram = await prisma.programQuota.findUnique({
        where: { id: body.programId },
      });

      if (
        !targetProgram ||
        targetProgram.academicYearId !== application.round.academicYearId
      ) {
        return NextResponse.json(
          { success: false, error: "สาขาวิชาใหม่ไม่ถูกต้องสำหรับปีการศึกษานี้" },
          { status: 400 }
        );
      }

      if (!targetProgram.isOpen) {
        return NextResponse.json(
          {
            success: false,
            error: "สาขาวิชาปลายทางปิดรับสมัครชั่วคราว ไม่สามารถเปลี่ยนได้",
          },
          { status: 400 }
        );
      }
      newProgramId = targetProgram.id;
    }

    let existingInfo: Record<string, unknown> = {};
    try {
      if (application.addressInfo) existingInfo = JSON.parse(application.addressInfo);
    } catch {
      existingInfo = { address: application.addressInfo };
    }

    const merged = {
      ...existingInfo,
      ...(typeof body.addressInfo === "object" && body.addressInfo !== null ? body.addressInfo : {}),
      ...(typeof body.addressInfo === "string" ? { address: body.addressInfo } : {}),
      ...(body.fatherName !== undefined ? { fatherName: body.fatherName.trim() } : {}),
      ...(body.motherName !== undefined ? { motherName: body.motherName.trim() } : {}),
      ...(body.guardianName !== undefined ? { guardianName: body.guardianName.trim() } : {}),
      ...(body.guardianRelation !== undefined ? { guardianRelation: body.guardianRelation.trim() } : {}),
      ...(body.guardianPhone !== undefined ? { guardianPhone: body.guardianPhone.trim() } : {}),
    };

    const updated = await prisma.application.update({
      where: { id },
      data: {
        prefix: body.prefix ?? application.prefix,
        firstName: body.firstName?.trim() ?? application.firstName,
        lastName: body.lastName?.trim() ?? application.lastName,
        phone: body.phone?.trim() ?? application.phone,
        previousSchool: body.previousSchool?.trim() ?? application.previousSchool,
        schoolProvince: body.schoolProvince?.trim() ?? application.schoolProvince,
        previousEducation:
          body.previousEducation?.trim() ?? application.previousEducation,
        gpax: body.gpax !== undefined ? Number(body.gpax) : application.gpax,
        programId: newProgramId,
        addressInfo: JSON.stringify(merged),
      },
      include: {
        program: true,
        round: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลใบสมัครเรียบร้อยแล้ว",
      data: {
        applicationNo: updated.applicationNo,
        applicantName: `${updated.prefix} ${updated.firstName} ${updated.lastName}`,
        program: `${updated.program.level} ${updated.program.name}`,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("PUT /api/applications/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขใบสมัคร" },
      { status: 500 }
    );
  }
}
