import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "ปวช.";

    const activeYear =
      (await prisma.academicYear.findFirst({
        where: { isActive: true },
      })) || (await prisma.academicYear.findFirst({ orderBy: { year: "desc" } }));

    if (!activeYear) {
      return NextResponse.json({ success: true, amount: 0, note: "" });
    }

    // ดึงค่าใช้จ่ายแรกเข้าของระดับชั้นที่เลือก
    const item = await prisma.initialExpenseItem.findFirst({
      where: {
        academicYearId: activeYear.id,
        level: level,
        isActive: true,
      },
    });

    const defaultAmount = level === "ปวช." ? 0 : 3500;
    const amount = item ? item.amount : defaultAmount;
    const note = item?.note || (level === "ปวช." ? "เรียนฟรี 15 ปีตามนโยบายรัฐบาล (ค่าเล่าเรียน 0 บาท)" : "กู้ยืม กยศ. ได้เต็มจำนวน");

    return NextResponse.json({
      success: true,
      year: activeYear.year,
      level,
      amount,
      note,
    });
  } catch (error) {
    console.error("Error in GET /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "FAILED_TO_FETCH_EXPENSES", message: "ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้" },
      { status: 500 }
    );
  }
}
