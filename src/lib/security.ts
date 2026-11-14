import crypto from "crypto";

/**
 * ดึง Encryption Key จาก Environment Variable
 * ต้องเป็นความยาว 32 bytes (64 ตัวอักษรฐาน 16 Hex)
 */
function getEncryptionKey(): Buffer {
  const hexKey = process.env.CID_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error("Missing environment variable: CID_ENCRYPTION_KEY is required.");
  }

  const keyBuffer = Buffer.from(hexKey, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      `Invalid CID_ENCRYPTION_KEY length: Expected 32 bytes (64 hex characters), got ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
}

/**
 * ดึง HMAC Secret จาก Environment Variable
 */
function getHmacSecret(): string {
  const secret = process.env.CID_HMAC_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error("Missing environment variable: CID_HMAC_SECRET is required.");
  }
  return secret;
}

/**
 * ล้างอักขระที่ไม่ใช่ตัวเลขออกจากเลขประจำตัวประชาชน
 */
export function sanitizeCID(cid: string): string {
  if (!cid) return "";
  return cid.replace(/\D/g, "");
}

/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย 13 หลัก ตามสูตร Modulo 11 Checksum
 * @param cid เลขบัตรประชาชน (รองรับทั้งแบบมีขีดและไม่มีขีด)
 * @returns boolean ถูกต้องหรือไม่
 */
export function validateThaiCID(cid: string): boolean {
  const cleanCID = sanitizeCID(cid);

  // ต้องมีความยาว 13 หลัก และเป็นตัวเลขทั้งหมด
  if (cleanCID.length !== 13) {
    return false;
  }

  // หลักแรกต้องไม่เป็น 0 (เลขบัตรประชาชนไทยจะขึ้นต้นด้วย 1-8)
  if (cleanCID.charAt(0) === "0") {
    return false;
  }

  // คำนวณผลรวมตามสูตร Modulo 11
  // ผลบวกของ (หลักที่ 1 * 13) + (หลักที่ 2 * 12) + ... + (หลักที่ 12 * 2)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCID.charAt(i), 10) * (13 - i);
  }

  // หาเศษจากการหารด้วย 11 แล้วนำไปลบออกจาก 11
  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 10;

  // เปรียบเทียบกับหลักที่ 13
  return checkDigit === parseInt(cleanCID.charAt(12), 10);
}

/**
 * เข้ารหัสเลขบัตรประชาชน 13 หลัก ด้วยอัลกอริทึม AES-256-GCM (Authenticated Encryption)
 * คืนค่ารูปแบบ "iv:authTag:ciphertext" (Hex encoded)
 * @param cid เลขบัตรประชาชน (13 หลัก)
 * @returns ข้อความที่เข้ารหัสแล้ว
 */
export function encryptCID(cid: string): string {
  const cleanCID = sanitizeCID(cid);
  if (!cleanCID || cleanCID.length !== 13) {
    throw new Error("Invalid Thai Citizen ID: Must be 13 digits.");
  }

  const key = getEncryptionKey();

  // สร้าง Initial Vector (IV) ขนาด 12 bytes (96-bit แนะนำตามมาตรฐาน NIST SP 800-38D สำหรับ GCM)
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(cleanCID, "utf8", "hex");
  encrypted += cipher.final("hex");

  // ดึง Authentication Tag ขนาด 16 bytes เพื่อป้องกัน Data Tampering
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * ถอดรหัสเลขบัตรประชาชนจาก AES-256-GCM
 * @param encryptedData ข้อความในรูปแบบ "iv:authTag:ciphertext" (Hex encoded)
 * @returns เลขบัตรประชาชน 13 หลักแบบ Plaintext
 */
export function decryptCID(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) {
    throw new Error("Invalid encrypted CID format.");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted CID payload: Expected iv:authTag:ciphertext.");
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== 12) {
    throw new Error("Corrupted or invalid IV length.");
  }
  if (authTag.length !== 16) {
    throw new Error("Corrupted or invalid Auth Tag length.");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * แฮชเลขบัตรประชาชนด้วย HMAC-SHA256
 * เป็น Deterministic Hash สำหรับใช้ค้นหาและตรวจสอบการสมัครซ้ำในฐานข้อมูลโดยไม่ต้องถอดรหัส
 * @param cid เลขบัตรประชาชน
 * @returns ค่าแฮช Hex ขนาด 64 ตัวอักษร
 */
export function hashCID(cid: string): string {
  const cleanCID = sanitizeCID(cid);
  if (!cleanCID || cleanCID.length !== 13) {
    throw new Error("Invalid Thai Citizen ID: Must be 13 digits.");
  }

  const secret = getHmacSecret();
  return crypto.createHmac("sha256", secret).update(cleanCID).digest("hex");
}

/**
 * จัดรูปแบบเลขบัตรประชาชนเพื่อความปลอดภัยในการแสดงผลทั่วไป (Masked CID)
 * รูปแบบ: 1-55XX-XXXXX-12-3 (คง 3 หลักแรกและ 3 หลักสุดท้าย ปิดบัง 7 หลักตรงกลาง)
 * @param cid เลขบัตรประชาชน
 * @returns ข้อความ Masked เช่น "1-55XX-XXXXX-12-3"
 */
export function maskCID(cid: string): string {
  const cleanCID = sanitizeCID(cid);
  if (cleanCID.length !== 13) {
    return cid; // คืนค่าเดิมหากรูปแบบไม่ถูกต้อง
  }

  // แยกหลัก:
  // d1 - d2 d3 X X - X X X X X - d11 d12 - d13
  const d1 = cleanCID.substring(0, 1);
  const d23 = cleanCID.substring(1, 3);
  const d1112 = cleanCID.substring(10, 12);
  const d13 = cleanCID.substring(12, 13);

  return `${d1}-${d23}XX-XXXXX-${d1112}-${d13}`;
}
