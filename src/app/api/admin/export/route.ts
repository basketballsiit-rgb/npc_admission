import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { decryptCID } from "@/lib/security";
import * as XLSX from "xlsx";


/**
 * GET /api/admin/export
 * ศูนย์ส่งออกข้อมูลผู้ผ่านการคัดเลือก (APPROVED) เข้าสู่ระบบ ศธ.02 ออนไลน์ และ RMS
 * ถอดรหัส cidEncrypted เป็นเลข 13 หลักเต็มเฉพาะจังหวะที่แอดมินสั่งส่งออก
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
    const roundId = searchParams.get("roundId");
    const programId = searchParams.get("programId");
    const format = searchParams.get("format") || "xlsx"; // xlsx | csv
    const status = searchParams.get("status") || "APPROVED"; // ตามโจทย์ส่งออกเฉพาะผู้ที่ผ่านการคัดเลือก

    const where: Record<string, any> = {
      status,
    };

    if (roundId) where.roundId = roundId;
    if (programId) where.programId = programId;

    const applications = await prisma.application.findMany({
      where,
      orderBy: [
        { program: { level: "asc" } },
        { program: { code: "asc" } },
        { gpax: "desc" },
      ],
      include: {
        program: true,
        round: {
          include: { academicYear: true },
        },
      },
    });

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "ไม่พบข้อมูลผู้ผ่านการคัดเลือกตามเงื่อนไขที่ระบุ" },
        { status: 404 }
      );
    }

    // จัดเรียงแถวข้อมูลมาตรฐานสำหรับระบบ ศธ.02 และ RMS
    const rows = applications.map((app, index) => {
      // ถอดรหัสเลข 13 หลักกลับมาเป็น Plaintext เฉพาะจังหวะส่งออกไฟล์นี้เท่านั้น
      let fullCID = "";
      try {
        fullCID = decryptCID(app.cidEncrypted);
      } catch (err) {
        console.error(`Error decrypting CID for application ${app.applicationNo}:`, err);
        fullCID = "DECRYPTION_ERROR";
      }

      let addressData: Record<string, any> = {};
      try {
        if (app.addressInfo) addressData = JSON.parse(app.addressInfo);
      } catch {
        addressData = { raw: app.addressInfo };
      }

      const birthDateStr = new Date(app.birthDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      return {
        "ลำดับ": index + 1,
        "เลขที่ใบสมัคร": app.applicationNo,
        "เลขประจำตัวประชาชน (13 หลัก)": fullCID,
        "คำนำหน้า": app.prefix,
        "ชื่อ": app.firstName,
        "นามสกุล": app.lastName,
        "วันเดือนปีเกิด": birthDateStr,
        "ระดับชั้น": app.program.level,
        "รหัสสาขาวิชา (ศธ.02)": app.program.code,
        "ชื่อสาขาวิชา": app.program.name,
        "เกรดเฉลี่ยสะสม (GPAX)": app.gpax.toFixed(2),
        "สถานศึกษาเดิม": app.previousSchool,
        "จังหวัดสถานศึกษาเดิม": app.schoolProvince,
        "วุฒิเดิมที่จบ": app.previousEducation,
        "เบอร์โทรศัพท์ผู้สมัคร": app.phone,
        "บ้านเลขที่": addressData.houseNo || "",
        "หมู่ที่": addressData.moo || "",
        "ตำบล/แขวง": addressData.subdistrict || "",
        "อำเภอ/เขต": addressData.district || "",
        "จังหวัดที่อยู่": addressData.province || "",
        "รหัสไปรษณีย์": addressData.postalCode || "",
        "หมู่เลือด": addressData.bloodGroup || "",
        "ชื่อ-สกุล บิดา": addressData.fatherName || "",
        "ชื่อ-สกุล มารดา": addressData.motherName || "",
        "ชื่อ-สกุล ผู้ปกครอง": addressData.guardianName || "",
        "ความสัมพันธ์ผู้ปกครอง": addressData.guardianRelation || "",
        "เบอร์โทรศัพท์ผู้ปกครอง": addressData.guardianPhone || "",
        "รอบการรับสมัคร": app.round.name,
        "ปีการศึกษา": app.round.academicYear.year,
        "สถานะ": app.status,
      };
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `NPC_Admission_STD02_RMS_${timestamp}`;

    // ส่งออกเป็น CSV พร้อม UTF-8 BOM (\uFEFF)
    if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      // ใส่ UTF-8 BOM เพื่อให้ Excel ภาษาไทยเปิดแล้วสระและพยัญชนะไม่เพี้ยน
      const bomCsv = "\uFEFF" + csvContent;

      return new NextResponse(bomCsv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    // ส่งออกเป็น Excel (.xlsx)
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // กำหนดความกว้างคอลัมน์อัตโนมัติเพื่อความสวยงาม
    const colWidths = [
      { wch: 6 },  // ลำดับ
      { wch: 15 }, // เลขที่ใบสมัคร
      { wch: 20 }, // เลขประจำตัวประชาชน
      { wch: 10 }, // คำนำหน้า
      { wch: 16 }, // ชื่อ
      { wch: 16 }, // นามสกุล
      { wch: 14 }, // วันเกิด
      { wch: 10 }, // ระดับชั้น
      { wch: 16 }, // รหัสสาขา
      { wch: 32 }, // ชื่อสาขา
      { wch: 10 }, // GPAX
      { wch: 28 }, // โรงเรียนเดิม
      { wch: 14 }, // จังหวัดโรงเรียน
      { wch: 16 }, // วุฒิเดิม
      { wch: 14 }, // เบอร์โทร
      { wch: 10 }, // บ้านเลขที่
      { wch: 8 },  // หมู่
      { wch: 14 }, // ตำบล
      { wch: 14 }, // อำเภอ
      { wch: 14 }, // จังหวัด
      { wch: 10 }, // รหัสไปรษณีย์
      { wch: 8 },  // หมู่เลือด
      { wch: 20 }, // บิดา
      { wch: 20 }, // มารดา
      { wch: 20 }, // ผู้ปกครอง
      { wch: 14 }, // ความสัมพันธ์
      { wch: 14 }, // เบอร์ผู้ปกครอง
      { wch: 24 }, // รอบ
      { wch: 10 }, // ปีการศึกษา
      { wch: 12 }, // สถานะ
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "ผู้ผ่านการคัดเลือก (ศธ.02)");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสร้างไฟล์ส่งออกข้อมูล" },
      { status: 500 }
    );
  }
}
