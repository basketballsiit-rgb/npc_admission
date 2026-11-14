# ระบบรับสมัครนักเรียน นักศึกษาใหม่ วิทยาลัยสารพัดช่างน่าน (NPC Admission)

เว็บแอปพลิเคชันระบบบริหารจัดการและรับสมัครนักเรียน นักศึกษาใหม่ ระดับประกาศนียบัตรวิชาชีพ (ปวช.) และประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ประจำวิทยาลัยสารพัดช่างน่าน สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)

---

## 🌟 จุดเด่นและสถาปัตยกรรมเทคโนโลยี (Tech Stack)

- **Frontend & Backend Framework:** [Next.js](https://nextjs.org/) (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS ออกแบบรองรับมือถือ 100% (Mobile-First) เข้าชุดกับธีม NPC E-Service โทนสีน้ำเงินกรมท่า (`#1E3A8A`) และสีส้มทอง (`#F59E0B`)
- **Icons & Typography:** Lucide React Icons พร้อมฟอนต์ Google Fonts ภาษาไทย `Sarabun` และ `Prompt`
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) ออกแบบโครงสร้าง Schema เป็นกลาง สามารถสลับระหว่าง SQLite, MySQL, และ PostgreSQL ได้โดยไม่ต้องแก้โค้ด Business Logic
- **Export Formats:** ส่งออกไฟล์ Microsoft Excel (`.xlsx`) และ CSV (UTF-8 with BOM `\uFEFF`) ตามมาตรฐานนำเข้าข้อมูลระบบ **ศธ.02 ออนไลน์** และโปรแกรมบริหารสถานศึกษา **RMS**

---

## 🛡️ สถาปัตยกรรมความปลอดภัยและการคุ้มครองข้อมูลส่วนบุคคล (PDPA Architecture)

ระบบออกแบบตามมาตรฐานความปลอดภัยข้อมูลส่วนบุคคลขั้นสูง (Zero Plaintext CID at Rest):

1. **การเข้ารหัสลับรหัสบัตรประชาชน (AES-256-GCM):**
   - จัดเก็บในคอลัมน์ `cidEncrypted` ในรูป `iv:authTag:encryptedHex`
   - มีการตรวจสอบความถูกต้องของข้อมูล (Authentication Tag) ป้องกันการดัดแปลงแก้ไข
2. **การค้นหาและตรวจสอบสิทธิ์ด้วย HMAC-SHA256 (cidHash):**
   - คำนวณค่าแฮชด้วย Secret Key ฝั่ง Server เพื่อใช้เป็น Unique Index ในการตรวจสอบการสมัครซ้ำและค้นหาใบสมัคร โดยไม่มีการถอดรหัสออกมาดู
3. **การปิดบังข้อมูลบนหน้าจอ (Masked CID):**
   - หน้าจอทั่วไปและ API ฝั่งผู้สมัครจะเห็นเลขบัตรในรูปแบบ `1-55XX-XXXXX-12-3` เสมอ
4. **การถอดรหัสแบบ On-the-fly ณ ฝั่ง Server เท่านั้น:**
   - รหัสบัตร 13 หลักจริงจะถูกถอดรหัสเฉพาะจังหวะที่แอดมินหรือเจ้าหน้าที่งานทะเบียนที่ผ่านการตรวจสอบสิทธิ์สั่ง **"ส่งออกข้อมูล ศธ.02 / RMS"** เท่านั้น
5. **ระบบยืนยันตัวตน 3 ปัจจัยสำหรับผู้สมัคร (3-Factor Verification):**
   - ตรวจสอบสถานะและแก้ไขใบสมัครด้วย: เลขบัตรประชาชน (Modulo 11) + วันเดือนปีเกิด + เบอร์โทรศัพท์ที่ลงทะเบียน
6. **ระบบป้องกัน Brute-force & Security Headers:**
   - มี Rate Limiter จำกัดความถี่การเข้าใช้งานต่อ IP
   - กำหนด Security Headers พื้นฐานครบถ้วน (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`)

---

## 📋 ความต้องการของระบบ (System Requirements)

- **Node.js:** เวอร์ชัน `18.18.0` ขึ้นไป หรือ `20.x` LTS (แนะนำ)
- **Package Manager:** `npm` (มาพร้อม Node.js) หรือ `pnpm` / `yarn`
- **Database:**
  - *สำหรับทดสอบในเครื่อง:* **SQLite** (พร้อมใช้งานทันที ไม่ต้องลงโปรแกรมฐานข้อมูลแยก)
  - *สำหรับ Production จริงของวิทยาลัย:* **MySQL 8.0+** / **MariaDB 10.4+** หรือ **PostgreSQL 14+**

---

## 🚀 ขั้นตอนการติดตั้งและรันระบบครั้งแรก (Quick Start)

### 1. ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์โปรเจกต์ (`npc_admission`) แล้วสั่ง:
```bash
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (`.env`)
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
*(บน Windows PowerShell ให้ใช้คำสั่ง `Copy-Item .env.example .env`)*

เปิดไฟล์ `.env` และกำหนดค่าดังนี้:
```env
# การเชื่อมต่อฐานข้อมูล (ค่าเริ่มต้นใช้ SQLite สำหรับทดสอบ)
DATABASE_URL="file:./dev.db"

# กุญแจเข้ารหัส AES-256 (32 Bytes / 64 Hex Chars)
CID_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# กุญแจลับสำหรับ HMAC-SHA256 และ Session Token
CID_HMAC_SECRET="npc_admission_secure_hmac_secret_key_nan_polytechnic_2570"

# URL ของระบบ
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **💡 วิธีสุ่มสร้างกุญแจเข้ารหัส 32-byte Hex Key ใหม่ที่ปลอดภัย:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. สร้างโครงสร้างฐานข้อมูลและ Seed ข้อมูลตั้งต้น
```bash
# อัปเดตโครงสร้างตารางเข้าสู่ฐานข้อมูล
npx prisma db push

# นำเข้าข้อมูลเริ่มต้น (ปีการศึกษา 2570, รอบโควตา, รอบปกติ, 12 สาขาวิชา สอศ. และบัญชีผู้ดูแลระบบ)
npx prisma db seed
```

### 4. รันระบบสำหรับทดสอบ (Development Mode)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 🔑 ข้อมูลบัญชีผู้ดูแลระบบและเจ้าหน้าที่ (Default Credentials)

- **URL หน้าล็อกอินเจ้าหน้าที่:** `http://localhost:3000/admin/login`
- **ชื่อผู้ใช้งาน (Username):** `admin`
- **รหัสผ่าน (Password):** `Admin@NPC2570`

---

## 🗄️ ขั้นตอนการเปลี่ยนฐานข้อมูลเป็น MySQL หรือ PostgreSQL บน Production Server

เมื่อต้องการนำระบบไปติดตั้งบนเซิร์ฟเวอร์จริงของวิทยาลัยสารพัดช่างน่าน (เช่น เซิร์ฟเวอร์ XAMPP, Linux Ubuntu Server, หรือ Cloud) ให้ปฏิบัติตามขั้นตอนทีละบรรทัดดังนี้:

### กรณีที่ 1: เปลี่ยนเป็น MySQL / MariaDB (ระบบยอดนิยมของสถานศึกษา)

1. เปิดไฟล์ `prisma/schema.prisma`
2. ค้นหาบรรทัด datasource:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. เปลี่ยน `provider = "sqlite"` เป็น `provider = "mysql"` ดังนี้:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
4. สร้างฐานข้อมูลใหม่ใน MySQL ของวิทยาลัย (เช่น ผ่าน phpMyAdmin หรือ MySQL CLI):
   ```sql
   CREATE DATABASE npc_admission CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
5. เปิดไฟล์ `.env` แล้วแก้ไขค่า `DATABASE_URL` ให้ชี้ไปยัง MySQL:
   ```env
   # รูปแบบ: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   DATABASE_URL="mysql://root:password123@localhost:3306/npc_admission"
   ```
6. สั่งอัปเดต Schema และ Seed ข้อมูลตั้งต้นเข้าสู่ MySQL:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

---

### กรณีที่ 2: เปลี่ยนเป็น PostgreSQL

1. เปิดไฟล์ `prisma/schema.prisma`
2. เปลี่ยน `provider = "sqlite"` เป็น `provider = "postgresql"`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. สร้างฐานข้อมูลใหม่ใน PostgreSQL:
   ```sql
   CREATE DATABASE npc_admission;
   ```
4. เปิดไฟล์ `.env` แล้วแก้ไขค่า `DATABASE_URL`:
   ```env
   # รูปแบบ: postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public
   DATABASE_URL="postgresql://postgres:password123@localhost:5432/npc_admission?schema=public"
   ```
5. สั่งอัปเดต Schema และ Seed ข้อมูลตั้งต้นเข้าสู่ PostgreSQL:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

---

## 📦 การสร้าง Production Build และการเปิดให้บริการจริง

```bash
# 1. คอมไพล์โปรเจกต์สำหรับ Production
npm run build

# 2. เริ่มต้นรันเซิร์ฟเวอร์ Production
npm run start
```
*(แนะนำให้ใช้ Process Manager เช่น `pm2` เพื่อดูแลให้ระบบทำงานตลอดเวลา: `pm2 start npm --name "npc-admission" -- start`)*

---

## 🧪 การทดสอบระบบอัตโนมัติ (Automated Testing Suite)

โครงการนี้มีชุดทดสอบครอบคลุมทุกเลเยอร์ สามารถรันตรวจสอบได้ตลอดเวลา:

```bash
# 1. ทดสอบฟังก์ชันความปลอดภัยและการเข้ารหัส (AES-256-GCM, HMAC, Modulo 11, Masking)
npm run test:security

# 2. ทดสอบ Business Logic และ API Endpoints (Rounds, Rollover, Application Rules)
npm run test:api

# 3. รัน Security Audit ตรวจสอบการรั่วไหลของข้อมูลและ Security Headers
npx tsx scratch/audit-security.ts

# 4. ทดสอบ End-to-End รวมระบบหลังบ้านและการถอดรหัสส่งออก ศธ.02
npx tsx scratch/e2e-test-step5.ts
```

---

## 🗺️ แผนผังเส้นทางของระบบ (Application Routes Map)

| เส้นทาง (Path) | ประเภท | รายละเอียดการทำงาน |
| :--- | :--- | :--- |
| `/` | สาธารณะ | หน้าแรก (Landing Page) แสดงรอบรับสมัคร, ตัวนับเวลาถอยหลัง, รายการสาขา และโควตาคงเหลือ |
| `/apply` | สาธารณะ | แบบฟอร์มสมัครเรียน 3 ขั้นตอน (เลือกสาขา -> ข้อมูลส่วนตัว/ครอบครัว -> ตรวจทานและยืนยัน) |
| `/status` | สาธารณะ | ระบบตรวจสอบสถานะ ยืนยันตัวตน 3 ปัจจัย แก้ไขใบสมัคร และกรอกทะเบียนประวัติเพิ่มเติม |
| `/admin/login` | เจ้าหน้าที่ | หน้าลงชื่อเข้าใช้งานสำหรับเจ้าหน้าที่และผู้บริหาร |
| `/admin` | เจ้าหน้าที่ | แดชบอร์ดสถิติภาพรวม ยอดผู้สมัครแยกโควตา/ปกติ, ปวช./ปวส., และตารางเปรียบเทียบรายสาขา |
| `/admin/applications`| เจ้าหน้าที่ | จัดการผู้สมัคร เรียงลำดับ GPAX มากไปน้อย, ค้นหา, ดูข้อมูลครอบครัว/ที่อยู่ และ **อนุมัติยกล็อต** |
| `/admin/settings` | เจ้าหน้าที่ | จัดการปีการศึกษา, ตั้งวันเปิด-ปิดรอบรับสมัคร, สวิตช์เปิด/ปิดรายสาขา, และ **ระบบทบยอดโควตา** |
| `/admin/export` | เจ้าหน้าที่ | ศูนย์ส่งออกข้อมูลผู้ผ่านการคัดเลือกเป็น **Excel (.xlsx)** และ **CSV (UTF-8 BOM)** สำหรับ ศธ.02 และ RMS |

---

## 🏢 ข้อมูลสถานศึกษา

**วิทยาลัยสารพัดช่างน่าน (Nan Polytechnic College)**  
สำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ  
ที่อยู่: ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000  
โทรศัพท์: 054-710-238 | เว็บไซต์: [www.npc.ac.th](http://www.npc.ac.th)
