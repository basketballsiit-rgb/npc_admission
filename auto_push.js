const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const WATCH_DIR = __dirname;
let debounceTimer = null;
const DEBOUNCE_DELAY = 4000; // หน่วงเวลา 4 วินาทีหลังการบันทึกไฟล์ล่าสุด

// รายชื่อโฟลเดอร์ที่ไม่ต้องการให้กระตุ้นการ Push
const IGNORED_PATHS = [
  '.git',
  'node_modules',
  '.next',
  'build',
  'dist',
  '.gemini',
  'auto_push.js',
  'scratch',
  '.vscode'
];

// นามสกุลไฟล์ที่ไม่สนใจ
const IGNORED_EXTENSIONS = [
  '.tmp',
  '.swp',
  '.log',
  '.db',
  '.db-journal',
  '.tsbuildinfo'
];

function shouldIgnore(filePath) {
  const relativePath = path.relative(WATCH_DIR, filePath);
  if (!relativePath || relativePath === '') return false;

  // ป้องกันไฟล์ Environment หลุดรอด
  const baseName = path.basename(filePath);
  if (baseName.startsWith('.env') && baseName !== '.env.example') {
    return true;
  }

  const pathParts = relativePath.split(path.sep);
  if (pathParts.some(part => IGNORED_PATHS.includes(part))) {
    return true;
  }

  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.includes(ext)) {
    return true;
  }

  return false;
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: WATCH_DIR }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

async function doAutoPush() {
  console.log(`[${new Date().toLocaleTimeString('th-TH')}] ตรวจพบการแก้ไขไฟล์... กำลังเตรียมส่งข้อมูล`);
  try {
    const { stdout: statusOut } = await runCommand('git status --porcelain');
    if (!statusOut.trim()) {
      console.log(`[${new Date().toLocaleTimeString('th-TH')}] ไม่มีการเปลี่ยนแปลงที่ต้องบันทึก (Clean)`);
      return;
    }

    console.log(`[${new Date().toLocaleTimeString('th-TH')}] 1. เพิ่มไฟล์เข้า Git Index (git add .)...`);
    await runCommand('git add .');

    const commitMessage = `Auto-commit: อัปเดตระบบรับสมัคร ณ ${new Date().toLocaleString('th-TH')}`;
    console.log(`[${new Date().toLocaleTimeString('th-TH')}] 2. บันทึก Commit: "${commitMessage}"`);
    await runCommand(`git commit -m "${commitMessage}"`);

    console.log(`[${new Date().toLocaleTimeString('th-TH')}] 3. กำลังส่งขึ้น GitHub (git push origin main)...`);
    const { stdout: pushOut } = await runCommand('git push origin main');
    console.log(`[${new Date().toLocaleTimeString('th-TH')}] ✅ ส่งขึ้น GitHub เรียบร้อยแล้ว!`);
    console.log(`[${new Date().toLocaleTimeString('th-TH')}] 🚀 GitHub Actions กำลังดึงโค้ดไป Build และ Deploy บนเซิร์ฟเวอร์จริงอัตโนมัติ`);
    if (pushOut && pushOut.trim()) console.log(pushOut.trim());
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString('th-TH')}] ⚠️ Auto-push ขัดข้อง:`, err.message);
  }
}

console.log(`================================================================`);
console.log(`  🚀 NPC Admission: AutoPush & CI/CD Watcher เริ่มต้นทำงานแล้ว`);
console.log(`  โครงสร้างมาตรฐานเดียวกับระบบ npc_smartflow`);
console.log(`  โฟลเดอร์เฝ้าดู: ${WATCH_DIR}`);
console.log(`  เมื่อคุณแก้ไขหรือบันทึกไฟล์ ระบบจะ Push และ Deploy ไปยัง Server อัตโนมัติ`);
console.log(`================================================================\n`);

fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;

  const fullPath = path.join(WATCH_DIR, filename);

  if (shouldIgnore(fullPath)) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    doAutoPush();
  }, DEBOUNCE_DELAY);
});
