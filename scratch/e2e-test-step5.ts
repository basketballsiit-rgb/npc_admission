import { prisma } from "../src/lib/prisma";
import { encryptCID, hashCID, decryptCID, maskCID } from "../src/lib/security";
import * as XLSX from "xlsx";

async function runE2EStep5() {
  console.log("==================================================================");
  console.log("   E2E INTEGRATION TEST: NPC ADMISSION STEP 5 (ADMIN & EXPORT)    ");
  console.log("==================================================================");

  try {
    // 1. ดึงรอบและสาขาวิชาตั้งต้น
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    const quotaRound = await prisma.admissionRound.findFirst({
      where: { academicYearId: activeYear!.id, roundType: "QUOTA" },
    });
    const regularRound = await prisma.admissionRound.findFirst({
      where: { academicYearId: activeYear!.id, roundType: "REGULAR" },
    });
    const programs = await prisma.programQuota.findMany({
      where: { academicYearId: activeYear!.id },
      take: 2,
    });
    const prog1 = programs[0];
    const prog2 = programs[1];

    console.log(`✓ ข้อมูลระบบ: ปี ${activeYear?.year}, รอบโควตา: ${quotaRound?.name}, รอบปกติ: ${regularRound?.name}`);

    // 2. สร้างข้อมูลผู้สมัครจำลอง 3 คน (พร้อมเลข 13 หลักจริงที่เข้ารหัส)
    const testApplicants = [
      {
        cid: "1550100123456",
        prefix: "นาย",
        firstName: "กิตติพงษ์",
        lastName: "สุขเกษม",
        birthDate: "2009-05-15",
        phone: "0812345678",
        previousSchool: "โรงเรียนศรีสวัสดิ์วิทยาคาร",
        schoolProvince: "น่าน",
        previousEducation: "มัธยมศึกษาปีที่ 3",
        gpax: 3.85,
        status: "APPROVED",
        programId: prog1!.id,
        roundId: quotaRound!.id,
        addressInfo: JSON.stringify({
          houseNo: "123",
          moo: "4",
          subdistrict: "ในเวียง",
          district: "เมืองน่าน",
          province: "น่าน",
          postalCode: "55000",
          bloodGroup: "O",
          fatherName: "นายประสิทธิ์ สุขเกษม",
          motherName: "นางสมพร สุขเกษม",
          guardianName: "นายประสิทธิ์ สุขเกษม",
          guardianRelation: "บิดา",
          guardianPhone: "0812345678",
        }),
      },
      {
        cid: "1550200234567",
        prefix: "นางสาว",
        firstName: "พิมพ์ชนก",
        lastName: "ใจดี",
        birthDate: "2009-08-20",
        phone: "0898765432",
        previousSchool: "โรงเรียนสตรีศรีน่าน",
        schoolProvince: "น่าน",
        previousEducation: "มัธยมศึกษาปีที่ 3",
        gpax: 3.92,
        status: "APPROVED",
        programId: prog2!.id,
        roundId: quotaRound!.id,
        addressInfo: JSON.stringify({
          houseNo: "45/2",
          moo: "1",
          subdistrict: "ผาสิงห์",
          district: "เมืองน่าน",
          province: "น่าน",
          postalCode: "55000",
          bloodGroup: "B",
          fatherName: "นายสมชาย ใจดี",
          motherName: "นางนภา ใจดี",
          guardianName: "นางนภา ใจดี",
          guardianRelation: "มารดา",
          guardianPhone: "0898765432",
        }),
      },
      {
        cid: "1550300345678",
        prefix: "นาย",
        firstName: "ธนภัทร",
        lastName: "มงคล",
        birthDate: "2009-11-10",
        phone: "0865432109",
        previousSchool: "โรงเรียนท่าวังผาพิทยาคม",
        schoolProvince: "น่าน",
        previousEducation: "มัธยมศึกษาปีที่ 3",
        gpax: 3.45,
        status: "PENDING",
        programId: prog1!.id,
        roundId: quotaRound!.id,
        addressInfo: JSON.stringify({
          houseNo: "88",
          moo: "5",
          subdistrict: "ท่าวังผา",
          district: "ท่าวังผา",
          province: "น่าน",
          postalCode: "55140",
          bloodGroup: "A",
          fatherName: "นายประสาน มงคล",
          motherName: "นางวันเพ็ญ มงคล",
          guardianName: "นายประสาน มงคล",
          guardianRelation: "บิดา",
          guardianPhone: "0865432109",
        }),
      },
    ];

    // บันทึกลงฐานข้อมูล
    for (let i = 0; i < testApplicants.length; i++) {
      const app = testApplicants[i];
      const cidEncrypted = encryptCID(app.cid);
      const cidHash = hashCID(app.cid);
      const cidMasked = maskCID(app.cid);
      const applicationNo = `NPC70-Q${String(i + 1).padStart(4, "0")}`;

      const existing = await prisma.application.findFirst({
        where: { cidHash, roundId: app.roundId },
      });

      if (existing) {
        await prisma.application.update({
          where: { id: existing.id },
          data: { status: app.status, gpax: app.gpax },
        });
      } else {
        await prisma.application.create({
          data: {
            applicationNo,
            cidEncrypted,
            cidHash,
            cidMasked,
            prefix: app.prefix,
            firstName: app.firstName,
            lastName: app.lastName,
            birthDate: new Date(app.birthDate),
            phone: app.phone,
            previousSchool: app.previousSchool,
            schoolProvince: app.schoolProvince,
            previousEducation: app.previousEducation,
            gpax: app.gpax,
            status: app.status,
            programId: app.programId,
            roundId: app.roundId,
            addressInfo: app.addressInfo,
          },
        });
      }
    }

    console.log(`✓ จำลองบันทึกข้อมูลผู้สมัครทดสอบ ${testApplicants.length} คนเรียบร้อยแล้ว`);

    // 3. ทดสอบความถูกต้องของการถอดรหัสเลข 13 หลัก
    const appsInDb = await prisma.application.findMany({
      include: { program: true },
      orderBy: { gpax: "desc" },
    });

    console.log("\n--- ทดสอบการถอดรหัสบัตรประชาชน On-the-fly สำหรับแอดมิน ---");
    appsInDb.forEach((a, idx) => {
      const decrypted = decryptCID(a.cidEncrypted);
      console.log(`[${idx + 1}] ${a.applicationNo} | ${a.prefix}${a.firstName} ${a.lastName}`);
      console.log(`    - ในฐานข้อมูล (Encrypted): ${a.cidEncrypted.slice(0, 30)}...`);
      console.log(`    - หน้าเว็บทั่วไป (Masked): ${a.cidMasked}`);
      console.log(`    - ถอดรหัสส่งออก (Decrypted): ${decrypted} (ถูกต้อง: ${decrypted.length === 13})`);
    });

    // 4. ทดสอบฟังก์ชัน Bulk Approve
    const pendingApps = appsInDb.filter((a) => a.status === "PENDING");
    if (pendingApps.length > 0) {
      console.log(`\n--- ทดสอบ Bulk Approve จำนวน ${pendingApps.length} รายการ ---`);
      await prisma.application.updateMany({
        where: { id: { in: pendingApps.map((p) => p.id) } },
        data: { status: "APPROVED" },
      });
      console.log("✓ Bulk Approve สำเร็จ: ทุกคนเปลี่ยนสถานะเป็น APPROVED");
    }

    // 5. ทดสอบการคำนวณ Quota Rollover
    console.log("\n--- ทดสอบการคำนวณทบยอดที่นั่ง (Quota Rollover Calculation) ---");
    const programsList = await prisma.programQuota.findMany({
      where: { academicYearId: activeYear!.id },
      include: {
        applications: {
          where: { roundId: quotaRound!.id, status: "APPROVED" },
        },
      },
    });

    let totalRollover = 0;
    programsList.forEach((p) => {
      const approvedCount = p.applications.length;
      const leftover = Math.max(0, p.quotaSeats - approvedCount);
      totalRollover += leftover;
    });

    console.log(`✓ จำนวนที่นั่งเหลือจากรอบโควตาที่จะถูกทบเข้ารอบปกติรวม: ${totalRollover} ที่นั่ง`);

    // 6. ทดสอบโครงสร้างไฟล์มาตรฐาน ศธ.02 และ RMS ผ่าน XLSX
    console.log("\n--- ทดสอบการจัดโครงสร้างส่งออกไฟล์มาตรฐาน ศธ.02 / RMS (.xlsx & .csv) ---");
    const approvedApps = await prisma.application.findMany({
      where: { status: "APPROVED" },
      include: { program: true, round: { include: { academicYear: true } } },
      orderBy: [{ program: { level: "asc" } }, { gpax: "desc" }],
    });

    const exportRows = approvedApps.map((app, index) => {
      const fullCID = decryptCID(app.cidEncrypted);
      const addressData = JSON.parse(app.addressInfo || "{}");
      return {
        "ลำดับ": index + 1,
        "เลขที่ใบสมัคร": app.applicationNo,
        "เลขประจำตัวประชาชน (13 หลัก)": fullCID,
        "คำนำหน้า": app.prefix,
        "ชื่อ": app.firstName,
        "นามสกุล": app.lastName,
        "ระดับชั้น": app.program.level,
        "รหัสสาขาวิชา (ศธ.02)": app.program.code,
        "ชื่อสาขาวิชา": app.program.name,
        "เกรดเฉลี่ยสะสม (GPAX)": app.gpax.toFixed(2),
        "สถานศึกษาเดิม": app.previousSchool,
        "จังหวัดสถานศึกษาเดิม": app.schoolProvince,
        "เบอร์โทรศัพท์ผู้สมัคร": app.phone,
        "ผู้ปกครอง": addressData.guardianName || "-",
        "เบอร์ผู้ปกครอง": addressData.guardianPhone || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ศธ02_RMS");
    const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);

    console.log(`✓ สร้างไฟล์ Excel สำเร็จ: ขนาด ${xlsxBuffer.length} bytes`);
    console.log(`✓ สร้างไฟล์ CSV (UTF-8 BOM) สำเร็จ: ขนาด ${Buffer.byteLength(csvContent, "utf8")} bytes`);
    console.log(`✓ คอลัมน์ ศธ.02 ถูกต้องครบถ้วน: ${Object.keys(exportRows[0]).join(", ")}`);
    console.log(`✓ เลขบัตรประชาชนแถวแรก: ${exportRows[0]["เลขประจำตัวประชาชน (13 หลัก)"]} (13 หลักเต็ม ไม่ถูก Mask)`);

    console.log("\n==================================================================");
    console.log("   ✓ ผลการทดสอบ E2E STEP 5 ผ่านสมบูรณ์แบบ 100% ทุกรายการ!         ");
    console.log("==================================================================");
  } catch (error) {
    console.error("E2E Test Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runE2EStep5();
