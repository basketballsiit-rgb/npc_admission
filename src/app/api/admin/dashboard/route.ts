import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";


/**
 * GET /api/admin/dashboard
 * ดึงข้อมูลสรุปภาพรวมสำหรับแอดมินและงานทะเบียน
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
    const academicYearId = searchParams.get("academicYearId");

    // ดึงปีการศึกษาที่เปิดใช้งาน
    let year = null;
    if (academicYearId) {
      year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    } else {
      year = await prisma.academicYear.findFirst({ where: { isActive: true } });
    }

    if (!year) {
      return NextResponse.json(
        { success: false, error: "ไม่พบปีการศึกษาในระบบ" },
        { status: 404 }
      );
    }

    // 1. ดึงรอบรับสมัครทั้งหมดของปีนี้
    const rounds = await prisma.admissionRound.findMany({
      where: { academicYearId: year.id },
      orderBy: { startAt: "asc" },
    });

    const now = new Date();

    // 2. ดึงสาขาวิชาทั้งหมด
    const programs = await prisma.programQuota.findMany({
      where: { academicYearId: year.id },
      orderBy: [{ level: "asc" }, { code: "asc" }],
      include: {
        applications: {
          select: {
            id: true,
            roundId: true,
            status: true,
            gpax: true,
          },
        },
      },
    });

    // 3. ดึงใบสมัครทั้งหมดของปีนี้
    const allApplications = await prisma.application.findMany({
      where: {
        round: { academicYearId: year.id },
      },
      include: {
        round: { select: { roundType: true, name: true } },
        program: { select: { level: true, name: true, code: true } },
      },
    });

    const validApps = allApplications.filter((a) => a.status !== "CANCELLED");

    // คำนวณสถิติภาพรวม
    const totalApplications = validApps.length;
    const quotaApplications = validApps.filter((a) => a.round.roundType === "QUOTA").length;
    const regularApplications = validApps.filter((a) => a.round.roundType === "REGULAR").length;
    const pvocApplications = validApps.filter((a) => a.program.level === "ปวช.").length;
    const pvsApplications = validApps.filter((a) => a.program.level === "ปวส." || a.program.level === "ปวส.ทวิภาคี").length;

    const approvedCount = validApps.filter((a) => a.status === "APPROVED").length;
    const pendingCount = validApps.filter((a) => a.status === "PENDING").length;
    const rejectedCount = validApps.filter((a) => a.status === "REJECTED").length;

    // คำนวณตารางเปรียบเทียบยอดผู้สมัครเทียบจำนวนรับรายสาขา
    const currentOpenRound = rounds.find((r) => r.isActive && now >= r.startAt && now <= r.endAt);
    const isQuotaRound = currentOpenRound?.roundType === "QUOTA";

    const programComparison = programs.map((p) => {
      const pApps = p.applications.filter((a) => a.status !== "CANCELLED");
      const pApproved = pApps.filter((a) => a.status === "APPROVED").length;
      const pPending = pApps.filter((a) => a.status === "PENDING").length;

      const targetSeats = isQuotaRound
        ? p.quotaSeats
        : p.regularSeats + p.rolloverSeats;

      const remainingSeats = Math.max(0, targetSeats - pApproved);
      const percentFilled = Math.min(100, Math.round((pApps.length / (targetSeats || 1)) * 100));

      return {
        id: p.id,
        code: p.code,
        level: p.level,
        name: p.name,
        isOpen: p.isOpen,
        quotaSeats: p.quotaSeats,
        regularSeats: p.regularSeats,
        rolloverSeats: p.rolloverSeats,
        totalSeats: p.regularSeats + p.rolloverSeats,
        targetSeats,
        totalApplicants: pApps.length,
        approvedCount: pApproved,
        pendingCount: pPending,
        remainingSeats,
        percentFilled,
      };
    });

    // 5 ใบสมัครล่าสุด
    const recentApplications = allApplications.slice(0, 5).map((a) => ({
      id: a.id,
      applicationNo: a.applicationNo,
      applicantName: `${a.prefix} ${a.firstName} ${a.lastName}`,
      cidMasked: a.cidMasked,
      program: `${a.program.level} ${a.program.name}`,
      roundName: a.round.name,
      gpax: a.gpax,
      status: a.status,
      appliedAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        academicYear: year.year,
        academicYearId: year.id,
        summary: {
          totalApplications,
          quotaApplications,
          regularApplications,
          pvocApplications,
          pvsApplications,
          approvedCount,
          pendingCount,
          rejectedCount,
        },
        rounds: rounds.map((r) => ({
          id: r.id,
          name: r.name,
          roundType: r.roundType,
          startAt: r.startAt,
          endAt: r.endAt,
          announceAt: r.announceAt,
          isActive: r.isActive,
          status: now < r.startAt ? "UPCOMING" : now > r.endAt ? "CLOSED" : "OPEN",
        })),
        programsComparison: programComparison,
        recentApplications,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" },
      { status: 500 }
    );
  }
}
