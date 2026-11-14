import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logId } = body;

    if (logId) {
      await prisma.guidanceAssessmentLog.update({
        where: { id: logId },
        data: {
          sharedCardCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/guidance/share:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
