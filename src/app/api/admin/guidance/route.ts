import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const totalAssessments = await prisma.guidanceAssessmentLog.count();
    const clickedApplyCount = await prisma.guidanceAssessmentLog.count({
      where: { clickedApply: true },
    });

    const conversionRate =
      totalAssessments > 0
        ? Math.round((clickedApplyCount / totalAssessments) * 1000) / 10
        : 0;

    // Track Result Counts
    const trackCounts = {
      VOCATIONAL: await prisma.guidanceAssessmentLog.count({
        where: { trackResult: "VOCATIONAL" },
      }),
      HYBRID: await prisma.guidanceAssessmentLog.count({
        where: { trackResult: "HYBRID" },
      }),
      ACADEMIC: await prisma.guidanceAssessmentLog.count({
        where: { trackResult: "ACADEMIC" },
      }),
    };

    // Education Level Counts
    const eduCounts = {
      M3: await prisma.guidanceAssessmentLog.count({
        where: { currentEducation: "ม.3" },
      }),
      M6_PVS: await prisma.guidanceAssessmentLog.count({
        where: { currentEducation: "ม.6_ปวช.3" },
      }),
    };

    // Department Recommendations
    const deptKeys = ["AUTO", "ELEC", "TRON", "IT", "ACC", "MKT"];
    const topDeptCounts: Record<string, number> = {};
    for (const d of deptKeys) {
      topDeptCounts[d] = await prisma.guidanceAssessmentLog.count({
        where: { recommendedDept1: d },
      });
    }

    // Study Mode Preferences
    const studyModeCounts = {
      NORMAL: await prisma.guidanceAssessmentLog.count({
        where: { studyModePref: "NORMAL" },
      }),
      DUAL: await prisma.guidanceAssessmentLog.count({
        where: { studyModePref: "DUAL" },
      }),
      FLEX: await prisma.guidanceAssessmentLog.count({
        where: { studyModePref: "FLEX" },
      }),
    };

    // Special Interests
    const interestKeys = ["CAFE", "CRAFT", "MEDIA", "FIXIT", "NONE"];
    const specialInterestCounts: Record<string, number> = {};
    for (const key of interestKeys) {
      specialInterestCounts[key] = await prisma.guidanceAssessmentLog.count({
        where: { specialInterest: key },
      });
    }

    // Recent 20 Assessment Logs (PDPA compliant, no PII)
    const recentLogs = await prisma.guidanceAssessmentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        currentEducation: true,
        schoolName: true,
        vocScore: true,
        genScore: true,
        trackResult: true,
        recommendedDept1: true,
        recommendedCode1: true,
        recommendedDept2: true,
        studyModePref: true,
        specialInterest: true,
        clickedApply: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalAssessments,
        clickedApplyCount,
        conversionRate,
        trackCounts,
        eduCounts,
        topDeptCounts,
        studyModeCounts,
        specialInterestCounts,
      },
      recentLogs,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/guidance:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติแนะแนว" },
      { status: 500 }
    );
  }
}
