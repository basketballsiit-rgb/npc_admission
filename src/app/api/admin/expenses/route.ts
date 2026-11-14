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
      return NextResponse.json({ success: true, items: [], years: [] });
    }

    const allYears = await prisma.academicYear.findMany({ orderBy: { year: "desc" } });

    const items = await prisma.initialExpenseItem.findMany({
      where: { academicYearId: year.id },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const programs = await prisma.programQuota.findMany({
      where: { academicYearId: year.id },
      orderBy: [{ level: "asc" }, { code: "asc" }],
      select: { code: true, name: true, level: true },
    });

    return NextResponse.json({
      success: true,
      currentYear: year,
      allYears,
      items,
      programs,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่าย" },
      { status: 500 }
    );
  }
}

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
    const { academicYearId, level, programCode, itemName, amount, note, sortOrder, isActive } = body;

    if (!academicYearId || !level || !itemName) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const item = await prisma.initialExpenseItem.create({
      data: {
        academicYearId,
        level,
        programCode: programCode ? String(programCode).trim() : null,
        itemName: String(itemName).trim(),
        amount: Number(amount) || 0,
        note: note ? String(note).trim() : null,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error in POST /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "ไม่สามารถสร้างรายการค่าใช้จ่ายได้" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, level, programCode, itemName, amount, note, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "กรุณาระบุ ID ของรายการ" },
        { status: 400 }
      );
    }

    const updated = await prisma.initialExpenseItem.update({
      where: { id },
      data: {
        ...(level && { level }),
        programCode: programCode !== undefined ? (programCode ? String(programCode).trim() : null) : undefined,
        ...(itemName && { itemName: String(itemName).trim() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(note !== undefined && { note: note ? String(note).trim() : null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error in PUT /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "ไม่สามารถแก้ไขรายการค่าใช้จ่ายได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "กรุณาระบุ ID ที่ต้องการลบ" },
        { status: 400 }
      );
    }

    await prisma.initialExpenseItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/expenses:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "ไม่สามารถลบรายการได้" },
      { status: 500 }
    );
  }
}
