import { NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB limit
const STORAGE_DIR = path.join(process.cwd(), "storage", "guidance-cards");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      imageDataUrl,
      studentName = "น้องผู้สมัคร",
      programName = "",
      topScorePct = 0,
      selectedLevel = "ปวช.",
      selectedCode = "",
    } = body || {};

    if (
      typeof imageDataUrl !== "string" ||
      !imageDataUrl.startsWith("data:image/png;base64,")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid PNG image data" },
        { status: 400 }
      );
    }

    const base64Data = imageDataUrl.slice("data:image/png;base64,".length);
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image size out of allowed bounds" },
        { status: 413 }
      );
    }

    const id = crypto.randomBytes(8).toString("hex");
    await mkdir(STORAGE_DIR, { recursive: true });

    const meta = {
      id,
      studentName: String(studentName).slice(0, 80),
      programName: String(programName).slice(0, 120),
      topScorePct: Number(topScorePct) || 0,
      selectedLevel: String(selectedLevel).slice(0, 20),
      selectedCode: String(selectedCode).slice(0, 20),
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      writeFile(path.join(STORAGE_DIR, `${id}.png`), buffer),
      writeFile(
        path.join(STORAGE_DIR, `${id}.json`),
        JSON.stringify(meta, null, 2),
        "utf-8"
      ),
    ]);

    return NextResponse.json({
      success: true,
      id,
      sharePath: `/guidance/share/${id}`,
      imagePath: `/api/guidance/card-image/${id}.png`,
    });
  } catch (err) {
    console.error("Failed to save guidance card image:", err);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถบันทึกรูปภาพการ์ดได้" },
      { status: 500 }
    );
  }
}
