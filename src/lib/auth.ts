import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

/**
 * แฮชรหัสผ่านด้วย bcrypt (ความปลอดภัยระดับสากล)
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * ตรวจสอบความถูกต้องของรหัสผ่าน รองรับทั้ง bcrypt และ fallback PBKDF2
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$")
  ) {
    return bcrypt.compareSync(password, storedHash);
  }

  // Fallback สำหรับแฮช PBKDF2 เดิม
  try {
    const [salt, iterationsStr, originalHash] = storedHash.split(":");
    const iterations = parseInt(iterationsStr, 10);
    const hash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

export interface AdminSessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

const SESSION_COOKIE_NAME = "npc_admin_session";

function getSecretKey(): string {
  return process.env.CID_HMAC_SECRET || "default_admin_secret_key_npc_admission";
}

/**
 * สร้าง Session Token ที่ลงนามด้วย HMAC-SHA256 (Tamper-proof)
 */
export function createAdminToken(user: AdminSessionUser): string {
  const payload = {
    ...user,
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000, // อายุ 8 ชั่วโมง
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * ตรวจสอบความถูกต้องของ Admin Session Token
 */
export function verifyAdminToken(token: string): AdminSessionUser | null {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(payloadBase64)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    );

    if (Date.now() > payload.exp) {
      return null; // หมดอายุ
    }

    return {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * ดึงเซสชันแอดมินจาก Request Cookies หรือ Authorization Header
 */
export async function getAdminSessionFromRequest(request: Request): Promise<AdminSessionUser | null> {
  // 1. จาก Cookie Header
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) {
      const user = verifyAdminToken(decodeURIComponent(match[1]));
      if (user) return user;
    }
  }

  // 2. จาก Bearer Token Header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = verifyAdminToken(token);
    if (user) return user;
  }

  return null;
}

export { SESSION_COOKIE_NAME };
