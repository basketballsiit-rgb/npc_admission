import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { GET as getPrograms } from "../src/app/api/programs/route";
import { GET as getRounds } from "../src/app/api/rounds/route";
import { POST as postApplication } from "../src/app/api/applications/route";
import { GET as getStatus } from "../src/app/api/applications/status/route";
import { POST as postRollover } from "../src/app/api/admin/rollover/route";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function check(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passed++;
  } else {
    console.error(`  ${RED}✗ FAIL:${RESET} ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log(`${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}  NPC_Admission: Step 2 Backend API & Business Logic Verification${RESET}`);
  console.log(`${CYAN}================================================================\n${RESET}`);

  // ล้างข้อมูลการสมัครเก่าก่อนทดสอบ
  await prisma.application.deleteMany();

  // 1. ทดสอบ GET /api/programs
  console.log(`${CYAN}[1] Testing GET /api/programs (รายการสาขาวิชา 12 สาขา)${RESET}`);
  const reqPrograms = new Request("http://localhost:3000/api/programs");
  const resPrograms = await getPrograms(reqPrograms);
  const dataPrograms = await resPrograms.json();

  check(resPrograms.status === 200, "HTTP Status 200 OK");
  check(dataPrograms.success === true, "data.success is true");
  check(dataPrograms.totalPrograms === 12, `Total programs is 12 (Found: ${dataPrograms.totalPrograms})`);
  check(dataPrograms.academicYear === "2570", `Active Academic Year is 2570 (Found: ${dataPrograms.academicYear})`);

  const pvoc = dataPrograms.data.filter((p: any) => p.level === "ปวช.");
  const pvs = dataPrograms.data.filter((p: any) => p.level === "ปวส.");
  check(pvoc.length === 6, `ปวช. มี 6 สาขา (พบ ${pvoc.length})`);
  check(pvs.length === 6, `ปวส. มี 6 สาขา (พบ ${pvs.length})`);

  // ดึง roundId และ programId สำหรับใช้ทดสอบ
  const quotaProgram = dataPrograms.data[0]; // ช่างยนต์

  // 2. ทดสอบ GET /api/rounds
  console.log(`\n${CYAN}[2] Testing GET /api/rounds (รอบการรับสมัครและเวลา Server)${RESET}`);
  const reqRounds = new Request("http://localhost:3000/api/rounds");
  const resRounds = await getRounds(reqRounds);
  const dataRounds = await resRounds.json();

  check(resRounds.status === 200, "HTTP Status 200 OK");
  check(dataRounds.rounds.length === 2, `มี 2 รอบรับสมัคร (พบ ${dataRounds.rounds.length})`);

  const quotaRound = dataRounds.rounds.find((r: any) => r.roundType === "QUOTA");
  const regularRound = dataRounds.rounds.find((r: any) => r.roundType === "REGULAR");
  check(quotaRound.status === "OPEN", `รอบโควตาสถานะเปิดรับสมัคร (status: ${quotaRound.status})`);
  check(quotaRound.canApply === true, "canApply เป็น true");

  // 3. ทดสอบ POST /api/applications (ยื่นใบสมัครใหม่)
  console.log(`\n${CYAN}[3] Testing POST /api/applications (ยื่นใบสมัครและกฎกติกา)${RESET}`);
  const validCID1 = "1559900123453"; // Valid Modulo 11 CID
  const validCID2 = "1550100456786"; // Another Valid CID

  // 3.1 ยื่นใบสมัครถูกต้อง (รอบโควตา)
  const reqApp1 = new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId: quotaRound.id,
      programId: quotaProgram.id,
      cid: validCID1,
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      birthDate: "2010-04-12",
      phone: "0812345678",
      previousSchool: "โรงเรียนน่านคริสเตียนศึกษา",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 2.75, // ไม่บล็อกเกรดเฉลี่ยขั้นต่ำ
      addressInfo: { address: "123 หมู่ 4 ต.ในเวียง อ.เมือง จ.น่าน" },
    }),
  });
  const resApp1 = await postApplication(reqApp1);
  const dataApp1 = await resApp1.json();

  check(resApp1.status === 201, `ยื่นใบสมัครสำเร็จ Status 201 (applicationNo: ${dataApp1.data?.applicationNo})`);
  check(dataApp1.data?.cidMasked === "1-55XX-XXXXX-45-3", `Masked CID ถูกต้อง: ${dataApp1.data?.cidMasked}`);

  // 3.2 กติกาห้ามสมัครซ้ำในรอบเดียวกัน
  const reqAppDuplicate = new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId: quotaRound.id,
      programId: quotaProgram.id,
      cid: validCID1,
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      birthDate: "2010-04-12",
      phone: "0812345678",
      previousSchool: "โรงเรียนน่านคริสเตียนศึกษา",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 2.75,
    }),
  });
  const resAppDuplicate = await postApplication(reqAppDuplicate);
  const dataAppDuplicate = await resAppDuplicate.json();
  check(resAppDuplicate.status === 409, `บล็อกการสมัครซ้ำในรอบเดียวกันสำเร็จ Status 409 (${dataAppDuplicate.error})`);

  // 3.3 ตรวจสอบ Checksum เลขบัตรประชาชนผิด
  const reqAppInvalidCID = new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId: quotaRound.id,
      programId: quotaProgram.id,
      cid: "1559900123459", // Checksum ผิด
      prefix: "นาย",
      firstName: "ทดสอบ",
      lastName: "ผิดพลาด",
      birthDate: "2010-01-01",
      phone: "0800000000",
      previousSchool: "โรงเรียนทดสอบ",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 3.5,
    }),
  });
  const resAppInvalidCID = await postApplication(reqAppInvalidCID);
  check(resAppInvalidCID.status === 400, "ปฏิเสธเลขบัตรประชาชนที่ไม่ถูกต้องตาม Modulo 11 Checksum (Status 400)");

  // 4. ทดสอบ GET /api/applications/status
  console.log(`\n${CYAN}[4] Testing GET /api/applications/status (ค้นหาสถานะด้วยเลข 13 หลัก)${RESET}`);
  const reqStatus = new Request(`http://localhost:3000/api/applications/status?cid=${validCID1}`);
  const resStatus = await getStatus(reqStatus);
  const dataStatus = await resStatus.json();

  check(resStatus.status === 200, "HTTP Status 200 OK");
  check(dataStatus.total === 1, `พบข้อมูลใบสมัคร 1 รายการ`);
  check(dataStatus.data[0].cidMasked === "1-55XX-XXXXX-45-3", "Masked CID แสดงผลถูกต้อง ไม่หลุด Raw CID");

  // 5. ทดสอบ Quota Rollover API (POST /api/admin/rollover)
  console.log(`\n${CYAN}[5] Testing Quota Rollover API (กลไกทบยอดที่นั่งอัตโนมัติ)${RESET}`);
  // ปรับสถานะของใบสมัครคนแรกให้เป็น APPROVED
  await prisma.application.update({
    where: { applicationNo: dataApp1.data.applicationNo },
    data: { status: "APPROVED" },
  });

  const reqRollover = new Request("http://localhost:3000/api/admin/rollover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const resRollover = await postRollover(reqRollover);
  const dataRollover = await resRollover.json();

  check(resRollover.status === 200, "HTTP Status 200 OK สำหรับ Rollover API");
  const prog1Report = dataRollover.data.find((p: any) => p.programId === quotaProgram.id);
  // quotaSeats = 20, approvedQuota = 1 -> rolloverSeats ต้องเป็น 19, totalRegularSeats = 20 + 19 = 39
  check(prog1Report.approvedQuota === 1, `สาขาแรกมีผู้ผ่านการคัดเลือก (APPROVED) 1 คน`);
  check(prog1Report.rolloverSeats === 19, `ที่นั่งทบยอดคงเหลือถูกต้อง: 19 ที่นั่ง (พบ: ${prog1Report.rolloverSeats})`);
  check(prog1Report.totalRegularSeats === 39, `ยอดรับรอบปกติใหม่หลังทบยอด: 39 ที่นั่ง (20+19)`);

  // 6. ทดสอบกติการอบปกติ (REGULAR): ตรวจสอบการล็อกผู้ที่ APPROVED ในรอบโควตา
  console.log(`\n${CYAN}[6] Testing Quota APPROVED lock in Regular Round${RESET}`);
  // เปิดรอบปกติชั่วคราวเพื่อทดสอบ
  await prisma.admissionRound.update({
    where: { id: regularRound.id },
    data: {
      startAt: new Date(Date.now() - 3600 * 1000), // เปิดแล้ว 1 ชม. ก่อน
      endAt: new Date(Date.now() + 3600 * 1000 * 24 * 30),
    },
  });

  // ลองใช้เลข validCID1 ซึ่ง APPROVED ในรอบโควตาแล้ว มาสมัครรอบปกติ
  const reqRegularLock = new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId: regularRound.id,
      programId: quotaProgram.id,
      cid: validCID1,
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      birthDate: "2010-04-12",
      phone: "0812345678",
      previousSchool: "โรงเรียนน่านคริสเตียนศึกษา",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 2.75,
    }),
  });
  const resRegularLock = await postApplication(reqRegularLock);
  const dataRegularLock = await resRegularLock.json();
  check(
    resRegularLock.status === 403 && dataRegularLock.error === "QUOTA_APPROVED_LOCKED",
    `บล็อกผู้ที่ APPROVED ในรอบโควตาไม่ให้สมัครรอบปกติ (Status 403: ${dataRegularLock.error})`
  );

  // 7. ทดสอบผู้ที่ REJECTED หรือ CANCELLED ในรอบโควตา สามารถสมัครรอบปกติได้ทันที
  console.log(`\n${CYAN}[7] Testing REJECTED/CANCELLED applicant applying in Regular Round${RESET}`);
  // สร้างใบสมัครคนที่ 2 ในรอบโควตา แล้วปรับเป็น REJECTED
  const app2 = await prisma.application.create({
    data: {
      applicationNo: "NPC70-Q-0002",
      roundId: quotaRound.id,
      programId: quotaProgram.id,
      cidEncrypted: "encrypted",
      cidHash: (await import("../src/lib/security")).hashCID(validCID2),
      cidMasked: "1-55XX-XXXXX-78-6",
      prefix: "นางสาว",
      firstName: "สมหญิง",
      lastName: "รักเรียน",
      birthDate: new Date("2010-08-20"),
      phone: "0898765432",
      previousSchool: "โรงเรียนสตรีศรีน่าน",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 3.2,
      status: "REJECTED", // ไม่ผ่านรอบโควตา
    },
  });

  // ใช้ validCID2 สมัครรอบปกติ
  const reqRegularAllowed = new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId: regularRound.id,
      programId: quotaProgram.id,
      cid: validCID2,
      prefix: "นางสาว",
      firstName: "สมหญิง",
      lastName: "รักเรียน",
      birthDate: "2010-08-20",
      phone: "0898765432",
      previousSchool: "โรงเรียนสตรีศรีน่าน",
      schoolProvince: "น่าน",
      previousEducation: "ม.3",
      gpax: 3.2,
    }),
  });
  const resRegularAllowed = await postApplication(reqRegularAllowed);
  const dataRegularAllowed = await resRegularAllowed.json();
  check(
    resRegularAllowed.status === 201,
    `ผู้ที่ REJECTED ในรอบโควตาสามารถสมัครรอบปกติได้สำเร็จ (Status 201: ${dataRegularAllowed.data?.applicationNo})`
  );

  // คืนค่าเวลารอบปกติ
  await prisma.admissionRound.update({
    where: { id: regularRound.id },
    data: {
      startAt: new Date("2027-01-06T00:00:00Z"),
      endAt: new Date("2027-03-31T23:59:59Z"),
    },
  });

  console.log(`\n${CYAN}----------------------------------------------------------------${RESET}`);
  if (failed === 0) {
    console.log(`${GREEN}ALL ${passed} VERIFICATION TESTS PASSED 100%!${RESET}`);
    console.log(`${CYAN}================================================================\n${RESET}`);
    process.exit(0);
  } else {
    console.error(`${RED}FAILED: ${failed} test(s) failed out of ${passed + failed}.${RESET}`);
    console.log(`${CYAN}================================================================\n${RESET}`);
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
