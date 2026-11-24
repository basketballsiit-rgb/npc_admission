import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      currentEducation,
      schoolName,
      vocScore,
      genScore,
      trackResult,
      scores,
      recommendedDept1,
      recommendedCode1,
      recommendedDept2,
      studyModePref,
      specialInterest,
    } = body;

    if (!currentEducation || !trackResult || !recommendedDept1) {
      return NextResponse.json(
        { error: "ข้อมูลแบบประเมินไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const activeYear =
      (await prisma.academicYear.findFirst({ where: { isActive: true } })) ||
      (await prisma.academicYear.findFirst({ orderBy: { year: "desc" } }));

    const log = await prisma.guidanceAssessmentLog.create({
      data: {
        academicYearId: activeYear?.id ?? null,
        currentEducation: String(currentEducation),
        schoolName: schoolName ? String(schoolName).trim().slice(0, 150) : null,
        vocScore: Number(vocScore) || 0,
        genScore: Number(genScore) || 0,
        trackResult: String(trackResult),
        scoresJson: JSON.stringify(scores || {}),
        recommendedDept1: String(recommendedDept1),
        recommendedCode1: String(recommendedCode1 || ""),
        recommendedDept2: String(recommendedDept2 || ""),
        studyModePref: String(studyModePref || "NORMAL"),
        specialInterest: String(specialInterest || "NONE"),
        clickedApply: false,
      },
    });

    return NextResponse.json({
      success: true,
      logId: log.id,
    });
  } catch (error) {
    console.error("Error creating guidance assessment log:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกผลการประเมิน" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { logId, clickedApply } = body;

    if (!logId) {
      return NextResponse.json(
        { error: "กรุณาระบุ logId" },
        { status: 400 }
      );
    }

    await prisma.guidanceAssessmentLog.update({
      where: { id: logId },
      data: {
        clickedApply: Boolean(clickedApply),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating guidance assessment log:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตสถานะได้" },
      { status: 500 }
    );
  }
}
