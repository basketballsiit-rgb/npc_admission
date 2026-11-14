const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

async function main() {
  console.log("==========================================================");
  console.log("🌱 Seeding Real NPC Data: วิทยาลัยสารพัดช่างน่าน (ปีการศึกษา 2570)");
  console.log("==========================================================\n");

  // 1. สร้างบัญชีผู้ดูแลระบบ (Admin User)
  const defaultPassword = hashPassword("Admin@NPC2570");
  const admin = await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {
      password: defaultPassword,
    },
    create: {
      username: "admin",
      password: defaultPassword,
      name: "ผู้ดูแลระบบ งานทะเบียน วิทยาลัยสารพัดช่างน่าน",
      role: "SUPERADMIN",
      isActive: true,
    },
  });
  console.log(`✓ Admin User created: username="${admin.username}" (password: Admin@NPC2570)`);

  // 2. ปิดปีการศึกษาเก่า (ถ้ามี) แล้วสร้าง/เปิดปีการศึกษา "2570"
  await prisma.academicYear.updateMany({
    data: { isActive: false },
  });

  const year2570 = await prisma.academicYear.upsert({
    where: { year: "2570" },
    update: { isActive: true },
    create: {
      year: "2570",
      isActive: true,
    },
  });
  console.log(`✓ Academic Year: ${year2570.year} (Active)`);

  // 3. จัดการรอบการรับสมัคร 2 รอบ
  // ลบเฉพาะถ้าไม่มีใบสมัคร เพื่อป้องกัน Foreign Key Error
  const existingApps = await prisma.application.count();
  if (existingApps === 0) {
    await prisma.admissionRound.deleteMany({
      where: { academicYearId: year2570.id },
    });
  }

  const quotaRound = await prisma.admissionRound.upsert({
    where: {
      id: "quota-round-2570",
    },
    update: {
      name: "รอบโควตาพิเศษ",
      isActive: true,
    },
    create: {
      id: "quota-round-2570",
      academicYearId: year2570.id,
      name: "รอบโควตาพิเศษ",
      roundType: "QUOTA",
      startAt: new Date("2026-11-01T00:00:00Z"),
      endAt: new Date("2026-12-31T23:59:59Z"),
      announceAt: new Date("2027-01-05T09:00:00Z"),
      isActive: true,
    },
  });

  const regularRound = await prisma.admissionRound.upsert({
    where: {
      id: "regular-round-2570",
    },
    update: {
      name: "รอบปกติ",
      isActive: true,
    },
    create: {
      id: "regular-round-2570",
      academicYearId: year2570.id,
      name: "รอบปกติ",
      roundType: "REGULAR",
      startAt: new Date("2027-01-06T00:00:00Z"),
      endAt: new Date("2027-03-31T23:59:59Z"),
      announceAt: new Date("2027-04-10T09:00:00Z"),
      isActive: true,
    },
  });

  console.log(`✓ Round 1: ${quotaRound.name} [QUOTA] (ID: ${quotaRound.id})`);
  console.log(`✓ Round 2: ${regularRound.name} [REGULAR] (ID: ${regularRound.id})`);

  // 4. สาขาวิชาตามหลักสูตร สอศ. พ.ศ. 2567 รวม 12 รายการ
  const programs = [
    // [ระดับ ปวช.]
    {
      code: "20101",
      level: "ปวช.",
      name: "สาขาวิชาช่างยนต์ (งานยานยนต์)",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "20143",
      level: "ปวช.",
      name: "สาขาวิชายานยนต์ไฟฟ้า",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "20104",
      level: "ปวช.",
      name: "สาขาวิชาช่างไฟฟ้า (ไฟฟ้ากำลัง)",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "20105",
      level: "ปวช.",
      name: "สาขาวิชาอิเล็กทรอนิกส์",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "20201",
      level: "ปวช.",
      name: "สาขาวิชาการบัญชี",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "20202",
      level: "ปวช.",
      name: "สาขาวิชาการตลาด",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "21901",
      level: "ปวช.",
      name: "สาขาวิชาเทคโนโลยีสารสนเทศ",
      quotaSeats: 20,
      regularSeats: 20,
    },

    // [ระดับ ปวส.]
    {
      code: "30101",
      level: "ปวส.",
      name: "สาขาวิชาเทคนิคเครื่องกล (เทคนิคยานยนต์)",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "30104",
      level: "ปวส.",
      name: "สาขาวิชาไฟฟ้า (ไฟฟ้ากำลัง)",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "30105",
      level: "ปวส.",
      name: "สาขาวิชาเทคโนโลยีอิเล็กทรอนิกส์",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "30201",
      level: "ปวส.",
      name: "สาขาวิชาการบัญชี",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "30202",
      level: "ปวส.",
      name: "สาขาวิชาการตลาด",
      quotaSeats: 20,
      regularSeats: 20,
    },
    {
      code: "31901",
      level: "ปวส.",
      name: "สาขาวิชาเทคโนโลยีสารสนเทศ",
      quotaSeats: 20,
      regularSeats: 20,
    },
  ];

  console.log("\n📦 กำลังสร้างข้อมูลสาขาวิชา 12 รายการ...");
  for (const prog of programs) {
    const item = await prisma.programQuota.upsert({
      where: {
        academicYearId_code_level: {
          academicYearId: year2570.id,
          code: prog.code,
          level: prog.level,
        },
      },
      update: {
        name: prog.name,
        quotaSeats: prog.quotaSeats,
        regularSeats: prog.regularSeats,
        isOpen: true,
      },
      create: {
        academicYearId: year2570.id,
        code: prog.code,
        level: prog.level,
        name: prog.name,
        quotaSeats: prog.quotaSeats,
        regularSeats: prog.regularSeats,
        rolloverSeats: 0,
        isOpen: true,
      },
    });
    console.log(`  [${item.level}] รหัส ${item.code}: ${item.name} (โควตา: ${item.quotaSeats}, ปกติ: ${item.regularSeats})`);
  }

  // 5. รายการค่าใช้จ่ายเบื้องต้นแรกเข้า (Initial Expense Items)
  const defaultExpenses = [
    // ปวช. (ทั่วไป)
    {
      level: "ปวช.",
      programCode: null,
      itemName: "ค่าบำรุงการศึกษา / ค่าหน่วยกิต",
      amount: 0,
      note: "ฟรีตามนโยบายเรียนฟรี 15 ปีของรัฐบาล",
      sortOrder: 1,
    },
    {
      level: "ปวช.",
      programCode: null,
      itemName: "ค่าชุดฝึกปฏิบัติการวิชาชีพและอุปกรณ์ประจำสาขา",
      amount: 1200,
      note: "ชำระวันมอบตัว / ใช้อุปกรณ์ฝึกจริง",
      sortOrder: 2,
    },
    {
      level: "ปวช.",
      programCode: null,
      itemName: "ค่าประกันอุบัติเหตุ บัตรนักศึกษา และตรวจสุขภาพ",
      amount: 350,
      note: "คุ้มครองการรักษาพยาบาลตลอด 24 ชั่วโมง",
      sortOrder: 3,
    },
    // ปวช. เฉพาะสาขาวิชายานยนต์ไฟฟ้า (20143)
    {
      level: "ปวช.",
      programCode: "20143",
      itemName: "ค่าอุปกรณ์ความปลอดภัยระบบไฟฟ้าแรงดันสูง (EV Safety)",
      amount: 300,
      note: "ถุงมือฉนวนและอุปกรณ์มาตรฐานความปลอดภัย EV",
      sortOrder: 4,
    },
    // ปวส.
    {
      level: "ปวส.",
      programCode: null,
      itemName: "ค่าลงทะเบียนเรียนและค่าหน่วยกิต",
      amount: 2500,
      note: "สามารถยื่นกู้ยืมกองทุน กยศ. ได้เต็มจำนวน",
      sortOrder: 1,
    },
    {
      level: "ปวส.",
      programCode: null,
      itemName: "ค่าบำรุงห้องปฏิบัติการเทคโนโลยีและซอฟต์แวร์วิชาชีพ",
      amount: 1200,
      note: "รวมการใช้งานเครื่องมือและระบบเครือข่าย",
      sortOrder: 2,
    },
    {
      level: "ปวส.",
      programCode: null,
      itemName: "ค่าประกันอุบัติเหตุ บัตรนักศึกษา และพัฒนาทักษะวิชาชีพ",
      amount: 450,
      note: "คุ้มครองอุบัติเหตุและกิจกรรมการศึกษา",
      sortOrder: 3,
    },
    // ปวส.ทวิภาคี
    {
      level: "ปวส.ทวิภาคี",
      programCode: null,
      itemName: "ค่าลงทะเบียนเรียนระบบทวิภาคี",
      amount: 2000,
      note: "มีเบี้ยเลี้ยงและรายได้ระหว่างฝึกงานในสถานประกอบการ",
      sortOrder: 1,
    },
    {
      level: "ปวส.ทวิภาคี",
      programCode: null,
      itemName: "ค่าประกันอุบัติเหตุและการตรวจสุขภาพก่อนฝึกงาน",
      amount: 450,
      note: "ครอบคลุมการฝึกงานในสถานประกอบการจริง",
      sortOrder: 2,
    },
  ];

  console.log("\n💰 กำลังสร้างข้อมูลรายการค่าใช้จ่ายเบื้องต้น...");
  for (const exp of defaultExpenses) {
    const existing = await prisma.initialExpenseItem.findFirst({
      where: {
        academicYearId: year2570.id,
        level: exp.level,
        programCode: exp.programCode,
        itemName: exp.itemName,
      },
    });

    if (!existing) {
      await prisma.initialExpenseItem.create({
        data: {
          academicYearId: year2570.id,
          level: exp.level,
          programCode: exp.programCode,
          itemName: exp.itemName,
          amount: exp.amount,
          note: exp.note,
          sortOrder: exp.sortOrder,
          isActive: true,
        },
      });
      console.log(`  [${exp.level}] ${exp.itemName}: ${exp.amount} บาท (${exp.note || "-"})`);
    }
  }

  console.log("\n==========================================================");
  console.log("✨ นำเข้าข้อมูลจริง วิทยาลัยสารพัดช่างน่าน (2570) สำเร็จเรียบร้อย!");
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
