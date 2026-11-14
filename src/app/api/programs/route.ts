import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/programs
 * ดึงรายการสาขาวิชาทั้งหมดที่เปิดรับสมัครของปีการศึกษาปัจจุบัน (หรือตาม academicYearId)
 * พร้อมคำนวณยอดผู้สมัครปัจจุบันและจำนวนที่นั่งคงเหลือแบบ Real-time
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");
    const level = searchParams.get("level"); // ปวช. หรือ ปวส.

    // หากไม่ระบุ academicYearId ให้ดึงปีการศึกษาที่ isActive: true
    let yearId: string | null = academicYearId;
    let activeYear = null;

    if (!yearId) {
      activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        include: {
          rounds: {
            where: { isActive: true },
            orderBy: { startAt: "asc" },
          },
        },
      });
      yearId = activeYear?.id ?? null;
    }

    if (!yearId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบปีการศึกษาที่เปิดใช้งานอยู่ในระบบ" },
        { status: 404 }
      );
    }

    // หารอบปัจจุบันที่กำลังเปิดรับสมัครอยู่ตามเวลา Server จริง
    const now = new Date();
    const currentOpenRound = await prisma.admissionRound.findFirst({
      where: {
        academicYearId: yearId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });

    const whereClause: {
      academicYearId: string;
      level?: string;
    } = {
      academicYearId: yearId,
    };

    if (level) {
      whereClause.level = level;
    }

    const programs = await prisma.programQuota.findMany({
      where: whereClause,
      orderBy: [{ level: "asc" }, { code: "asc" }],
      include: {
        academicYear: {
          select: { year: true, isActive: true },
        },
        applications: {
          select: {
            id: true,
            roundId: true,
            status: true,
          },
        },
      },
    });

    // คำนวณสรุปข้อมูลที่นั่งและยอดผู้สมัครในแต่ละสาขา
    const formatted = programs.map((p) => {
      // ผู้สมัครทั้งหมดในสาขานี้ที่ไม่ถูกยกเลิก (CANCELLED)
      const validApplications = p.applications.filter((a) => a.status !== "CANCELLED");

      // ผู้สมัครในรอบปัจจุบัน (ถ้ามีรอบเปิดอยู่)
      const currentRoundApps = currentOpenRound
        ? validApplications.filter((a) => a.roundId === currentOpenRound.id)
        : [];

      // โควตาที่นั่งในรอบปัจจุบัน
      const isQuotaRound = currentOpenRound?.roundType === "QUOTA";
      const targetSeats = isQuotaRound
        ? p.quotaSeats
        : p.regularSeats + p.rolloverSeats;

      const applicantCount = currentRoundApps.length;
      const remainingSeats = Math.max(0, targetSeats - applicantCount);

      return {
        id: p.id,
        code: p.code,
        level: p.level,
        name: p.name,
        isOpen: p.isOpen,
        quotaSeats: p.quotaSeats,
        regularSeats: p.regularSeats,
        rolloverSeats: p.rolloverSeats,
        totalRegularSeats: p.regularSeats + p.rolloverSeats, // ยอดรับรอบปกติหลังทบยอดโควตา
        currentRoundApplicants: applicantCount,
        currentRoundRemainingSeats: remainingSeats,
        currentRoundTargetSeats: targetSeats,
        totalApplicantsAllRounds: validApplications.length,
        academicYear: p.academicYear.year,
      };
    });

    return NextResponse.json({
      success: true,
      academicYear: activeYear?.year ?? null,
      academicYearId: yearId,
      currentRound: currentOpenRound
        ? {
            id: currentOpenRound.id,
            name: currentOpenRound.name,
            roundType: currentOpenRound.roundType,
            endAt: currentOpenRound.endAt.toISOString(),
          }
        : null,
      totalPrograms: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/programs Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขาวิชา" },
      { status: 500 }
    );
  }
}
