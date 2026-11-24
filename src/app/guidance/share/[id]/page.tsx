import type { Metadata } from "next";
import Link from "next/link";
import path from "path";
import { readFile } from "fs/promises";
import { connection } from "next/server";
import { assetUrl } from "@/lib/basepath";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ClipboardCheck, Compass, Download } from "lucide-react";

export const instant = false;

const STORAGE_DIR = path.join(process.cwd(), "storage", "guidance-cards");
const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://service.npc.ac.th";
const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/npc_admission" : "");

interface CardMeta {
  id: string;
  studentName: string;
  programName: string;
  topScorePct: number;
  selectedLevel: string;
  selectedCode: string;
  createdAt: string;
}

async function readCardMeta(rawId: string): Promise<CardMeta | null> {
  const cleanId = rawId.replace(/[^a-f0-9]/gi, "");
  if (!/^[a-f0-9]{16}$/.test(cleanId)) return null;

  try {
    const raw = await readFile(
      path.join(STORAGE_DIR, `${cleanId}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as CardMeta;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const meta = await readCardMeta(id);

  if (!meta) {
    return {
      title: "การ์ดผลลัพธ์แนะแนว | วิทยาลัยสารพัดช่างน่าน",
      description:
        "ค้นพบสาขาวิชาที่ใช่กับแบบประเมินความถนัด วิทยาลัยสารพัดช่างน่าน",
    };
  }

  const imageUrl = `${PUBLIC_ORIGIN}${BASE_PATH}/api/guidance/card-image/${meta.id}.png`;
  const pageUrl = `${PUBLIC_ORIGIN}${BASE_PATH}/guidance/share/${meta.id}`;
  const title = `ผลแนะแนวของ ${meta.studentName}: ${meta.programName} — วิทยาลัยสารพัดช่างน่าน`;
  const description = `ความถนัดตรงใจ ${meta.topScorePct}% กับ${meta.programName} ระดับ ${meta.selectedLevel} วิทยาลัยสารพัดช่างน่าน`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "NPC Admission วิทยาลัยสารพัดช่างน่าน",
      type: "website",
      locale: "th_TH",
      images: [
        {
          url: imageUrl,
          width: 1152,
          height: 2048,
          type: "image/png",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedGuidanceCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const meta = await readCardMeta(id);

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans text-slate-800">
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">
            ไม่พบการ์ดผลลัพธ์แนะแนวนี้
          </h1>
          <p className="text-sm text-slate-600">
            ลิงก์อาจหมดอายุหรือไม่ถูกต้อง คุณสามารถทำแบบประเมินความถนัดใหม่ได้ฟรีภายใน 1 นาที
          </p>
          <div className="pt-2">
            <Link
              href="/guidance"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>ทำแบบประเมินค้นหาสาขาที่ใช่</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cardImageSrc = assetUrl(`/api/guidance/card-image/${meta.id}.png`);
  const applyHref = `/apply?level=${encodeURIComponent(
    meta.selectedLevel
  )}&code=${encodeURIComponent(meta.selectedCode)}`;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans text-slate-800">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 flex flex-col items-center gap-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              ผลแนะแนวของ {meta.studentName}
            </h1>
            <p className="text-sm text-slate-600">
              {meta.programName} (ระดับ {meta.selectedLevel}) · ตรงใจ{" "}
              <span className="font-semibold text-[#162C63] tabular-nums">
                {meta.topScorePct}%
              </span>
            </p>
          </div>

          <div className="w-full max-w-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-[#0c2411]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImageSrc}
              alt={`การ์ดผลลัพธ์แนะแนว ${meta.programName}`}
              className="w-full h-auto block"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md pt-1">
            <Link
              href={applyHref}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#162C63] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>สมัครเรียนสาขานี้</span>
            </Link>
            <Link
              href="/guidance"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>ลองทำแบบทดสอบ</span>
            </Link>
          </div>

          <a
            href={cardImageSrc}
            download={`npc-career-card-${meta.selectedCode || meta.id}.png`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#162C63] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>บันทึกรูปภาพการ์ด (.PNG)</span>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
