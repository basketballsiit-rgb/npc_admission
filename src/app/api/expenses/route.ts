import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "ปวช.";
    const code = searchParams.get("code") || "";

    const activeYear =
      (await prisma.academicYear.findFirst({
        where: { isActive: true },
      })) || (await prisma.academicYear.findFirst({ orderBy: { year: "desc" } }));

    if (!activeYear) {
      return NextResponse.json({ success: true, items: [], totalAmount: 0 });
    }

    // ดึงรายการค่าใช้จ่ายที่ตรงกับระดับชั้น และ (เป็นรายการทั่วไป programCode IS NULL หรือ ตรงกับรหัสสาขา)
    const items = await prisma.initialExpenseItem.findMany({
      where: {
        academicYearId: activeYear.id,
        level: level,
        isActive: true,
        OR: [{ programCode: null }, { programCode: "" }, ...(code ? [{ programCode: code }] : [])],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({
      success: true,
      year: activeYear.year,
      level,
      code,
      items,
      totalAmount,
      noteScholarship:
        level === "ปวช."
          ? "วิทยาลัยสารพัดช่างน่าน สนับสนุนนโยบายเรียนฟรี 15 ปีอย่างมีคุณภาพ ค่าเล่าเรียนฟรีตลอดหลักสูตร มีเฉพาะค่าอุปกรณ์และประกันอุบัติเหตุแรกเข้า"
          : "ระดับ ปวส. สามารถยื่นกู้ยืมกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ได้เต็มจำนวน และระบบทวิภาคีมีเบี้ยเลี้ยงรายได้ระหว่างเรียน",
    });
  } catch (error) {
    console.error("Error in GET /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "FAILED_TO_FETCH_EXPENSES", message: "ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้" },
      { status: 500 }
    );
  }
}
