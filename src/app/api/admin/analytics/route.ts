import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";

export interface YearlyProgramStats {
  targetSeats: number;
  quotaSeats: number;
  regularSeats: number;
  totalApplicants: number;
  quotaApplicants: number;
  regularApplicants: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  fillRatePct: number;
  avgGpax: number;
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
        },
        { status: 401 }
      );
    }

    const years = await prisma.academicYear.findMany({
      orderBy: { year: "asc" },
      include: {
        rounds: {
          select: { id: true, name: true, roundType: true },
        },
        programs: {
          orderBy: [{ level: "asc" }, { code: "asc" }],
          select: {
            id: true,
            code: true,
            level: true,
            name: true,
            quotaSeats: true,
            regularSeats: true,
            rolloverSeats: true,
            isOpen: true,
          },
        },
      },
    });

    // Fetch all non-cancelled applications with round & program info
    const allApplications = await prisma.application.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        id: true,
        status: true,
        gpax: true,
        programId: true,
        round: {
          select: {
            academicYearId: true,
            roundType: true,
          },
        },
        program: {
          select: {
            code: true,
            level: true,
            name: true,
          },
        },
      },
    });

    // Guidance logs grouped by academicYearId
    const guidanceGroups = await prisma.guidanceAssessmentLog.groupBy({
      by: ["academicYearId"],
      _count: { id: true },
    });
    const guidanceCountByYearId = new Map<string, number>();
    for (const g of guidanceGroups) {
      if (g.academicYearId) {
        guidanceCountByYearId.set(g.academicYearId, g._count.id);
      }
    }

    // Build yearly summary & unified program matrix
    const programMetaMap = new Map<
      string,
      {
        key: string;
        code: string;
        level: string;
        name: string;
        byYear: Record<string, YearlyProgramStats>;
        allYearsTotalTarget: number;
        allYearsTotalApplicants: number;
        allYearsTotalApproved: number;
      }
    >();

    const yearlySummary = years.map((yr) => {
      const yrApps = allApplications.filter(
        (a) => a.round.academicYearId === yr.id
      );

      const totalTargetSeats = yr.programs.reduce(
        (sum, p) => sum + Math.max(p.quotaSeats, p.regularSeats + p.rolloverSeats),
        0
      );
      const totalQuotaSeats = yr.programs.reduce((sum, p) => sum + p.quotaSeats, 0);
      const totalRegularSeats = yr.programs.reduce(
        (sum, p) => sum + p.regularSeats,
        0
      );

      const totalApplications = yrApps.length;
      const quotaApplications = yrApps.filter(
        (a) => a.round.roundType === "QUOTA"
      ).length;
      const regularApplications = yrApps.filter(
        (a) => a.round.roundType !== "QUOTA"
      ).length;
      const pvocApplications = yrApps.filter(
        (a) => a.program.level === "ปวช."
      ).length;
      const pvsApplications = yrApps.filter((a) =>
        a.program.level.includes("ปวส")
      ).length;
      const approvedCount = yrApps.filter((a) => a.status === "APPROVED").length;
      const pendingCount = yrApps.filter((a) => a.status === "PENDING").length;
      const rejectedCount = yrApps.filter((a) => a.status === "REJECTED").length;

      const fillRatePct =
        totalTargetSeats > 0
          ? Math.round((totalApplications / totalTargetSeats) * 100)
          : 0;
      const approvalRatePct =
        totalApplications > 0
          ? Math.round((approvedCount / totalApplications) * 100)
          : 0;

      // Populate per-program breakdown for this year
      for (const prog of yr.programs) {
        const key = `${prog.level}::${prog.code}`;
        if (!programMetaMap.has(key)) {
          programMetaMap.set(key, {
            key,
            code: prog.code,
            level: prog.level,
            name: prog.name,
            byYear: {},
            allYearsTotalTarget: 0,
            allYearsTotalApplicants: 0,
            allYearsTotalApproved: 0,
          });
        }
        const entry = programMetaMap.get(key)!;
        // Keep latest program name
        entry.name = prog.name;

        const progApps = yrApps.filter((a) => a.programId === prog.id);
        const pTarget = Math.max(
          prog.quotaSeats,
          prog.regularSeats + prog.rolloverSeats
        );
        const pTotal = progApps.length;
        const pQuota = progApps.filter(
          (a) => a.round.roundType === "QUOTA"
        ).length;
        const pRegular = progApps.filter(
          (a) => a.round.roundType !== "QUOTA"
        ).length;
        const pApproved = progApps.filter((a) => a.status === "APPROVED").length;
        const pPending = progApps.filter((a) => a.status === "PENDING").length;
        const pRejected = progApps.filter((a) => a.status === "REJECTED").length;
        const avgGpax =
          pTotal > 0
            ? Math.round(
                (progApps.reduce((s, a) => s + (a.gpax || 0), 0) / pTotal) * 100
              ) / 100
            : 0;
        const pFill = pTarget > 0 ? Math.round((pTotal / pTarget) * 100) : 0;

        entry.byYear[yr.year] = {
          targetSeats: pTarget,
          quotaSeats: prog.quotaSeats,
          regularSeats: prog.regularSeats,
          totalApplicants: pTotal,
          quotaApplicants: pQuota,
          regularApplicants: pRegular,
          approvedCount: pApproved,
          pendingCount: pPending,
          rejectedCount: pRejected,
          fillRatePct: pFill,
          avgGpax,
        };

        entry.allYearsTotalTarget += pTarget;
        entry.allYearsTotalApplicants += pTotal;
        entry.allYearsTotalApproved += pApproved;
      }

      return {
        academicYearId: yr.id,
        year: yr.year,
        isActive: yr.isActive,
        programCount: yr.programs.length,
        totalTargetSeats,
        totalQuotaSeats,
        totalRegularSeats,
        totalApplications,
        quotaApplications,
        regularApplications,
        pvocApplications,
        pvsApplications,
        approvedCount,
        pendingCount,
        rejectedCount,
        fillRatePct,
        approvalRatePct,
        guidanceAssessmentsCount: guidanceCountByYearId.get(yr.id) || 0,
      };
    });

    const programMatrix = Array.from(programMetaMap.values()).sort((a, b) => {
      if (a.level !== b.level) return a.level.localeCompare(b.level);
      return a.code.localeCompare(b.code);
    });

    return NextResponse.json({
      success: true,
      data: {
        years: years.map((y) => ({
          id: y.id,
          year: y.year,
          isActive: y.isActive,
        })),
        yearlySummary,
        programMatrix,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "SERVER_ERROR",
        message: "ไม่สามารถโหลดข้อมูลสถิติรายปีได้",
      },
      { status: 500 }
    );
  }
}
