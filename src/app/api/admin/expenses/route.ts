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
        programs: [],
        regularItems: [],
        expenses: {
          pvc: 0,
          pvs: 0,
          pvsDual: 0,
          pvcNote: "",
          pvsNote: "",
          pvsDualNote: "",
        },
      });
    }

    const [allYears, programs, items] = await Promise.all([
      prisma.academicYear.findMany({ orderBy: { year: "desc" } }),
      prisma.programQuota.findMany({
        where: { academicYearId: year.id },
        orderBy: [{ level: "asc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          level: true,
          name: true,
          isOpen: true,
        },
      }),
      prisma.initialExpenseItem.findMany({
        where: { academicYearId: year.id },
        orderBy: [{ level: "asc" }, { programCode: "asc" }, { sortOrder: "asc" }],
      }),
    ]);

    // 1. รอบโควตาพิเศษ (ยอดรวมรายระดับชั้น)
    const quotaItems = items.filter(
      (i) => i.roundType === "QUOTA" && !i.programCode
    );
    const pvcItem = quotaItems.find((i) => i.level === "ปวช.");
    const pvsItem = quotaItems.find((i) => i.level === "ปวส.");
    const pvsDualItem = quotaItems.find((i) => i.level === "ปวส.ทวิภาคี");

    // 2. รอบปกติ (แยกรายสาขาและรายการ)
    const regularItems = items.filter((i) => i.roundType === "REGULAR");

    return NextResponse.json({
      success: true,
      currentYear: year,
      allYears,
      programs,
      regularItems,
      expenses: {
        pvc: pvcItem ? pvcItem.amount : 0,
        pvs: pvsItem ? pvsItem.amount : 0,
        pvsDual: pvsDualItem ? pvsDualItem.amount : 0,
        pvcNote: pvcItem?.note || "เรียนฟรี 15 ปีตามนโยบายรัฐบาล",
        pvsNote: pvsItem?.note || "กู้ยืม กยศ. ได้เต็มจำนวน",
        pvsDualNote:
          pvsDualItem?.note || "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/expenses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "SERVER_ERROR",
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่าย",
      },
      { status: 500 }
    );
  }
}

interface IncomingLineItem {
  itemName: string;
  amount: number;
  note?: string;
}

// POST: Save either QUOTA lump-sum OR REGULAR itemized per-program expenses
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
    const mode = body.mode === "REGULAR" ? "REGULAR" : "QUOTA";
    const { academicYearId } = body;

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "กรุณาระบุปีการศึกษา" },
        { status: 400 }
      );
    }

    if (mode === "REGULAR") {
      const { level, programCode, items, applyToAllInLevel } = body as {
        level?: string;
        programCode?: string;
        items?: IncomingLineItem[];
        applyToAllInLevel?: boolean;
      };

      if (!level || (!programCode && !applyToAllInLevel)) {
        return NextResponse.json(
          {
            success: false,
            error: "VALIDATION_ERROR",
            message: "กรุณาระบุระดับชั้นและสาขาวิชา",
          },
          { status: 400 }
        );
      }

      const sanitizedItems = (Array.isArray(items) ? items : [])
        .map((it) => ({
          itemName: String(it.itemName || "").trim(),
          amount: Math.max(0, Number(it.amount) || 0),
          note: it.note ? String(it.note).trim() : null,
        }))
        .filter((it) => it.itemName.length > 0);

      let targetPrograms: Array<{ code: string; level: string }> = [];

      if (applyToAllInLevel) {
        const allProgs = await prisma.programQuota.findMany({
          where: { academicYearId },
          select: { code: true, level: true },
        });
        targetPrograms = allProgs.filter((p) =>
          level === "ปวส." ? p.level.includes("ปวส") : p.level === level
        );
      } else if (programCode) {
        targetPrograms = [{ code: String(programCode), level: String(level) }];
      }

      await prisma.$transaction(async (tx) => {
        for (const tp of targetPrograms) {
          await tx.initialExpenseItem.deleteMany({
            where: {
              academicYearId,
              roundType: "REGULAR",
              level: tp.level,
              programCode: tp.code,
            },
          });

          if (sanitizedItems.length > 0) {
            await tx.initialExpenseItem.createMany({
              data: sanitizedItems.map((it, idx) => ({
                academicYearId,
                roundType: "REGULAR",
                level: tp.level,
                programCode: tp.code,
                itemName: it.itemName,
                amount: it.amount,
                note: it.note,
                sortOrder: idx + 1,
                isActive: true,
              })),
            });
          }
        }
      });

      const totalAmount = sanitizedItems.reduce((sum, it) => sum + it.amount, 0);

      return NextResponse.json({
        success: true,
        totalAmount,
        itemCount: sanitizedItems.length,
        affectedPrograms: targetPrograms.length,
        message: applyToAllInLevel
          ? `คัดลอกและบันทึกรายการค่าใช้จ่ายรอบปกติครบทั้ง ${targetPrograms.length} สาขาเรียบร้อยแล้ว`
          : `บันทึกรายการค่าใช้จ่ายรอบปกติ (${sanitizedItems.length} รายการ รวม ${totalAmount.toLocaleString("th-TH")} บาท) เรียบร้อยแล้ว`,
      });
    }

    // Default: QUOTA mode (lump-sum total per education level)
    const { pvc, pvs, pvsDual, pvcNote, pvsNote, pvsDualNote } = body;

    const levelsConfig = [
      {
        level: "ปวช.",
        amount: Math.max(0, Number(pvc) || 0),
        note: pvcNote ? String(pvcNote).trim() : "เรียนฟรี 15 ปีตามนโยบายรัฐบาล",
      },
      {
        level: "ปวส.",
        amount: Math.max(0, Number(pvs) || 0),
        note: pvsNote ? String(pvsNote).trim() : "กู้ยืม กยศ. ได้เต็มจำนวน",
      },
      {
        level: "ปวส.ทวิภาคี",
        amount: Math.max(0, Number(pvsDual) || 0),
        note: pvsDualNote
          ? String(pvsDualNote).trim()
          : "ฝึกงานสถานประกอบการ มีเบี้ยเลี้ยงและรายได้",
      },
    ];

    for (const cfg of levelsConfig) {
      const existing = await prisma.initialExpenseItem.findFirst({
        where: {
          academicYearId,
          roundType: "QUOTA",
          level: cfg.level,
          programCode: null,
        },
      });

      if (existing) {
        await prisma.initialExpenseItem.update({
          where: { id: existing.id },
          data: {
            itemName: "ค่าใช้จ่ายแรกเข้า (รอบโควตาพิเศษ)",
            amount: cfg.amount,
            note: cfg.note,
            isActive: true,
          },
        });
      } else {
        await prisma.initialExpenseItem.create({
          data: {
            academicYearId,
            roundType: "QUOTA",
            level: cfg.level,
            programCode: null,
            itemName: "ค่าใช้จ่ายแรกเข้า (รอบโควตาพิเศษ)",
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
      message: "บันทึกค่าใช้จ่ายแรกเข้า (รอบโควตาพิเศษ) สำเร็จเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/expenses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "SERVER_ERROR",
        message: "ไม่สามารถบันทึกค่าใช้จ่ายได้",
      },
      { status: 500 }
    );
  }
}
