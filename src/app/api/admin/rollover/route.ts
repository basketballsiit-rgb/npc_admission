import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * คำนวณยอดทบที่นั่งจากรอบโควตาสู่รอบปกติ
 */
async function calculateRollover(academicYearId?: string) {
  let yearId = academicYearId;
  let year = null;

  if (!yearId) {
    year = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });
    yearId = year?.id;
  } else {
    year = await prisma.academicYear.findUnique({
      where: { id: yearId },
    });
  }

  if (!yearId || !year) {
    throw new Error("ไม่พบปีการศึกษาที่ระบุ");
  }

  // 1. ค้นหารอบโควตา (QUOTA) ของปีการศึกษานี้
  const quotaRound = await prisma.admissionRound.findFirst({
    where: {
      academicYearId: yearId,
      roundType: "QUOTA",
    },
  });

  if (!quotaRound) {
    throw new Error(`ไม่พบรอบโควตา (QUOTA) ในปีการศึกษา ${year.year}`);
  }

  // 2. ดึงรายการสาขาวิชาทั้งหมดในปีการศึกษานี้
  const programs = await prisma.programQuota.findMany({
    where: { academicYearId: yearId },
    orderBy: [{ level: "asc" }, { code: "asc" }],
  });

  // 3. คำนวณยอดผู้ผ่านการคัดเลือก (APPROVED) ในรอบโควตาแต่ละสาขา
  const report = [];
  let grandTotalRollover = 0;

  for (const prog of programs) {
    const approvedCount = await prisma.application.count({
      where: {
        roundId: quotaRound.id,
        programId: prog.id,
        status: "APPROVED",
      },
    });

    // ที่นั่งว่างคงเหลือจากรอบโควตา = quotaSeats - approvedCount (ไม่ต่ำกว่า 0)
    const remainingSeats = Math.max(0, prog.quotaSeats - approvedCount);
    grandTotalRollover += remainingSeats;

    report.push({
      programId: prog.id,
      code: prog.code,
      level: prog.level,
      name: prog.name,
      quotaSeats: prog.quotaSeats,
      approvedQuota: approvedCount,
      rolloverSeats: remainingSeats,
      regularSeats: prog.regularSeats,
      totalRegularSeats: prog.regularSeats + remainingSeats, // ที่นั่งรอบปกติใหม่หลังทบยอด
    });
  }

  return {
    year,
    quotaRound,
    report,
    grandTotalRollover,
  };
}

/**
 * GET /api/admin/rollover
 * ดูตัวอย่างการคำนวณที่นั่งทบยอด (Preview ก่อนบันทึกจริง)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId") || undefined;

    const result = await calculateRollover(academicYearId);

    const now = new Date();
    const isQuotaEnded = now > result.quotaRound.endAt;

    const summaryPrograms = result.report.map((item) => ({
      ...item,
      id: item.programId,
      approvedCount: item.approvedQuota,
      newRegularTotal: item.totalRegularSeats,
    }));

    return NextResponse.json({
      success: true,
      mode: "PREVIEW",
      academicYear: result.year.year,
      quotaRound: result.quotaRound.name,
      totalPrograms: result.report.length,
      grandTotalRollover: result.grandTotalRollover,
      isQuotaEnded,
      data: result.report,
      summary: {
        totalRolloverSeats: result.grandTotalRollover,
        programs: summaryPrograms,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/rollover Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการคำนวณ";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * POST /api/admin/rollover
 * ดำเนินการคำนวณและบันทึกยอดทบที่นั่ง (rolloverSeats) ลงฐานข้อมูลจริง
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const academicYearId = body.academicYearId || undefined;

    const result = await calculateRollover(academicYearId);

    // บันทึกค่า rolloverSeats ลงในตาราง program_quotas ด้วย Transaction
    await prisma.$transaction(
      result.report.map((item) =>
        prisma.programQuota.update({
          where: { id: item.programId },
          data: {
            rolloverSeats: item.rolloverSeats,
          },
        })
      )
    );

    const summaryPrograms = result.report.map((item) => ({
      ...item,
      id: item.programId,
      approvedCount: item.approvedQuota,
      newRegularTotal: item.totalRegularSeats,
    }));

    return NextResponse.json({
      success: true,
      mode: "COMMITTED",
      message: `ทบยอดที่นั่งจากรอบโควตาสู่รอบปกติสำเร็จ รวม ${result.grandTotalRollover} ที่นั่ง จาก ${result.report.length} สาขาวิชา`,
      academicYear: result.year.year,
      quotaRound: result.quotaRound.name,
      grandTotalRollover: result.grandTotalRollover,
      data: result.report,
      summary: {
        totalRolloverSeats: result.grandTotalRollover,
        programs: summaryPrograms,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/rollover Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผลทบยอด";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
