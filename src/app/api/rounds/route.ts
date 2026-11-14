import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/rounds
 * ดึงรายการรอบการรับสมัคร พร้อมตรวจสอบสถานะเวลา Server จริง (ระดับนาที)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    let yearId: string | null = academicYearId;
    if (!yearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      });
      yearId = activeYear?.id ?? null;
    }

    if (!yearId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบปีการศึกษาที่เปิดใช้งานอยู่ในขณะนี้" },
        { status: 404 }
      );
    }

    const rounds = await prisma.admissionRound.findMany({
      where: {
        academicYearId: yearId,
        isActive: true,
      },
      orderBy: { startAt: "asc" },
      include: {
        academicYear: {
          select: { year: true },
        },
      },
    });

    // เวลา Server ปัจจุบันที่แน่นอน
    const now = new Date();

    const formattedRounds = rounds.map((r) => {
      const isUpcoming = now < r.startAt;
      const isClosed = now > r.endAt;
      const isWithinPeriod = now >= r.startAt && now <= r.endAt;
      const canApply = r.isActive && isWithinPeriod;

      return {
        id: r.id,
        name: r.name,
        roundType: r.roundType,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
        announceAt: r.announceAt.toISOString(),
        isActive: r.isActive,
        academicYear: r.academicYear.year,
        // สถานะเวลาจริงจาก Server
        status: isUpcoming ? "UPCOMING" : isClosed ? "CLOSED" : "OPEN",
        canApply,
      };
    });

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      academicYearId: yearId,
      rounds: formattedRounds,
      data: formattedRounds,
    });
  } catch (error) {
    console.error("GET /api/rounds Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลรอบการรับสมัคร" },
      { status: 500 }
    );
  }
}
