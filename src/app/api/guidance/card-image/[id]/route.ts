import path from "path";
import { readFile } from "fs/promises";

const STORAGE_DIR = path.join(process.cwd(), "storage", "guidance-cards");

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cleanId = id.replace(/\.png$/i, "");

    if (!/^[a-f0-9]{16}$/.test(cleanId)) {
      return new Response("Not Found", { status: 404 });
    }

    const filePath = path.join(STORAGE_DIR, `${cleanId}.png`);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
