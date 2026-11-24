import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "ปวช.";
    const roundType = (searchParams.get("roundType") || "QUOTA").toUpperCase();
    const programCode = searchParams.get("programCode");

    const activeYear =
      (await prisma.academicYear.findFirst({
        where: { isActive: true },
      })) || (await prisma.academicYear.findFirst({ orderBy: { year: "desc" } }));

    if (!activeYear) {
      return NextResponse.json({ success: true, amount: 0, note: "", items: [] });
    }

    // กรณีรอบปกติและระบุรหัสสาขา: ดึงรายการแยกรายสาขาพร้อมยอดรวม
    if (roundType === "REGULAR" && programCode) {
      const regularItems = await prisma.initialExpenseItem.findMany({
        where: {
          academicYearId: activeYear.id,
          roundType: "REGULAR",
          level,
          programCode,
          isActive: true,
        },
        orderBy: { sortOrder: "asc" },
      });

      if (regularItems.length > 0) {
        const total = regularItems.reduce((sum, it) => sum + it.amount, 0);
        return NextResponse.json({
          success: true,
          year: activeYear.year,
          roundType: "REGULAR",
          level,
          programCode,
          amount: total,
          note: `รวม ${regularItems.length} รายการ (รอบปกติ)`,
          items: regularItems.map((it) => ({
            id: it.id,
            itemName: it.itemName,
            amount: it.amount,
            note: it.note,
          })),
        });
      }
    }

    // ค่าเริ่มต้น / รอบโควตาพิเศษ: ดึงยอดรวมตามระดับชั้น
    const item = await prisma.initialExpenseItem.findFirst({
      where: {
        academicYearId: activeYear.id,
        roundType: "QUOTA",
        level,
        programCode: null,
        isActive: true,
      },
    });

    const defaultAmount = level === "ปวช." ? 0 : 3500;
    const amount = item ? item.amount : defaultAmount;
    const note =
      item?.note ||
      (level === "ปวช."
        ? "เรียนฟรี 15 ปีตามนโยบายรัฐบาล (ค่าเล่าเรียน 0 บาท)"
        : "กู้ยืม กยศ. ได้เต็มจำนวน");

    return NextResponse.json({
      success: true,
      year: activeYear.year,
      roundType: "QUOTA",
      level,
      amount,
      note,
      items: [],
    });
  } catch (error) {
    console.error("Error in GET /api/expenses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "FAILED_TO_FETCH_EXPENSES",
        message: "ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้",
      },
      { status: 500 }
    );
  }
}
