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

    const { searchParams } = new URL(request.url);
    const yearIdParam = searchParams.get("academicYearId");

    let year = null;
    if (yearIdParam) {
      year = await prisma.academicYear.findUnique({ where: { id: yearIdParam } });
    }
    if (!year) {
      year =
        (await prisma.academicYear.findFirst({ where: { isActive: true } })) ||
        (await prisma.academicYear.findFirst({ orderBy: { year: "desc" } }));
    }

    if (!year) {
      return NextResponse.json({
        success: true,
        currentYear: null,
        allYears: [],
        expenses: {
          pvc: 0,
          pvs: 0,
          pvsDual: 0,
        },
      });
    }

    const allYears = await prisma.academicYear.findMany({ orderBy: { year: "desc" } });

    // Fetch expense items for the year
    const items = await prisma.initialExpenseItem.findMany({
      where: { academicYearId: year.id },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    // Extract single simple initial expense numbers per level
    const pvcItem = items.find((i) => i.level === "ปวช.");
    const pvsItem = items.find((i) => i.level === "ปวส.");
    const pvsDualItem = items.find((i) => i.level === "ปวส.ทวิภาคี");

    return NextResponse.json({
      success: true,
      currentYear: year,
      allYears,
      items,
      expenses: {
        pvc: pvcItem ? pvcItem.amount : 0,
        pvs: pvsItem ? pvsItem.amount : 0,
        pvsDual: pvsDualItem ? pvsDualItem.amount : 0,
        pvcNote: pvcItem?.note || "เรียนฟรี 15 ปีตามนโยบายรัฐบาล",
        pvsNote: pvsItem?.note || "กู้ยืม กยศ. ได้เต็มจำนวน",
        pvsDualNote: pvsDualItem?.note || "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่าย" },
      { status: 500 }
    );
  }
}

// POST: Save/Update simple initial expense amounts per level
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
    const { academicYearId, pvc, pvs, pvsDual, pvcNote, pvsNote, pvsDualNote } = body;

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "กรุณาระบุปีการศึกษา" },
        { status: 400 }
      );
    }

    const levelsConfig = [
      {
        level: "ปวช.",
        amount: Number(pvc) || 0,
        note: pvcNote ? String(pvcNote).trim() : "เรียนฟรี 15 ปีตามนโยบายรัฐบาล",
      },
      {
        level: "ปวส.",
        amount: Number(pvs) || 0,
        note: pvsNote ? String(pvsNote).trim() : "กู้ยืม กยศ. ได้เต็มจำนวน",
      },
      {
        level: "ปวส.ทวิภาคี",
        amount: Number(pvsDual) || 0,
        note: pvsDualNote ? String(pvsDualNote).trim() : "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้",
      },
    ];

    for (const cfg of levelsConfig) {
      const existing = await prisma.initialExpenseItem.findFirst({
        where: {
          academicYearId,
          level: cfg.level,
        },
      });

      if (existing) {
        await prisma.initialExpenseItem.update({
          where: { id: existing.id },
          data: {
            itemName: "ค่าใช้จ่ายแรกเข้า",
            amount: cfg.amount,
            note: cfg.note,
            isActive: true,
          },
        });
      } else {
        await prisma.initialExpenseItem.create({
          data: {
            academicYearId,
            level: cfg.level,
            itemName: "ค่าใช้จ่ายแรกเข้า",
            amount: cfg.amount,
            note: cfg.note,
            sortOrder: 1,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกค่าใช้จ่ายแรกเข้าสำเร็จเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "ไม่สามารถบันทึกค่าใช้จ่ายได้" },
      { status: 500 }
    );
  }
}
